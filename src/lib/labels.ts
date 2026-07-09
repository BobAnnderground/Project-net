import type { ServiceCategory, TransportType, ConnectionMode } from '../types';

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  ai: 'AI',
  game: 'Game',
  streaming: 'Streaming',
  browser: 'Browser',
  messenger: 'Messenger',
  other: 'Other',
};

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  udp: 'UDP',
  tcp: 'TCP',
  mixed: 'Mixed (UDP + TCP)',
};

export const TRANSPORT_TYPE_CHIP_LABELS: Record<TransportType, string> = {
  udp: 'UDP',
  tcp: 'TCP',
  mixed: 'Mixed',
};

export const CONNECTION_MODE_LABELS: Record<ConnectionMode, string> = {
  default: 'Default',
  fast: 'Fast',
  stable: 'Stable',
  secure: 'Secure',
};

export function formatLatency(ms: number): string {
  return ms > 0 ? `${Math.round(ms)} ms` : '—';
}
