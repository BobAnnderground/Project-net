import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  Service,
  Route,
  RouteStatus,
  ServiceStatus,
  Connection,
  Bridge,
  BridgeStatus,
  AppSettings,
  User,
} from '../types';
import { catalogById } from '../data/catalog';
import {
  serviceFromLibraryEntry,
  serviceFromCustomInput,
  routeForService,
  defaultAppSettings,
  defaultUser,
  type CustomServiceInput,
} from '../data/factory';

export type TabId = 'dashboard' | 'services' | 'settings';

interface RoutePatch {
  latencyMs?: number;
  stability?: number;
  usesBridge?: boolean;
}

interface ToastState {
  id: string;
  message: string;
}

interface EmergencyBridge {
  code: string;
  addedAt: number;
  status: 'active' | 'failed';
}

interface StoreState {
  isAuthenticated: boolean;
  isFirstLoginOfSession: boolean;
  authKey: string;
  user: User;
  appSettings: AppSettings;
  library: Service[];
  routes: Record<string, Route>;
  connections: Record<string, Connection>;
  bridges: Bridge[];
  isRunning: boolean;
  lastSessionServiceIds: string[];
  activeTab: TabId;
  activeServiceId: string | null;
  toast: ToastState | null;
  emergencyBridge: EmergencyBridge | null;

  // library / service management
  addServiceFromLibrary: (entryId: string) => void;
  createCustomService: (input: CustomServiceInput) => void;
  removeService: (serviceId: string) => void;
  updateService: (serviceId: string, patch: Partial<Service>) => void;
  toggleServiceEnabled: (serviceId: string) => void;
  enableServices: (serviceIds: string[]) => void;
  // catalog-driven toggle (Library screen card click)
  toggleCatalogSelection: (entryId: string) => void;
  // ensure a service exists for an entry and return its id (Library settings click)
  getOrCreateServiceForEntry: (entryId: string) => string;

  // run control
  startAll: () => void;
  stopAll: () => void;
  relaunchLastSession: () => void;
  startWithOnly: (serviceIds: string[]) => void;

  // engine hooks
  setServiceStatus: (serviceId: string, status: ServiceStatus) => void;
  setRouteStatus: (serviceId: string, status: RouteStatus, patch?: RoutePatch) => void;
  ensureBridge: (serviceId: string, isAuto: boolean) => string;
  setBridgeStatus: (bridgeId: string, status: BridgeStatus) => void;

  // settings
  updateAppSettings: (patch: Partial<AppSettings>) => void;
  updateDns: (patch: Partial<AppSettings['dns']>) => void;
  addBackupDns: () => void;
  updateBackupDns: (index: number, value: string) => void;
  removeBackupDns: (index: number) => void;
  resetAppSettings: () => void;

  // auth
  login: (code: string) => boolean;
  logout: () => void;
  regenerateAuthKey: () => void;
  commitOnboardingSelection: (entryIds: string[], userCountry: string | null) => void;
  skipOnboarding: () => void;

  // ui
  setActiveTab: (tab: TabId) => void;
  openServiceDetail: (serviceId: string) => void;
  closeServiceDetail: () => void;
  showToast: (message: string) => void;
  addEmergencyBridge: (code: string) => void;
}

const MAX_QUALITY_SAMPLES = 40;

export const useStore = create<StoreState>((set, get) => ({
  isAuthenticated: false,
  isFirstLoginOfSession: false,
  authKey: '1111111111111111',
  user: defaultUser,
  appSettings: defaultAppSettings,
  library: [],
  routes: {},
  connections: {},
  bridges: [],
  isRunning: false,
  lastSessionServiceIds: [],
  activeTab: 'dashboard',
  activeServiceId: null,
  toast: null,
  emergencyBridge: {
    code: 'BRIDGE-7F3K9Q-2LX8M1',
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    status: 'failed',
  },

  addServiceFromLibrary: (entryId) => {
    const entry = catalogById(entryId);
    if (!entry) return;
    const service = serviceFromLibraryEntry(entry);
    const route = routeForService(service);
    set((state) => ({
      library: [...state.library, service],
      routes: { ...state.routes, [service.id]: route },
    }));
  },

  createCustomService: (input) => {
    const service = serviceFromCustomInput(input);
    const route = routeForService(service);
    set((state) => ({
      library: [...state.library, service],
      routes: { ...state.routes, [service.id]: route },
    }));
    get().showToast('Service added to library');
  },

  removeService: (serviceId) => {
    import('../sim/engine').then(({ stopService }) => stopService(serviceId));
    set((state) => {
      const routes = { ...state.routes };
      delete routes[serviceId];
      const connections = { ...state.connections };
      delete connections[serviceId];
      return {
        library: state.library.filter((s) => s.id !== serviceId),
        routes,
        connections,
        activeServiceId: state.activeServiceId === serviceId ? null : state.activeServiceId,
      };
    });
  },

  updateService: (serviceId, patch) => {
    set((state) => ({
      library: state.library.map((s) => (s.id === serviceId ? { ...s, ...patch } : s)),
      routes:
        patch.region !== undefined && state.routes[serviceId]
          ? {
              ...state.routes,
              [serviceId]: { ...state.routes[serviceId], regionId: patch.region },
            }
          : state.routes,
    }));
  },

  toggleServiceEnabled: (serviceId) => {
    const state = get();
    const service = state.library.find((s) => s.id === serviceId);
    if (!service) return;
    const nextEnabled = !service.enabled;
    set((s) => ({
      library: s.library.map((sv) => (sv.id === serviceId ? { ...sv, enabled: nextEnabled } : sv)),
    }));
    if (state.isRunning) {
      import('../sim/engine').then(({ beginConnect, stopService }) => {
        if (nextEnabled) beginConnect(serviceId);
        else stopService(serviceId);
      });
    }
  },

  enableServices: (serviceIds) => {
    const state = get();
    const idsToEnable = serviceIds.filter((id) => {
      const svc = state.library.find((s) => s.id === id);
      return svc && !svc.enabled;
    });
    if (idsToEnable.length === 0) return;
    const idsSet = new Set(idsToEnable);
    set((s) => ({
      library: s.library.map((sv) => (idsSet.has(sv.id) ? { ...sv, enabled: true } : sv)),
    }));
    if (state.isRunning) {
      import('../sim/engine').then(({ beginConnect }) => {
        idsToEnable.forEach((id) => beginConnect(id));
      });
    }
  },

  // Launches a fresh session containing only the given services — anything
  // else that was enabled (e.g. a previous session) is turned off first,
  // rather than added to.
  startWithOnly: (serviceIds) => {
    const idsSet = new Set(serviceIds);

    function applyAndStart() {
      set((s) => ({
        library: s.library.map((sv) => ({ ...sv, enabled: idsSet.has(sv.id) })),
      }));
      get().startAll();
    }

    if (get().isRunning) {
      import('../sim/engine').then(({ stopSimulation }) => {
        stopSimulation();
        applyAndStart();
      });
    } else {
      applyAndStart();
    }
  },

  toggleCatalogSelection: (entryId) => {
    const entry = catalogById(entryId);
    if (!entry) return;
    const state = get();
    const existing = state.library.find(
      (s) => s.addedFromLibrary === true && s.name === entry.name
    );
    if (existing) {
      const nextEnabled = !existing.enabled;
      set((s) => ({
        library: s.library.map((sv) =>
          sv.id === existing.id ? { ...sv, enabled: nextEnabled } : sv
        ),
      }));
      if (state.isRunning) {
        import('../sim/engine').then(({ beginConnect, stopService }) => {
          if (nextEnabled) beginConnect(existing.id);
          else stopService(existing.id);
        });
      }
    } else {
      const service = { ...serviceFromLibraryEntry(entry), enabled: true };
      const route = routeForService(service);
      set((s) => ({
        library: [...s.library, service],
        routes: { ...s.routes, [service.id]: route },
      }));
      if (state.isRunning) {
        import('../sim/engine').then(({ beginConnect }) => {
          beginConnect(service.id);
        });
      }
    }
  },

  getOrCreateServiceForEntry: (entryId) => {
    const entry = catalogById(entryId);
    if (!entry) return '';
    const state = get();
    const existing = state.library.find(
      (s) => s.addedFromLibrary === true && s.name === entry.name
    );
    if (existing) return existing.id;
    const service = serviceFromLibraryEntry(entry); // enabled: false — peek only
    const route = routeForService(service);
    set((s) => ({
      library: [...s.library, service],
      routes: { ...s.routes, [service.id]: route },
    }));
    return service.id;
  },

  startAll: () => {
    set({ isRunning: true });
    import('../sim/engine').then(({ startSimulation }) => startSimulation());
  },

  stopAll: () => {
    import('../sim/engine').then(({ stopSimulation }) => stopSimulation());
    set((state) => ({
      isRunning: false,
      lastSessionServiceIds: state.library.filter((s) => s.enabled).map((s) => s.id),
    }));
  },

  relaunchLastSession: () => {
    const state = get();
    const idsStillInLibrary = new Set(state.library.map((s) => s.id));
    const toEnable = state.lastSessionServiceIds.filter((id) => idsStillInLibrary.has(id));
    if (toEnable.length === 0) return;
    set((s) => ({
      library: s.library.map((sv) =>
        toEnable.includes(sv.id) ? { ...sv, enabled: true } : sv
      ),
    }));
    get().startAll();
  },

  setServiceStatus: (serviceId, status) => {
    set((state) => ({
      library: state.library.map((s) => (s.id === serviceId ? { ...s, status } : s)),
    }));

    const state = get();
    const route = state.routes[serviceId];
    if (!route) return;

    if (status === 'connected') {
      const existing = state.connections[serviceId];
      if (!existing || existing.endedAt !== null) {
        const connection: Connection = {
          id: nanoid(),
          routeId: route.id,
          startedAt: Date.now(),
          endedAt: null,
          qualityHistory: [],
        };
        set((s) => ({ connections: { ...s.connections, [serviceId]: connection } }));
      }
    } else if (status === 'inactive') {
      const existing = state.connections[serviceId];
      if (existing && existing.endedAt === null) {
        set((s) => ({
          connections: {
            ...s.connections,
            [serviceId]: { ...existing, endedAt: Date.now() },
          },
        }));
      }
    }
  },

  setRouteStatus: (serviceId, status, patch) => {
    set((state) => {
      const current = state.routes[serviceId];
      if (!current) return {};
      const updated: Route = {
        ...current,
        status,
        ...(patch?.latencyMs !== undefined ? { latencyMs: patch.latencyMs } : {}),
        ...(patch?.stability !== undefined ? { stability: patch.stability } : {}),
        ...(patch?.usesBridge !== undefined ? { usesBridge: patch.usesBridge } : {}),
      };
      return { routes: { ...state.routes, [serviceId]: updated } };
    });

    if ((status === 'active' || status === 'degraded') && (patch?.latencyMs !== undefined || patch?.stability !== undefined)) {
      set((state) => {
        const conn = state.connections[serviceId];
        if (!conn) return {};
        const route = state.routes[serviceId];
        const sample = {
          timestamp: Date.now(),
          latencyMs: route.latencyMs,
          stability: route.stability,
        };
        const qualityHistory = [...conn.qualityHistory, sample].slice(-MAX_QUALITY_SAMPLES);
        return { connections: { ...state.connections, [serviceId]: { ...conn, qualityHistory } } };
      });
    }
  },

  ensureBridge: (serviceId, isAuto) => {
    const state = get();
    const existing = state.bridges.find((b) => b.triggeredBy === serviceId && b.status !== 'failed');
    if (existing) return existing.id;
    const bridge: Bridge = {
      id: nanoid(),
      name: `Bridge-${state.bridges.length + 1}`,
      status: 'available',
      triggeredBy: serviceId,
      isAuto,
    };
    set((s) => ({ bridges: [...s.bridges, bridge] }));
    return bridge.id;
  },

  setBridgeStatus: (bridgeId, status) => {
    set((state) => ({
      bridges: state.bridges.map((b) => (b.id === bridgeId ? { ...b, status } : b)),
    }));
  },

  updateAppSettings: (patch) => {
    set((state) => ({ appSettings: { ...state.appSettings, ...patch } }));
  },

  updateDns: (patch) => {
    set((state) => ({
      appSettings: {
        ...state.appSettings,
        dns: { ...state.appSettings.dns, ...patch },
      },
    }));
  },

  addBackupDns: () => {
    set((state) => ({
      appSettings: {
        ...state.appSettings,
        dns: { ...state.appSettings.dns, backups: [...state.appSettings.dns.backups, ''] },
      },
    }));
  },

  updateBackupDns: (index, value) => {
    set((state) => ({
      appSettings: {
        ...state.appSettings,
        dns: {
          ...state.appSettings.dns,
          backups: state.appSettings.dns.backups.map((b, i) => (i === index ? value : b)),
        },
      },
    }));
  },

  removeBackupDns: (index) => {
    set((state) => ({
      appSettings: {
        ...state.appSettings,
        dns: {
          ...state.appSettings.dns,
          backups: state.appSettings.dns.backups.filter((_, i) => i !== index),
        },
      },
    }));
  },

  resetAppSettings: () => {
    set({
      appSettings: {
        ...defaultAppSettings,
        dns: { ...defaultAppSettings.dns, backups: [...defaultAppSettings.dns.backups] },
        advancedNetwork: { ...defaultAppSettings.advancedNetwork },
      },
    });
  },

  login: (code) => {
    if (code === get().authKey) {
      set({ isAuthenticated: true, isFirstLoginOfSession: true });
      return true;
    }
    return false;
  },

  regenerateAuthKey: () => {
    const newKey = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    set({ authKey: newKey });
  },

  logout: () => {
    if (get().isRunning) {
      get().stopAll();
    }
    set({ isAuthenticated: false });
  },

  commitOnboardingSelection: (entryIds, userCountry) => {
    const state = get();
    const addedNames = new Set(
      state.library.filter((s) => s.addedFromLibrary).map((s) => s.name)
    );

    const newServices: Service[] = [];
    const newRoutes: Record<string, Route> = {};
    const libraryUpdates: Record<string, { enabled: boolean }> = {};

    for (const id of entryIds) {
      const entry = catalogById(id);
      if (!entry) continue;

      if (addedNames.has(entry.name)) {
        // Service already exists — ensure enabled
        const existing = state.library.find(
          (s) => s.addedFromLibrary === true && s.name === entry.name
        );
        if (existing) {
          libraryUpdates[existing.id] = { enabled: true };
        }
      } else {
        // Create new service with enabled: true, routed via its recommended proxy region
        const service = { ...serviceFromLibraryEntry(entry), enabled: true };
        const route = routeForService(service);
        newServices.push(service);
        newRoutes[service.id] = route;
      }
    }

    set((s) => ({
      library: [
        ...s.library.map((sv) => {
          const upd = libraryUpdates[sv.id];
          return upd !== undefined ? { ...sv, ...upd } : sv;
        }),
        ...newServices,
      ],
      routes: { ...s.routes, ...newRoutes },
      isFirstLoginOfSession: false,
      user: userCountry !== null ? { ...s.user, country: userCountry } : s.user,
    }));

    get().startAll();
  },

  skipOnboarding: () => {
    set({ isFirstLoginOfSession: false });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  openServiceDetail: (serviceId) => set({ activeServiceId: serviceId }),
  closeServiceDetail: () => set({ activeServiceId: null }),

  showToast: (message) => {
    const id = nanoid();
    set({ toast: { id, message } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 5000);
  },

  addEmergencyBridge: (code) => {
    set({ emergencyBridge: { code, addedAt: Date.now(), status: 'active' } });
    get().showToast('Emergency bridge added successfully. It will stay active until the next configuration update.');
  },
}));
