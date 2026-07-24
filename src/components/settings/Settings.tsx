import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, Copy, LogOut, ChevronDown, RotateCcw } from 'lucide-react';
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

const DNS_PRESETS = [
  { value: '1.1.1.1', label: 'Cloudflare' },
  { value: '8.8.8.8', label: 'Google' },
  { value: '8.8.4.4', label: 'Google (secondary)' },
  { value: '9.9.9.9', label: 'Quad9' },
  { value: '208.67.222.222', label: 'OpenDNS' },
];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatKey(raw: string): string {
  return raw.replace(/(.{4})/g, '$1 ').trim();
}

function mockBridgeCode(source: 'account' | 'telegram'): string {
  const payload = { tag: source === 'account' ? 'from-account' : 'from-telegram-bot', id: nanoid(12) };
  return `fixnet://import?b=${btoa(JSON.stringify(payload))}`;
}

function DnsSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="dropdown-select">
      <select className="dropdown-select__input dropdown-select__input--field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>
          Select DNS
        </option>
        {DNS_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="dropdown-select__chevron" />
    </div>
  );
}

function GeneralSection() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);

  return (
    <div className="settings-stack">
      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Start with Windows</div>
            <div className="settings-row__desc">Automatically launch Fixnet when you sign in to Windows</div>
          </div>
          <Toggle
            on={appSettings.autoLaunch}
            onClick={() => updateAppSettings({ autoLaunch: !appSettings.autoLaunch })}
            className="toggle--invariant"
          />
        </div>
        <div className="settings-divider" />
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Launch in system tray</div>
            <div className="settings-row__desc">Launch Fixnet minimized to the system tray</div>
          </div>
          <Toggle
            on={appSettings.launchInTray}
            onClick={() => updateAppSettings({ launchInTray: !appSettings.launchInTray })}
            className="toggle--invariant"
          />
        </div>
        <div className="settings-divider" />
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Reconnect on startup</div>
            <div className="settings-row__desc">
              Automatically reconnect using the last active configuration when the application starts
            </div>
          </div>
          <Toggle
            on={appSettings.reconnectOnStartup}
            onClick={() => updateAppSettings({ reconnectOnStartup: !appSettings.reconnectOnStartup })}
            className="toggle--invariant"
          />
        </div>
        <div className="settings-divider" />
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Close to system tray</div>
            <div className="settings-row__desc">Keep Fixnet running in the system tray when the window is closed</div>
          </div>
          <Toggle
            on={appSettings.closeToTray}
            onClick={() => updateAppSettings({ closeToTray: !appSettings.closeToTray })}
            className="toggle--invariant"
          />
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Theme</div>
          </div>
          <div className="segmented segmented--invariant segmented--fill">
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
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Language</div>
          </div>
          <div className="dropdown-select">
            <select
              className="dropdown-select__input"
              value={appSettings.language}
              onChange={(e) => updateAppSettings({ language: e.target.value as Language })}
            >
              <option value="en">English</option>
              <option value="ru">Russian</option>
            </select>
            <ChevronDown size={16} className="dropdown-select__chevron" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSection() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);
  const authKey = useStore((s) => s.authKey);
  const logout = useStore((s) => s.logout);
  const user = useStore((s) => s.user);

  const [copied, setCopied] = useState(false);

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
    <div className="settings-stack">
      <div className="settings-card">
        <div className="settings-card__title">Subscription</div>
        <div className="settings-divider" />
        <div className="settings-kv">
          <div className="settings-kv__row">
            <span className="settings-kv__label">Current plan</span>
            <span className="settings-kv__value">{subscriptionLabel}</span>
          </div>
          <div className="settings-kv__row">
            <span className="settings-kv__label">Expires</span>
            <span className="settings-kv__value">{formatDate(user.subscriptionExpiresAt)}</span>
          </div>
        </div>
        <button className="settings-btn settings-btn--pill" style={{ marginTop: 'var(--space-8)' }}>
          Open Account
        </button>
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Connection Key</div>
          </div>
          <div className="settings-field-with-action">
            <div className="settings-text-field">{formatKey(authKey)}</div>
            <button className="settings-icon-btn" onClick={handleCopy} aria-label="Copy connection key">
              <Copy size={16} />
            </button>
          </div>
        </div>
        {copied && <div className="form-hint" style={{ marginTop: 'var(--space-4)' }}>Copied</div>}
      </div>

      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Region</div>
          </div>
          <div className="dropdown-select dropdown-select--pill">
            <select
              className="dropdown-select__input"
              value={appSettings.region}
              onChange={(e) => updateAppSettings({ region: e.target.value })}
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="dropdown-select__chevron" />
          </div>
        </div>
      </div>

      <button className="settings-card settings-card--button" onClick={() => logout()}>
        <span className="settings-row__label">Sign Out</span>
        <LogOut size={16} />
      </button>
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
  const backupBridges = useStore((s) => s.backupBridges);
  const addBackupBridge = useStore((s) => s.addBackupBridge);
  const removeBackupBridge = useStore((s) => s.removeBackupBridge);

  const [addingBridge, setAddingBridge] = useState(false);
  const [bridgeCode, setBridgeCode] = useState('');

  function handleAddBridgeClick() {
    if (!addingBridge) {
      setAddingBridge(true);
      return;
    }
    const trimmed = bridgeCode.trim();
    if (trimmed) {
      addBackupBridge(trimmed);
      setBridgeCode('');
      setAddingBridge(false);
    } else {
      setAddingBridge(false);
    }
  }

  return (
    <div className="settings-stack">
      <div className="settings-card">
        <div className="settings-card__title">DNS Server</div>
        <div className="settings-divider" />

        <div className="settings-row">
          <div className="settings-row__text">
            <div className="settings-row__label">Current DNS</div>
          </div>
          <DnsSelect value={dns.current} onChange={(v) => updateDns({ current: v })} />
        </div>

        {dns.backups.map((value, i) => (
          <div key={i} className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Backup DNS {i + 1}</div>
            </div>
            <div className="settings-field-with-action">
              <DnsSelect value={value} onChange={(v) => updateBackupDns(i, v)} />
              <button
                className="settings-icon-btn"
                onClick={() => removeBackupDns(i)}
                aria-label={`Remove backup DNS ${i + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        <button className="settings-btn settings-btn--ghost" onClick={addBackupDns}>
          <Plus size={16} />
          Add backup DNS
        </button>
      </div>

      <div className="settings-card">
        <div className="settings-card__title">Bridges</div>
        <div className="settings-divider" />

        <div className="settings-field-labeled">
          <div className="settings-field-labeled__label">Current fallback bridge</div>
          <div className="settings-text-field settings-text-field--truncate">
            {emergencyBridge ? emergencyBridge.code : 'No fallback bridge configured yet'}
          </div>
        </div>

        {backupBridges.map((bridge, i) => (
          <div key={bridge.id} className="settings-bridge-row">
            <div className="settings-field-labeled" style={{ flex: 1, minWidth: 0 }}>
              <div className="settings-field-labeled__label">Backup bridge {i + 1}</div>
              <div className="settings-field-with-action">
                <div className="settings-text-field settings-text-field--truncate">{bridge.code}</div>
                <button
                  className="settings-icon-btn"
                  onClick={() => removeBackupBridge(bridge.id)}
                  aria-label={`Remove backup bridge ${i + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className={`settings-status settings-status--${bridge.status}`}>
              <span className="settings-status__dot" />
              {bridge.status === 'connected' ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        ))}

        {addingBridge && (
          <>
            <div className="settings-field-labeled">
              <div className="settings-field-labeled__label">New bridge</div>
              <input
                className="settings-text-field settings-text-field--input"
                placeholder="Paste bridge configuration"
                value={bridgeCode}
                onChange={(e) => setBridgeCode(e.target.value)}
                autoFocus
              />
            </div>
            <div className="settings-quickfill-row">
              <button className="settings-btn" onClick={() => setBridgeCode(mockBridgeCode('account'))}>
                Get from Account
              </button>
              <button className="settings-btn" onClick={() => setBridgeCode(mockBridgeCode('telegram'))}>
                Get from Telegram Bot
              </button>
            </div>
          </>
        )}

        <button className="settings-btn settings-btn--ghost" onClick={handleAddBridgeClick}>
          <Plus size={16} />
          Add fallback bridge
        </button>
      </div>
    </div>
  );
}

function AdvancedSection() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);

  return (
    <div className="settings-card">
      <div className="settings-row">
        <div className="settings-row__text">
          <div className="settings-row__label">Enable advanced settings</div>
          <div className="settings-row__desc">
            Unlocks additional options for fine-tuning services. Recommended for advanced users
          </div>
        </div>
        <Toggle
          on={appSettings.showAdvancedSettings}
          onClick={() => updateAppSettings({ showAdvancedSettings: !appSettings.showAdvancedSettings })}
          className="toggle--invariant"
        />
      </div>
    </div>
  );
}

export function Settings() {
  const resetAppSettings = useStore((s) => s.resetAppSettings);
  const [tab, setTab] = useState<SettingsTab>('general');
  const [pendingReset, setPendingReset] = useState(false);

  return (
    <div className="settings-page">
      <div className="settings-tabbar">
        <div className="segmented segmented--invariant">
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
          <button className="settings-btn" onClick={() => setPendingReset(true)}>
            <RotateCcw size={16} />
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
