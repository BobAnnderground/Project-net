import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Library, Settings, HelpCircle, ChevronRight, LogOut } from 'lucide-react';
import { useStore, type TabId } from '../../store/useStore';

const NAV: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'services', label: 'Services', icon: Library },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  const [popupOpen, setPopupOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
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
            onClick={() => setPopupOpen((v) => !v)}
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
