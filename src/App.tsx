import { useEffect, useState, useCallback } from 'react';
import './App.css';
import { useStore, type TabId } from './store/useStore';
import { useResolvedTheme } from './lib/useResolvedTheme';
import { Sidebar } from './components/layout/Sidebar';
import { WindowTitleBar } from './components/layout/WindowTitleBar';
import { NotificationPanel } from './components/layout/NotificationPanel';
import { Dashboard } from './components/dashboard/Dashboard';
import { Services } from './components/services/Services';
import { Settings } from './components/settings/Settings';
import { AuthScreen } from './components/auth/AuthScreen';
import { Toast } from './components/common/Toast';

const SECTION_LABELS: Partial<Record<TabId, string>> = {
  services: 'Services',
  settings: 'Settings',
};

function App() {
  const activeTab = useStore((s) => s.activeTab);
  const resolvedTheme = useResolvedTheme();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const notificationsOpen = useStore((s) => s.notificationsOpen);

  // 'auth'       — showing auth screen only
  // 'crossfade'  — both mounted, auth fading out, shell fading in
  // 'shell'      — showing shell only
  const [view, setView] = useState<'auth' | 'crossfade' | 'shell'>(
    isAuthenticated ? 'shell' : 'auth'
  );
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (!isAuthenticated) {
      setView('auth');
    }
  }, [isAuthenticated]);

  const handleAuthenticated = useCallback(() => {
    // Start crossfade: both layers visible, auth fading out
    setView('crossfade');
    // After 400ms fade completes, drop auth from DOM
    setTimeout(() => setView('shell'), 400);
  }, []);

  if (view === 'shell') {
    if (minimized) {
      return (
        <button className="window-restore-chip" onClick={() => setMinimized(false)}>
          <span className="window-restore-chip__mark" />
          Fixnet
        </button>
      );
    }
    return (
      <div className="shell">
        <WindowTitleBar
          section={SECTION_LABELS[activeTab]}
          onMinimize={() => setMinimized(true)}
          onClose={() => setMinimized(true)}
        />
        <Sidebar />
        <div className="content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'services' && <Services />}
          {activeTab === 'settings' && <Settings />}
        </div>
        {notificationsOpen && <NotificationPanel />}
        <Toast />
      </div>
    );
  }

  // view is 'auth' or 'crossfade': keep AuthScreen mounted at the same tree
  // position across both states so React preserves its internal success/error
  // state instead of remounting a fresh instance when the shell fades in.
  return (
    <div style={{ position: 'relative', width: '1200px', height: '800px' }}>
      {view === 'crossfade' && (
        <div className="auth-fade-wrapper auth-fade-wrapper--visible">
          <div className="shell">
            <WindowTitleBar
              section={SECTION_LABELS[activeTab]}
              onMinimize={() => setMinimized(true)}
              onClose={() => setMinimized(true)}
            />
            <Sidebar />
            <div className="content">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'services' && <Services />}
              {activeTab === 'settings' && <Settings />}
            </div>
          </div>
        </div>
      )}
      <div className={view === 'crossfade' ? 'auth-fade-wrapper auth-fade-wrapper--hidden' : ''}>
        <AuthScreen onAuthenticated={handleAuthenticated} onMinimize={() => setMinimized(true)} />
      </div>
    </div>
  );
}

export default App;
