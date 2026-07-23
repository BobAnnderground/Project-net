import { useEffect, useState, useCallback } from 'react';
import './App.css';
import { useStore } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { WindowTitleBar } from './components/layout/WindowTitleBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { Services } from './components/services/Services';
import { Settings } from './components/settings/Settings';
import { AuthScreen } from './components/auth/AuthScreen';
import { Toast } from './components/common/Toast';

function App() {
  const activeTab = useStore((s) => s.activeTab);
  const theme = useStore((s) => s.appSettings.theme);
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  // 'auth'       — showing auth screen only
  // 'crossfade'  — both mounted, auth fading out, shell fading in
  // 'shell'      — showing shell only
  const [view, setView] = useState<'auth' | 'crossfade' | 'shell'>(
    isAuthenticated ? 'shell' : 'auth'
  );
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    function apply() {
      const resolved = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
    }
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

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
        <WindowTitleBar onMinimize={() => setMinimized(true)} onClose={() => setMinimized(true)} />
        <Sidebar />
        <div className="content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'services' && <Services />}
          {activeTab === 'settings' && <Settings />}
        </div>
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
            <WindowTitleBar onMinimize={() => setMinimized(true)} onClose={() => setMinimized(true)} />
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
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </div>
    </div>
  );
}

export default App;
