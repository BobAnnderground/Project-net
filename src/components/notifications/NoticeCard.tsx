import { X, ArrowRight } from 'lucide-react';
import type { AppNotification } from '../../types';
import { formatRelativeTime } from '../../lib/labels';
import { NOTIFICATION_ICONS } from './notificationIcons';

interface NoticeCardProps {
  notification: AppNotification;
  variant: 'toast' | 'window';
  onOpen?: () => void;
  onClose?: () => void;
}

export function NoticeCard({ notification, variant, onOpen, onClose }: NoticeCardProps) {
  const Icon = NOTIFICATION_ICONS[notification.icon];

  return (
    <div
      className={`notice-card notice-card--${variant}`}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <span className="notice-card__icon">
        <Icon size={20} />
      </span>
      <div className="notice-card__content">
        <div className="notice-card__title-row">
          <span className="notice-card__title">{notification.title}</span>
          {variant === 'window' && (
            <span className="notice-card__meta">
              {!notification.read && <span className="notice-card__unread-dot" />}
              {formatRelativeTime(notification.createdAt)}
            </span>
          )}
        </div>
        <p className="notice-card__message">{notification.message}</p>
        {notification.actionLabel && (
          <span className="notice-card__action">
            {notification.actionLabel}
            <ArrowRight size={12} />
          </span>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          className="notice-card__close"
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
