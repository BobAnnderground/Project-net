import { Wifi, Bell } from 'lucide-react';
import { useStore, type TabId } from '../../store/useStore';
import { useResolvedTheme } from '../../lib/useResolvedTheme';
import { BrandLogo } from '../common/BrandLogo';

const NAV: { id: TabId; label: string; active: string; inactiveDark: string; inactiveLight: string }[] = [
  {
    id: 'dashboard',
    label: 'Home',
    active: '/images/sidebar/nav-home-active.png',
    inactiveDark: '/images/sidebar/nav-home-inactive.png',
    inactiveLight: '/images/sidebar/nav-home-inactive-light.png',
  },
  {
    id: 'services',
    label: 'Services',
    active: '/images/sidebar/nav-services-active.png',
    inactiveDark: '/images/sidebar/nav-services-inactive.png',
    inactiveLight: '/images/sidebar/nav-services-inactive-light.png',
  },
  {
    id: 'settings',
    label: 'Settings',
    active: '/images/sidebar/nav-settings-active.png',
    inactiveDark: '/images/sidebar/nav-settings-inactive.png',
    inactiveLight: '/images/sidebar/nav-settings-inactive-light.png',
  },
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
  const resolvedTheme = useResolvedTheme();

  const subscriptionLabel =
    user.subscriptionStatus === 'trial'
      ? 'Trial period'
      : user.subscriptionStatus === 'active'
        ? 'Subscription active'
        : 'Subscription expired';

  const isConnected = isRunning && library.some((s) => s.enabled && s.status === 'connected');
  const avatarSrc =
    resolvedTheme === 'light' ? '/images/sidebar/user-avatar-light.png' : '/images/sidebar/user-avatar.png';

  return (
    <div className="sidebar">
      <BrandLogo size={36} />

      <div className="sidebar__nav">
        {NAV.map(({ id, label, active, inactiveDark, inactiveLight }) => {
          const isActive = activeTab === id;
          const inactiveSrc = resolvedTheme === 'light' ? inactiveLight : inactiveDark;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="nav-item__icon">
                <img
                  src={inactiveSrc}
                  alt=""
                  className="nav-item__icon-img--inactive"
                  style={{ opacity: isActive ? 0 : 1 }}
                />
                <img
                  src={active}
                  alt=""
                  className="nav-item__icon-img--active"
                  style={{ opacity: isActive ? 1 : 0 }}
                />
              </span>
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
          <img src={avatarSrc} alt="" className="sidebar__avatar" />
          <div className="sidebar__footer-text">
            <span className="sidebar__footer-name">{subscriptionLabel}</span>
            <span className="sidebar__footer-sub">{daysLeftLabel(user.subscriptionExpiresAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
