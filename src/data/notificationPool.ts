import type { NotificationTone, NotificationIcon, NotificationAction } from '../types';

export interface NotificationTemplate {
  tone: NotificationTone;
  icon: NotificationIcon;
  title: string;
  message: string;
  action: NotificationAction | null;
}

export const NOTIFICATION_POOL: NotificationTemplate[] = [
  {
    tone: 'neutral',
    icon: 'server',
    title: 'Server update',
    message: 'The Amsterdam server address has changed. Reconnect to apply the update',
    action: { label: 'Reconnect', actionType: 'reconnect' },
  },
  {
    tone: 'negative',
    icon: 'server-off',
    title: 'Route unavailable',
    message: 'The main route for one of your services stopped responding. Trying to restore it',
    action: null,
  },
  {
    tone: 'negative',
    icon: 'server-off',
    title: 'Connection quality degraded',
    message: 'Latency has increased on the current route. Performance may be affected',
    action: null,
  },
  {
    tone: 'negative',
    icon: 'server-off',
    title: 'Server overload',
    message: 'The selected region is under heavy load. Consider switching to a nearby server',
    action: null,
  },
  {
    tone: 'positive',
    icon: 'region',
    title: 'Bridge connected',
    message: 'A backup bridge was connected automatically to keep your service online',
    action: null,
  },
  {
    tone: 'positive',
    icon: 'library',
    title: 'New service available',
    message: 'A new preset service was added to the catalog and is ready to route',
    action: null,
  },
  {
    tone: 'negative',
    icon: 'billing',
    title: 'Subscription expiring soon',
    message: 'Your trial period ends in a few days. Renew to keep all services running',
    action: null,
  },
];

export function randomNotificationTemplate(): NotificationTemplate {
  return NOTIFICATION_POOL[Math.floor(Math.random() * NOTIFICATION_POOL.length)];
}
