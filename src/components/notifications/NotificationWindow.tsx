import { useStore } from '../../store/useStore';
import { NoticeCard } from './NoticeCard';

export function NotificationWindow() {
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const deleteAllNotifications = useStore((s) => s.deleteAllNotifications);

  return (
    <div className="notif-window">
      <div className="notif-window__header">
        <span className="notif-window__count">
          {notifications.length} notification{notifications.length === 1 ? '' : 's'}
        </span>
        {notifications.length > 0 && (
          <div className="notif-window__header-actions">
            <button type="button" className="notif-window__header-btn" onClick={markAllNotificationsRead}>
              Mark all as read
            </button>
            <button type="button" className="notif-window__header-btn" onClick={deleteAllNotifications}>
              Delete all
            </button>
          </div>
        )}
      </div>
      <div className="notif-window__body">
        {notifications.length === 0 ? (
          <div className="notif-window__empty">
            <p className="notif-window__empty-title">Nothing here yet</p>
            <p className="notif-window__empty-text">
              Updates about the app, new services and your subscription, will show up here
            </p>
          </div>
        ) : (
          <div className="notif-window__list">
            {notifications.map((n) => (
              <NoticeCard key={n.id} notification={n} variant="window" onOpen={() => markNotificationRead(n.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
