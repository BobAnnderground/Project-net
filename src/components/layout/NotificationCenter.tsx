import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { AppNotification } from '../../types';

const SEVERITY_COLOR: Record<AppNotification['severity'], string> = {
  info: 'var(--info)',
  warning: 'var(--warn)',
  critical: 'var(--err)',
};

const SEVERITY_ICON: Record<AppNotification['severity'], typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function NotificationCenter({ onNavigate }: { onNavigate: () => void }) {
  const notifications = useStore((s) => s.notifications);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const performNotificationAction = useStore((s) => s.performNotificationAction);

  return (
    <div className="notif-panel">
      <div className="notif-panel__header">
        <span className="notif-panel__title">Notifications</span>
        {notifications.length > 0 && (
          <button className="notif-panel__mark-all" onClick={markAllNotificationsRead}>
            Mark all as read
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="notif-panel__empty">No notifications yet</div>
      ) : (
        notifications.map((n) => {
          const Icon = SEVERITY_ICON[n.severity];
          return (
            <div
              key={n.id}
              className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
              onClick={() => markNotificationRead(n.id)}
            >
              <Icon size={14} color={SEVERITY_COLOR[n.severity]} style={{ marginTop: 'var(--space-4)', flexShrink: 0 }} />
              <div className="notif-item__body">
                <div className="notif-item__message">{n.message}</div>
                <div className="notif-item__meta">{timeAgo(n.createdAt)}</div>
                {n.actions.length > 0 && (
                  <div className="notif-item__actions">
                    {n.actions.map((a) => (
                      <button
                        key={a.actionType}
                        className="btn btn--sm btn--primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          performNotificationAction(n.id, a.actionType);
                          if (a.actionType === 'go_to_service') onNavigate();
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
