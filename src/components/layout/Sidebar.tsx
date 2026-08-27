import { Home, LayoutGrid, Settings, Bell, User, Wifi } from 'lucide-react';
import { useStore, type TabId } from '../../store/useStore';
import { BrandLogo } from '../common/BrandLogo';

const NAV: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'services', label: 'Services', icon: LayoutGrid },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function daysLeftLabel(expiresAt: number): string {
  const days = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Expired';
  return `${days} day${days === 1 ? '' : 's'} left`;
}

export function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const user = useStore((s) => s.user);
  const isRunning = useStore((s) => s.isRunning);
  const library = useStore((s) => s.library);

  const subscriptionLabel =
    user.subscriptionStatus === 'trial'
      ? 'Trial period'
      : user.subscriptionStatus === 'active'
        ? 'Subscription active'
        : 'Subscription expired';

  const isConnected = isRunning && library.some((s) => s.enabled && s.status === 'connected');

  return (
    <div className="sidebar">
      <BrandLogo size={36} />

      <div className="sidebar__nav">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={24} strokeWidth={isActive ? 2.25 : 2} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="sidebar__footer">
        {isConnected && (
          <div className="sidebar__connect">
            <Wifi size={14} />
            <span>Connected</span>
          </div>
        )}
        <div className="sidebar__swatch">
          <Bell size={16} fill="currentColor" stroke="none" />
          <span className="sidebar__notif-dot" />
        </div>
        <div className="sidebar__user">
          <div className="sidebar__swatch">
            <User size={16} fill="currentColor" stroke="none" />
          </div>
          <div className="sidebar__footer-text">
            <span className="sidebar__footer-name">{subscriptionLabel}</span>
            <span className="sidebar__footer-sub">{daysLeftLabel(user.subscriptionExpiresAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
