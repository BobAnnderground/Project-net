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

export const CONNECTION_MODE_LABELS: Record<ConnectionMode, string> = {
  default: 'Default',
  fast: 'Fast',
  stable: 'Stable',
  secure: 'Secure',
};

const CONNECTION_MODE_CHIP_LABELS: Record<ConnectionMode, string> = {
  default: 'General',
  fast: 'Fast',
  stable: 'Stable',
  secure: 'Secure',
};

/** Short badge text for a service card: category-flavored connection mode, e.g. "Secure", "Fast gaming", "Gaming". */
export function connectionModeChipLabel(mode: ConnectionMode, category: ServiceCategory): string {
  const label = CONNECTION_MODE_CHIP_LABELS[mode];
  if (category !== 'game') return label;
  return label === 'General' ? 'Gaming' : `${label} gaming`;
}

export function formatLatency(ms: number): string {
  return ms > 0 ? `${Math.round(ms)} ms` : '—';
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "15m ago" / "2h ago" within the last day, otherwise "Mon D". */
export function formatNotificationTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const date = new Date(timestamp);
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}
