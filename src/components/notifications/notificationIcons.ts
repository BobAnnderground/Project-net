import { RefreshCw, AlertTriangle, Activity, Waypoints, PlugZap, CreditCard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NotificationIconKey } from '../../types';

export const NOTIFICATION_ICONS: Record<NotificationIconKey, LucideIcon> = {
  update: RefreshCw,
  route: AlertTriangle,
  quality: Activity,
  service: Waypoints,
  bridge: PlugZap,
  subscription: CreditCard,
};
