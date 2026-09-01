import type { NotificationIconKey } from '../types';

export interface NotificationTemplate {
  icon: NotificationIconKey;
  title: string;
  message: string;
  actionLabel: string | null;
}

export const NOTIFICATION_POOL: NotificationTemplate[] = [
  {
    icon: 'update',
    title: 'Server update',
    message: 'The Amsterdam server address has changed. Reconnect to apply the update.',
    actionLabel: 'Reconnect',
  },
  {
    icon: 'route',
    title: 'Route unavailable',
    message: 'The main route for one of your services stopped responding. Trying to restore it.',
    actionLabel: null,
  },
  {
    icon: 'quality',
    title: 'Connection quality degraded',
    message: 'Latency has increased on the current route. Performance may be affected.',
    actionLabel: null,
  },
  {
    icon: 'service',
    title: 'Server overload',
    message: 'The selected region is under heavy load. Consider switching to a nearby server.',
    actionLabel: 'Switch region',
  },
  {
    icon: 'bridge',
    title: 'Bridge connected',
    message: 'A backup bridge was connected automatically to keep your service online.',
    actionLabel: null,
  },
  {
    icon: 'service',
    title: 'New service available',
    message: 'A new preset service was added to the catalog and is ready to route.',
    actionLabel: 'View in Services',
  },
  {
    icon: 'subscription',
    title: 'Subscription expiring soon',
    message: 'Your trial period ends in a few days. Renew to keep all services running.',
    actionLabel: 'Renew',
  },
];

export function randomNotificationTemplate(): NotificationTemplate {
  return NOTIFICATION_POOL[Math.floor(Math.random() * NOTIFICATION_POOL.length)];
}
