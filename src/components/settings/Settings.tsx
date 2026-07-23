import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Toggle } from '../common/Toggle';
import { REGIONS } from '../../data/regions';
import type { Theme, Language } from '../../types';

type SettingsTab = 'general' | 'account' | 'connection' | 'advanced';

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'account', label: 'Account' },
  { id: 'connection', label: 'Connection' },
  { id: 'advanced', label: 'Advanced' },
];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatKey(raw: string): string {
  return raw.replace(/(.{4})/g, '$1 ').trim();
}

function GeneralSection() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);

  return (
    <div className="settings-section">
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Start with Windows</div>
          <div className="settings-row__desc">Launch Fixnet automatically when Windows starts</div>
        </div>
        <Toggle
          on={appSettings.autoLaunch}
          onClick={() => updateAppSettings({ autoLaunch: !appSettings.autoLaunch })}
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row__label">Launch in system tray</div>
          <div className="settings-row__desc">Start minimized to the system tray instead of opening a window</div>
        </div>
        <Toggle
          on={appSettings.launchInTray}
          onClick={() => updateAppSettings({ launchInTray: !appSettings.launchInTray })}
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row__label">Reconnect on startup</div>
          <div className="settings-row__desc">Automatically relaunch the last session on launch</div>
        </div>
        <Toggle
          on={appSettings.reconnectOnStartup}
          onClick={() => updateAppSettings({ reconnectOnStartup: !appSettings.reconnectOnStartup })}
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row__label">Close to system tray</div>
          <div className="settings-row__desc">Minimize to the tray instead of closing when the window is closed</div>
        </div>
        <Toggle
          on={appSettings.closeToTray}
          onClick={() => updateAppSettings({ closeToTray: !appSettings.closeToTray })}
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row__label">Theme</div>
          <div className="settings-row__desc">Interface appearance</div>
        </div>
        <div className="segmented">
          {(['system', 'light', 'dark'] as Theme[]).map((t) => (
            <button
              key={t}
              className={`segmented__option ${appSettings.theme === t ? 'segmented__option--active' : ''}`}
              onClick={() => updateAppSettings({ theme: t })}
            >
              {t === 'system' ? 'System' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row" style={{ borderBottom: 'none' }}>
        <div>
          <div className="settings-row__label">Language</div>
          <div className="settings-row__desc">
            Changes the app's display language (prototype: interface text is not retranslated)
          </div>
        </div>
        <select
          className="form-select"
          value={appSettings.language}
          onChange={(e) => updateAppSettings({ language: e.target.value as Language })}
        >
          <option value="en">English</option>
          <option value="ru">Russian</option>
        </select>
      </div>
    </div>
  );
}

function AccountSection() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);
  const authKey = useStore((s) => s.authKey);
  const regenerateAuthKey = useStore((s) => s.regenerateAuthKey);
  const logout = useStore((s) => s.logout);
  const user = useStore((s) => s.user);

  const [copied, setCopied] = useState(false);
  const [pendingRegen, setPendingRegen] = useState(false);

  function handleCopy() {
    try {
      navigator.clipboard.writeText(authKey).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {});
    } catch {
      // clipboard API not available — fail silently
    }
  }

  const subscriptionLabel =
    user.subscriptionStatus === 'active'
      ? 'Active'
      : user.subscriptionStatus === 'trial'
      ? 'Trial'
      : 'Expired';

  return (
    <div className="settings-section">
      <div className="settings-row">
        <div>
          <div className="settings-row__label">Subscription</div>
          <div className="settings-row__desc">
            {subscriptionLabel} · expires {formatDate(user.subscriptionExpiresAt)}
          </div>
        </div>
        <button className="btn btn--sm">Open Account</button>
      </div>

      <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)' }}>
        <div className="settings-row__label">Connection Key</div>
        <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
          <div className="settings-key-box">{formatKey(authKey)}</div>
          {pendingRegen ? (
            <>
              <span className="form-hint" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}>
                Regenerate key?
              </span>
              <button
                className="btn btn--sm btn--primary"
                onClick={() => {
                  regenerateAuthKey();
                  setPendingRegen(false);
                }}
              >
                Confirm
              </button>
              <button className="btn btn--sm" onClick={() => setPendingRegen(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn--sm" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button className="btn btn--sm" onClick={() => setPendingRegen(true)}>
                Regenerate
              </button>
            </>
          )}
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row__label">Region</div>
        </div>
        <select
          className="form-select"
          value={appSettings.region}
          onChange={(e) => updateAppSettings({ region: e.target.value })}
        >
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName} (load {r.serverLoad}%)
            </option>
          ))}
        </select>
      </div>

      <div className="settings-row" style={{ borderBottom: 'none' }}>
        <div>
          <div className="settings-row__label">Session</div>
        </div>
        <button className="btn btn--sm btn--danger" onClick={() => logout()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

function ConnectionSection() {
  const dns = useStore((s) => s.appSettings.dns);
  const updateDns = useStore((s) => s.updateDns);
  const addBackupDns = useStore((s) => s.addBackupDns);
  const updateBackupDns = useStore((s) => s.updateBackupDns);
  const removeBackupDns = useStore((s) => s.removeBackupDns);
  const emergencyBridge = useStore((s) => s.emergencyBridge);
  const addEmergencyBridge = useStore((s) => s.addEmergencyBridge);

  const [addingBridge, setAddingBridge] = useState(false);
  const [bridgeCode, setBridgeCode] = useState('');

  function handleAddBridge() {
    const trimmed = bridgeCode.trim();
    if (!trimmed) return;
    addEmergencyBridge(trimmed);
    setBridgeCode('');
    setAddingBridge(false);
  }

  return (
    <>
      <div className="settings-section">
        <div className="settings-section__title">DNS Server</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)' }}>
          <div className="settings-row__label">Current DNS</div>
          <input
            className="form-input"
            value={dns.current}
            onChange={(e) => updateDns({ current: e.target.value })}
          />
        </div>

        {dns.backups.map((value, i) => (
          <div
            key={i}
            className="settings-row"
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)' }}
          >
            <div className="settings-row__label">Backup DNS {i + 1}</div>
            <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                value={value}
                onChange={(e) => updateBackupDns(i, e.target.value)}
              />
              <button
                className="btn btn--sm btn--danger"
                onClick={() => removeBackupDns(i)}
                aria-label={`Remove backup DNS ${i + 1}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <button className="btn btn--sm" onClick={addBackupDns}>
            <Plus size={12} />
            Add backup DNS
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__title">Bridges</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)' }}>
          <div className="settings-row__label">Current fallback bridge</div>
          {emergencyBridge ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
                <div className="settings-key-box" style={{ flex: 1 }}>{emergencyBridge.code}</div>
                <span className={`status-badge status--${emergencyBridge.status === 'active' ? 'connected' : 'error'}`}>
                  <span className="status-dot" />
                  {emergencyBridge.status === 'active' ? 'Working' : 'Not working'}
                </span>
              </div>
              <div className="form-hint">Added {formatDate(emergencyBridge.addedAt)}</div>
            </>
          ) : (
            <div className="form-hint">No fallback bridge configured yet.</div>
          )}
        </div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)', borderBottom: 'none' }}>
          {addingBridge ? (
            <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Paste bridge code"
                value={bridgeCode}
                onChange={(e) => setBridgeCode(e.target.value)}
                autoFocus
              />
              <button
                className="btn btn--sm btn--primary"
                onClick={handleAddBridge}
                disabled={!bridgeCode.trim()}
                aria-label="Confirm bridge"
              >
                <Check size={14} />
              </button>
              <button className="btn btn--sm" onClick={() => { setAddingBridge(false); setBridgeCode(''); }}>
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn btn--sm" onClick={() => setAddingBridge(true)}>
              <Plus size={12} />
              Add fallback bridge
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function AdvancedSection() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);
  const updateAdvancedNetwork = useStore((s) => s.updateAdvancedNetwork);

  return (
    <>
      <div className="settings-advanced-toggle">
        <div>
          <div className="settings-row__label">Enable advanced settings</div>
          <div className="settings-row__desc">
            Reveals additional advanced options here, and when configuring individual services
          </div>
        </div>
        <Toggle
          on={appSettings.showAdvancedSettings}
          onClick={() => updateAppSettings({ showAdvancedSettings: !appSettings.showAdvancedSettings })}
        />
      </div>

      {appSettings.showAdvancedSettings && (
        <div className="settings-section" style={{ marginTop: 'var(--space-12)' }}>
          <div className="settings-section__title">Network simulation (mock parameters)</div>
          <div className="settings-row__desc" style={{ marginBottom: 'var(--space-12)' }}>
            NFR-3: frequency and probability of route degradation are configurable for testing the flow.
          </div>

          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)' }}>
            <div className="settings-row__label">
              Degradation chance per tick: {appSettings.advancedNetwork.degradationChance}%
            </div>
            <div className="slider-row">
              <input
                type="range"
                min={0}
                max={60}
                value={appSettings.advancedNetwork.degradationChance}
                onChange={(e) => updateAdvancedNetwork({ degradationChance: Number(e.target.value) })}
              />
              <span className="slider-row__value">{appSettings.advancedNetwork.degradationChance}%</span>
            </div>
          </div>

          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-8)', borderBottom: 'none' }}>
            <div className="settings-row__label">Route check interval</div>
            <div className="slider-row">
              <input
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={appSettings.advancedNetwork.tickIntervalMs}
                onChange={(e) => updateAdvancedNetwork({ tickIntervalMs: Number(e.target.value) })}
              />
              <span className="slider-row__value">
                {(appSettings.advancedNetwork.tickIntervalMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Settings() {
  const resetAppSettings = useStore((s) => s.resetAppSettings);
  const [tab, setTab] = useState<SettingsTab>('general');
  const [pendingReset, setPendingReset] = useState(false);

  return (
    <div>
      <div className="settings-tabbar">
        <div className="segmented">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t.id}
              className={`segmented__option ${tab === t.id ? 'segmented__option--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {pendingReset ? (
          <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
            <span className="form-hint" style={{ whiteSpace: 'nowrap' }}>Reset all settings?</span>
            <button
              className="btn btn--sm btn--danger"
              onClick={() => {
                resetAppSettings();
                setPendingReset(false);
              }}
            >
              Confirm
            </button>
            <button className="btn btn--sm" onClick={() => setPendingReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn btn--sm" onClick={() => setPendingReset(true)}>
            Reset settings
          </button>
        )}
      </div>

      {tab === 'general' && <GeneralSection />}
      {tab === 'account' && <AccountSection />}
      {tab === 'connection' && <ConnectionSection />}
      {tab === 'advanced' && <AdvancedSection />}
    </div>
  );
}
