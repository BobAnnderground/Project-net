import { nanoid } from 'nanoid';
import type { LibraryEntry, Service, Route, AppSettings, User } from '../types';
import { REGIONS } from './regions';

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
    connectionMode: 'default',
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
  autoLaunch: false,
  launchInTray: false,
  reconnectOnStartup: false,
  closeToTray: true,
  theme: 'dark',
  language: 'en',
  region: REGIONS[0].id,
  dns: {
    current: '1.1.1.1',
    backups: ['8.8.8.8', '8.8.4.4', '9.9.9.9'],
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
  country: null,
};
