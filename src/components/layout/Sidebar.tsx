import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Library, ListChecks, Settings, HelpCircle, ChevronRight, LogOut, Bell } from 'lucide-react';
import { useStore, type TabId } from '../../store/useStore';
import { NotificationCenter } from './NotificationCenter';

const NAV: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'presets', label: 'Presets', icon: ListChecks },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const notifications = useStore((s) => s.notifications);

  const [popupOpen, setPopupOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const subscriptionLabel =
    user.subscriptionStatus === 'trial'
      ? 'Trial period'
      : user.subscriptionStatus === 'active'
        ? 'Subscription active'
        : 'Subscription expired';

  function handleLogout() {
    setPopupOpen(false);
    logout();
  }

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-mark" />
        Fixnet
      </div>
      <div className="sidebar__nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeTab === id ? 'nav-item--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="sidebar__footer-wrapper">
        <div ref={notifRef} className="sidebar__bell-wrapper">
          <button
            className="sidebar__bell"
            onClick={() => {
              setNotifOpen((v) => !v);
              setPopupOpen(false);
            }}
          >
            <Bell size={16} />
            {unread > 0 && <span className="bell__badge">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {notifOpen && <NotificationCenter onNavigate={() => setNotifOpen(false)} />}
        </div>

        <div ref={accountRef} className="sidebar__account-wrapper">
          {popupOpen && (
            <div className="account-popup">
              <div className="account-popup__identity">
                <div className="account-popup__name">{user.name}</div>
                <div className="account-popup__status">{subscriptionLabel}</div>
              </div>
              <div className="account-popup__divider" />
              <button className="account-popup__logout" onClick={handleLogout}>
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
          <button
            className={`sidebar__footer ${popupOpen ? 'sidebar__footer--open' : ''}`}
            onClick={() => {
              setPopupOpen((v) => !v);
              setNotifOpen(false);
            }}
          >
            <div className="sidebar__footer-text">
              <span className="sidebar__footer-name">{user.name}</span>
              <span className="sidebar__footer-sub">{subscriptionLabel}</span>
            </div>
            <ChevronRight
              size={14}
              className={`sidebar__footer-chevron ${popupOpen ? 'sidebar__footer-chevron--up' : ''}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
