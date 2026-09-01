import { useStore } from '../../store/useStore';
import { NoticeCard } from '../notifications/NoticeCard';

export function NotificationPanel() {
  const notifications = useStore((s) => s.notifications);
  const closeNotificationsPanel = useStore((s) => s.closeNotificationsPanel);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const deleteAllNotifications = useStore((s) => s.deleteAllNotifications);
  const showToast = useStore((s) => s.showToast);

  const hasNotifications = notifications.length > 0;

  return (
    <div className="notif-overlay" onClick={closeNotificationsPanel}>
      <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
        {hasNotifications ? (
          <>
            <div className="notif-panel__header">
              <span className="notif-panel__count">{notifications.length} notifications</span>
              <div className="notif-panel__actions">
                <button type="button" className="notif-panel__btn" onClick={markAllNotificationsRead}>
                  Mark all as read
                </button>
                <button type="button" className="notif-panel__btn" onClick={deleteAllNotifications}>
                  Delete all
                </button>
              </div>
            </div>
            <div className="notif-panel__scroll">
              <div className="notif-panel__list">
                {notifications.map((n) => (
                  <NoticeCard
                    key={n.id}
                    notification={n}
                    variant="window"
                    onOpen={() => markNotificationRead(n.id)}
                    onAction={() => {
                      markNotificationRead(n.id);
                      showToast('Reconnecting...');
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="notif-panel__fade" />
          </>
        ) : (
          <div className="notif-panel__empty">
            <p className="notif-panel__empty-title">Nothing here yet</p>
            <p className="notif-panel__empty-text">
              Updates about the app, new services and your subscription, will show up here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
