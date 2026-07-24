// Fixnet entity types — see Fixnet_SRS.md, section 3.

export type ServiceCategory = 'ai' | 'game' | 'streaming' | 'browser' | 'messenger' | 'other';

export type DetectionMethod = 'domain' | 'exe' | 'game' | 'manual';

export type Encryption = 'on' | 'off';

export type TransportType = 'udp' | 'tcp' | 'mixed';

export type DnsMode = 'default' | 'custom';

export type ConnectionMode = 'default' | 'fast' | 'stable' | 'secure';

export type ServiceStatus = 'inactive' | 'connecting' | 'connected' | 'degraded' | 'error';

export interface NetworkRule {
  id: string;
  type: 'port' | 'ipRange' | 'protocol';
  value: string;
  direction: 'inbound' | 'outbound' | 'both';
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  category: ServiceCategory;
  detectionMethod: DetectionMethod;
  domains: string[];
  includeSubdomains: boolean;
  exePath: string | null;
  ipRange: string | null;
  additionalRules: NetworkRule[];
  region: string;
  enabled: boolean;
  encryption: Encryption;
  transportType: TransportType;
  dnsMode: DnsMode;
  connectionMode: ConnectionMode;
  advancedSettings: Record<string, unknown>;
  isCustom: boolean;
  status: ServiceStatus;
  addedFromLibrary: boolean;
}

export interface Region {
  id: string;
  displayName: string;
  country: string;
  serverLoad: number;
  recommendedFor: ServiceCategory[];
}

export type RouteStatus = 'idle' | 'active' | 'degraded' | 'unavailable';

export interface Route {
  id: string;
  serviceId: string;
  regionId: string;
  status: RouteStatus;
  latencyMs: number;
  stability: number;
  usesBridge: boolean;
}

export interface QualitySample {
  timestamp: number;
  latencyMs: number;
  stability: number;
}

export interface Connection {
  id: string;
  routeId: string;
  startedAt: number;
  endedAt: number | null;
  qualityHistory: QualitySample[];
}

export type BridgeStatus = 'available' | 'connecting' | 'connected' | 'failed';

export interface Bridge {
  id: string;
  name: string;
  status: BridgeStatus;
  triggeredBy: string | null;
  isAuto: boolean;
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ru';

export interface DnsSettings {
  current: string;
  backups: string[];
}

export interface AppSettings {
  autoLaunch: boolean;
  launchInTray: boolean;
  reconnectOnStartup: boolean;
  closeToTray: boolean;
  theme: Theme;
  language: Language;
  region: string;
  dns: DnsSettings;
  showAdvancedSettings: boolean;
  advancedNetwork: {
    degradationChance: number;
    tickIntervalMs: number;
    autoBridge: boolean;
  };
}

export type SubscriptionStatus = 'active' | 'expired' | 'trial';

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: number;
  homeRegion: string | null;
}

export interface LibraryEntry {
  id: string;
  name: string;
  icon: string;
  category: ServiceCategory;
  domains: string[];
  recommendedRegion: string;
  description: string;
  popular: boolean;
}
