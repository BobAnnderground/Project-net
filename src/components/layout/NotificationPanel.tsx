import { Server, ServerOff, Globe, LayoutGrid, CreditCard, MessageCircle, RotateCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatNotificationTime } from '../../lib/labels';
import type { AppNotification, NotificationIcon } from '../../types';

const ICONS: Record<NotificationIcon, typeof Server> = {
  server: Server,
  'server-off': ServerOff,
  region: Globe,
  library: LayoutGrid,
  billing: CreditCard,
  chat: MessageCircle,
};

interface NoticeProps {
  notification: AppNotification;
  onRead: () => void;
  onAction: () => void;
}

function Notice({ notification, onRead, onAction }: NoticeProps) {
  const Icon = ICONS[notification.icon];
  return (
    <div className={`notif-item notif-item--${notification.tone}`} onClick={onRead}>
      <span className="notif-item__icon">
        <Icon size={20} />
      </span>
      <div className="notif-item__content">
        <div className="notif-item__text">
          <div className="notif-item__title-row">
            <span className="notif-item__title">{notification.title}</span>
            <span className="notif-item__meta">
              {!notification.read && <span className="notif-item__dot" />}
              {formatNotificationTime(notification.createdAt)}
            </span>
          </div>
          <p className="notif-item__message">{notification.message}</p>
        </div>
        {notification.action && (
          <button
            type="button"
            className="notif-item__action"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
          >
            {notification.action.label}
            <RotateCw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

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
                  <Notice
                    key={n.id}
                    notification={n}
                    onRead={() => markNotificationRead(n.id)}
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
