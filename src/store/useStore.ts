import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  Service,
  Route,
  RouteStatus,
  ServiceStatus,
  Connection,
  Preset,
  Bridge,
  BridgeStatus,
  AppNotification,
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

export type TabId = 'dashboard' | 'library' | 'presets' | 'settings';

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
  presets: Preset[];
  notifications: AppNotification[];
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
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  performNotificationAction: (notificationId: string, actionType: string) => void;

  // presets
  createPreset: (name: string, serviceIds: string[]) => void;
  launchPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  removeServiceFromPreset: (presetId: string, serviceId: string) => void;
  addServicesToPreset: (presetId: string, serviceIds: string[]) => void;

  // settings
  updateAppSettings: (patch: Partial<AppSettings>) => void;
  updateAdvancedNetwork: (patch: Partial<AppSettings['advancedNetwork']>) => void;
  updateConnectionDefaults: (patch: Partial<AppSettings['connectionDefaults']>) => void;

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

const MAX_NOTIFICATIONS = 60;
const MAX_QUALITY_SAMPLES = 40;

function clearPresetActivity(presets: Preset[]): Preset[] {
  return presets.map((p) => (p.isActive ? { ...p, isActive: false } : p));
}

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
  presets: [],
  notifications: [],
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
      presets: clearPresetActivity(state.presets),
    }));
  },

  createCustomService: (input) => {
    const service = serviceFromCustomInput(input);
    const route = routeForService(service);
    set((state) => ({
      library: [...state.library, service],
      routes: { ...state.routes, [service.id]: route },
      presets: clearPresetActivity(state.presets),
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
        presets: clearPresetActivity(state.presets),
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
      presets: clearPresetActivity(state.presets),
    }));
  },

  toggleServiceEnabled: (serviceId) => {
    const state = get();
    const service = state.library.find((s) => s.id === serviceId);
    if (!service) return;
    const nextEnabled = !service.enabled;
    set((s) => ({
      library: s.library.map((sv) => (sv.id === serviceId ? { ...sv, enabled: nextEnabled } : sv)),
      presets: clearPresetActivity(s.presets),
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
      presets: clearPresetActivity(s.presets),
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
        presets: clearPresetActivity(s.presets),
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
        presets: clearPresetActivity(s.presets),
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
        presets: clearPresetActivity(s.presets),
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
      presets: clearPresetActivity(s.presets),
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
      presets: clearPresetActivity(s.presets),
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

  pushNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id: nanoid(),
      createdAt: Date.now(),
      read: false,
    };
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
  },

  performNotificationAction: (notificationId, actionType) => {
    const state = get();
    const notification = state.notifications.find((n) => n.id === notificationId);
    get().markNotificationRead(notificationId);
    if (!notification || !notification.relatedServiceId) return;
    const serviceId = notification.relatedServiceId;

    import('../sim/engine').then(({ connectBridgeFor, retryService }) => {
      if (actionType === 'connect_bridge') {
        connectBridgeFor(serviceId, false);
      } else if (actionType === 'switch_route') {
        retryService(serviceId);
      } else if (actionType === 'go_to_service') {
        set({ activeTab: 'dashboard', activeServiceId: serviceId });
      }
    });
  },

  createPreset: (name, serviceIds) => {
    const state = get();
    const serviceConfigs = serviceIds
      .map((id) => state.library.find((s) => s.id === id))
      .filter((s): s is Service => Boolean(s))
      .map((s) => ({
        serviceId: s.id,
        region: s.region,
        enabled: true,
        encryption: s.encryption,
        transportType: s.transportType,
      }));
    const preset: Preset = {
      id: nanoid(),
      name,
      serviceConfigs,
      isActive: true,
      createdAt: Date.now(),
    };
    set((s) => ({ presets: [...clearPresetActivity(s.presets), preset] }));
    get().showToast(`Preset "${name}" created`);
  },

  removeServiceFromPreset: (presetId, serviceId) => {
    set((s) => ({
      presets: s.presets.map((p) =>
        p.id === presetId
          ? { ...p, serviceConfigs: p.serviceConfigs.filter((c) => c.serviceId !== serviceId) }
          : p
      ),
    }));
  },

  addServicesToPreset: (presetId, serviceIds) => {
    const state = get();
    const preset = state.presets.find((p) => p.id === presetId);
    if (!preset) return;
    set((s) => ({
      presets: s.presets.map((p) => {
        if (p.id !== presetId) return p;
        const existingIds = new Set(p.serviceConfigs.map((c) => c.serviceId));
        const newConfigs = serviceIds
          .filter((id) => !existingIds.has(id))
          .map((id) => state.library.find((sv) => sv.id === id))
          .filter((sv): sv is Service => Boolean(sv))
          .map((sv) => ({
            serviceId: sv.id,
            region: sv.region,
            enabled: true,
            encryption: sv.encryption,
            transportType: sv.transportType,
          }));
        return { ...p, serviceConfigs: [...p.serviceConfigs, ...newConfigs] };
      }),
    }));
    get().showToast(`Services added to preset "${preset.name}"`);
  },

  // Launches a preset immediately: applies its members' saved settings, turns
  // off any other running service (fresh session — only the preset's
  // services), and starts. No confirmation step.
  launchPreset: (presetId) => {
    const state = get();
    const preset = state.presets.find((p) => p.id === presetId);
    if (!preset) return;

    function applyAndStart() {
      set((s) => ({
        library: s.library.map((service) => {
          const cfg = preset!.serviceConfigs.find((c) => c.serviceId === service.id);
          if (cfg) {
            return {
              ...service,
              region: cfg.region,
              enabled: true,
              encryption: cfg.encryption,
              transportType: cfg.transportType,
            };
          }
          return service.enabled ? { ...service, enabled: false } : service;
        }),
        routes: Object.fromEntries(
          Object.entries(s.routes).map(([sid, route]) => {
            const cfg = preset!.serviceConfigs.find((c) => c.serviceId === sid);
            return [sid, cfg ? { ...route, regionId: cfg.region } : route];
          })
        ),
        presets: s.presets.map((p) => ({ ...p, isActive: p.id === presetId })),
      }));
      get().startAll();
    }

    if (state.isRunning) {
      import('../sim/engine').then(({ stopSimulation }) => {
        stopSimulation();
        applyAndStart();
      });
    } else {
      applyAndStart();
    }
  },

  deletePreset: (presetId) => {
    set((state) => ({ presets: state.presets.filter((p) => p.id !== presetId) }));
  },

  updateAppSettings: (patch) => {
    set((state) => ({ appSettings: { ...state.appSettings, ...patch } }));
  },

  updateAdvancedNetwork: (patch) => {
    set((state) => ({
      appSettings: {
        ...state.appSettings,
        advancedNetwork: { ...state.appSettings.advancedNetwork, ...patch },
      },
    }));
    if (patch.tickIntervalMs !== undefined) {
      import('../sim/engine').then(({ updateTickInterval }) => updateTickInterval());
    }
  },

  updateConnectionDefaults: (patch) => {
    set((state) => ({
      appSettings: {
        ...state.appSettings,
        connectionDefaults: { ...state.appSettings.connectionDefaults, ...patch },
      },
    }));
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
      presets: clearPresetActivity(s.presets),
      isFirstLoginOfSession: false,
      user: userCountry !== null ? { ...s.user, country: userCountry } : s.user,
    }));

    // Auto-save the onboarding selection as a preset so it can be quickly relaunched later
    const afterState = get();
    const selectedNames = new Set(
      entryIds.map((id) => catalogById(id)).filter((e): e is NonNullable<typeof e> => !!e).map((e) => e.name)
    );
    const onboardingConfigs = afterState.library
      .filter((sv) => selectedNames.has(sv.name))
      .map((sv) => ({
        serviceId: sv.id,
        region: sv.region,
        enabled: sv.enabled,
        encryption: sv.encryption,
        transportType: sv.transportType,
      }));

    set((s) => {
      const existingIdx = s.presets.findIndex((p) => p.name === 'Onboarding preset');
      const preset: Preset = {
        id: existingIdx >= 0 ? s.presets[existingIdx].id : nanoid(),
        name: 'Onboarding preset',
        serviceConfigs: onboardingConfigs,
        isActive: false,
        createdAt: Date.now(),
      };
      const presets =
        existingIdx >= 0
          ? s.presets.map((p, i) => (i === existingIdx ? preset : p))
          : [...s.presets, preset];
      return { presets };
    });

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
