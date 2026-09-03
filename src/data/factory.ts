import { nanoid } from 'nanoid';
import type { LibraryEntry, Service, Route, AppSettings, User, AppNotification } from '../types';
import { REGIONS } from './regions';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function serviceFromLibraryEntry(entry: LibraryEntry): Service {
  return {
    id: nanoid(),
    name: entry.name,
    icon: entry.icon,
    category: entry.category,
    detectionMethod: entry.category === 'game' ? 'game' : entry.domains.length ? 'domain' : 'exe',
    domains: entry.domains,
    includeSubdomains: false,
    exePath: null,
    ipRange: null,
    additionalRules: [],
    region: entry.recommendedRegion,
    enabled: false,
    encryption: 'on',
    transportType: 'mixed',
    dnsMode: 'default',
    connectionMode: entry.recommendedConnectionMode,
    advancedSettings: {},
    isCustom: false,
    status: 'inactive',
    addedFromLibrary: true,
  };
}

export interface CustomServiceInput {
  name: string;
  domains: string[];
  includeSubdomains: boolean;
  exePath: string | null;
  ipRange: string | null;
}

export function serviceFromCustomInput(input: CustomServiceInput): Service {
  return {
    id: nanoid(),
    name: input.name,
    icon: '⚙️',
    category: 'other',
    detectionMethod: 'manual',
    domains: input.domains,
    includeSubdomains: input.includeSubdomains,
    exePath: input.exePath,
    ipRange: input.ipRange,
    additionalRules: [],
    region: REGIONS[0].id,
    enabled: false,
    encryption: 'on',
    transportType: 'mixed',
    dnsMode: 'default',
    connectionMode: 'default',
    advancedSettings: {},
    isCustom: true,
    status: 'inactive',
    addedFromLibrary: false,
  };
}

export function routeForService(service: Service): Route {
  return {
    id: nanoid(),
    serviceId: service.id,
    regionId: service.region,
    status: 'idle',
    latencyMs: 0,
    stability: 100,
    usesBridge: false,
  };
}

export const defaultAppSettings: AppSettings = {
  autoLaunch: true,
  launchInTray: true,
  reconnectOnStartup: true,
  closeToTray: false,
  theme: 'dark',
  language: 'en',
  region: REGIONS[0].id,
  dns: {
    current: '1.1.1.1',
    backups: [''],
  },
  showAdvancedSettings: false,
  advancedNetwork: {
    degradationChance: 12,
    tickIntervalMs: 4000,
    autoBridge: true,
  },
};

export const defaultUser: User = {
  id: 'user-1',
  name: 'Alex',
  email: 'anius14.8@gmail.com',
  subscriptionStatus: 'trial',
  subscriptionExpiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
  homeRegion: null,
};

// Seed content, not live engine output — matches the example copy from the
// Figma notification-window design so the panel has something to show.
export function defaultNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: nanoid(),
      tone: 'neutral',
      icon: 'server',
      title: 'Server update',
      message: 'The Amsterdam server address has changed. Reconnect to apply the update',
      createdAt: now - 15 * MINUTE,
      read: false,
      toastDismissed: true,
      action: { label: 'Reconnect', actionType: 'reconnect' },
    },
    {
      id: nanoid(),
      tone: 'negative',
      icon: 'server-off',
      title: 'Server temporarily unavailable',
      message: 'The Singapore server is undergoing maintenance and will be back shortly',
      createdAt: now - 2 * HOUR,
      read: false,
      toastDismissed: true,
      action: null,
    },
    {
      id: nanoid(),
      tone: 'positive',
      icon: 'region',
      title: 'New region',
      message: 'São Paulo is now available as a connection region',
      createdAt: now - 5 * DAY,
      read: false,
      toastDismissed: true,
      action: null,
    },
    {
      id: nanoid(),
      tone: 'neutral',
      icon: 'library',
      title: 'New service in the library',
      message: '"Notion" is now available to add from our library',
      createdAt: now - 12 * DAY,
      read: true,
      toastDismissed: true,
      action: null,
    },
    {
      id: nanoid(),
      tone: 'negative',
      icon: 'billing',
      title: 'Subscription ending soon',
      message: 'Only 2 days left. Renew now to avoid losing access',
      createdAt: now - 18 * DAY,
      read: true,
      toastDismissed: true,
      action: null,
    },
    {
      id: nanoid(),
      tone: 'positive',
      icon: 'chat',
      title: 'New reply',
      message: 'You have a new reply in your support chat',
      createdAt: now - 25 * DAY,
      read: true,
      toastDismissed: true,
      action: null,
    },
    {
      id: nanoid(),
      tone: 'positive',
      icon: 'chat',
      title: 'Waiting on you',
      message: 'Support is waiting for your reply to continue helping',
      createdAt: now - 33 * DAY,
      read: true,
      toastDismissed: true,
      action: null,
    },
    {
      id: nanoid(),
      tone: 'negative',
      icon: 'billing',
      title: 'Time to renew',
      message: 'Your subscription expires soon — renew to keep your services connected',
      createdAt: now - 45 * DAY,
      read: false,
      toastDismissed: true,
      action: null,
    },
  ];
}
