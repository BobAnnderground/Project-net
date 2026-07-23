import { useStore, type TabId } from '../../store/useStore';
import { formatLatency } from '../../lib/labels';

const NAV: { id: TabId; label: string; active: string; inactive: string }[] = [
  {
    id: 'dashboard',
    label: 'Home',
    active: '/images/sidebar/nav-home-active.png',
    inactive: '/images/sidebar/nav-home-inactive.png',
  },
  {
    id: 'services',
    label: 'Services',
    active: '/images/sidebar/nav-services-active.png',
    inactive: '/images/sidebar/nav-services-inactive.png',
  },
  {
    id: 'settings',
    label: 'Settings',
    active: '/images/sidebar/nav-settings-active.png',
    inactive: '/images/sidebar/nav-settings-inactive.png',
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
  const routes = useStore((s) => s.routes);

  const subscriptionLabel =
    user.subscriptionStatus === 'trial'
      ? 'Trial period'
      : user.subscriptionStatus === 'active'
        ? 'Subscription active'
        : 'Subscription expired';

  const connectedServices = library.filter((s) => s.enabled && s.status === 'connected');
  const isConnected = isRunning && connectedServices.length > 0;
  const avgLatency = isConnected
    ? connectedServices.reduce((sum, s) => sum + (routes[s.id]?.latencyMs ?? 0), 0) / connectedServices.length
    : 0;

  return (
    <div className="sidebar">
      <img src="/images/sidebar/fixnet-logo.png" alt="Fixnet" className="sidebar__logo" />

      <div className="sidebar__nav">
        {NAV.map(({ id, label, active, inactive }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="nav-item__icon">
                <img
                  src={inactive}
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
            <span className="sidebar__connect-icon">
              <img src="/images/sidebar/connect-icon.png" alt="" />
            </span>
            <span className="sidebar__connect-status">Connected</span>
            <span className="sidebar__connect-latency">{formatLatency(avgLatency)}</span>
          </div>
        )}
        <img src="/images/sidebar/user-avatar.png" alt="" className="sidebar__avatar" />
        <div className="sidebar__footer-text">
          <span className="sidebar__footer-name">{subscriptionLabel}</span>
          <span className="sidebar__footer-sub">{daysLeftLabel(user.subscriptionExpiresAt)}</span>
        </div>
      </div>
    </div>
  );
}
