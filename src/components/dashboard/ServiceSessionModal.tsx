import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Toggle } from '../common/Toggle';
import { QualityChart } from '../common/QualityChart';
import { useStore } from '../../store/useStore';
import { formatLatency } from '../../lib/labels';

export function ServiceSessionModal({ serviceId, onClose }: { serviceId: string; onClose: () => void }) {
  const service = useStore((s) => s.library.find((sv) => sv.id === serviceId));
  const route = useStore((s) => s.routes[serviceId]);
  const connection = useStore((s) => s.connections[serviceId]);
  const bridges = useStore((s) => s.bridges);
  const toggleServiceEnabled = useStore((s) => s.toggleServiceEnabled);
  const performNotificationAction = useStore((s) => s.performNotificationAction);

  if (!service || !route) return null;

  const bridge = bridges.find((b) => b.triggeredBy === serviceId && route.usesBridge);
  const history = connection?.qualityHistory ?? [];

  return (
    <Modal title={service.name} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-16)' }}>
        <StatusBadge status={service.status} />
        <Toggle on={service.enabled} onClick={() => toggleServiceEnabled(service.id)} />
      </div>

      <div className="detail-grid">
        <div className="detail-stat">
          <div className="detail-stat__label">Latency</div>
          <div className="detail-stat__value">{formatLatency(route.latencyMs)}</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat__label">Stability</div>
          <div className="detail-stat__value">{route.status === 'idle' ? '—' : `${Math.round(route.stability)}%`}</div>
        </div>
      </div>

      <div className="chart-wrap" style={{ marginBottom: 'var(--space-16)' }}>
        <div className="chart-title">Latency (ms)</div>
        <QualityChart samples={history} metric="latencyMs" color="var(--accent)" />
      </div>
      <div className="chart-wrap" style={{ marginBottom: 'var(--space-16)' }}>
        <div className="chart-title">Stability (%)</div>
        <QualityChart samples={history} metric="stability" color="var(--ok)" />
      </div>

      {route.usesBridge && bridge && (
        <div className="warning-box" style={{ marginBottom: 'var(--space-12)', borderColor: 'var(--info)', background: 'rgba(125,143,240,0.1)', color: 'var(--info)' }}>
          The connection is currently routed through the emergency bridge "{bridge.name}".
        </div>
      )}

      {service.status === 'error' && (
        <button
          className="btn btn--primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => {
            const notif = useStore.getState().notifications.find((n) => n.relatedServiceId === serviceId && !n.read);
            if (notif) performNotificationAction(notif.id, 'switch_route');
            else import('../../sim/engine').then(({ retryService }) => retryService(serviceId));
          }}
        >
          Retry connection
        </button>
      )}
    </Modal>
  );
}
