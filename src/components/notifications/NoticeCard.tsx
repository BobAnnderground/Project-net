import { Server, ServerOff, Globe, LayoutGrid, CreditCard, MessageCircle, RotateCw, X } from 'lucide-react';
import type { AppNotification, NotificationIcon } from '../../types';
import { formatNotificationTime } from '../../lib/labels';

export const NOTICE_ICONS: Record<NotificationIcon, typeof Server> = {
  server: Server,
  'server-off': ServerOff,
  region: Globe,
  library: LayoutGrid,
  billing: CreditCard,
  chat: MessageCircle,
};

interface NoticeCardProps {
  notification: AppNotification;
  variant: 'toast' | 'window';
  onOpen?: () => void;
  onAction?: () => void;
  onClose?: () => void;
}

export function NoticeCard({ notification, variant, onOpen, onAction, onClose }: NoticeCardProps) {
  const Icon = NOTICE_ICONS[notification.icon];

  return (
    <div
      className={`notif-item notif-item--${notification.tone} notif-item--${variant}`}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <span className="notif-item__icon">
        <Icon size={20} />
      </span>
      <div className="notif-item__content">
        <div className="notif-item__text">
          <div className="notif-item__title-row">
            <span className="notif-item__title">{notification.title}</span>
            {variant === 'window' && (
              <span className="notif-item__meta">
                {!notification.read && <span className="notif-item__dot" />}
                {formatNotificationTime(notification.createdAt)}
              </span>
            )}
          </div>
          <p className="notif-item__message">{notification.message}</p>
        </div>
        {notification.action && onAction && (
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
      {onClose && (
        <button
          type="button"
          className="notif-item__close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Dismiss notification"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
