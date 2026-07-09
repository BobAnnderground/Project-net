import type { ServiceStatus } from '../../types';

const LABELS: Record<ServiceStatus, string> = {
  inactive: 'Off',
  connecting: 'Connecting…',
  connected: 'Connected',
  degraded: 'Degraded',
  error: 'Error',
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={`status-badge status--${status}`}>
      <span className="status-dot" />
      {LABELS[status]}
    </span>
  );
}
