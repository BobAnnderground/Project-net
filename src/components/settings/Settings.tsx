import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Toggle } from '../common/Toggle';
import { REGIONS } from '../../data/regions';
import { TRANSPORT_TYPE_LABELS } from '../../lib/labels';
import { EmergencyBridgeSection } from './EmergencyBridgeSection';
import type { Theme, WindowBehavior, Language, UpdateMode, TransportType, Encryption } from '../../types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatKey(raw: string): string {
  return raw.replace(/(.{4})/g, '$1 ').trim();
}

export function Settings() {
  const appSettings = useStore((s) => s.appSettings);
  const updateAppSettings = useStore((s) => s.updateAppSettings);
  const updateAdvancedNetwork = useStore((s) => s.updateAdvancedNetwork);
  const updateConnectionDefaults = useStore((s) => s.updateConnectionDefaults);
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
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">App settings</div>
          <div className="page-subtitle">Not tied to services — FR-19 SRS</div>
        </div>
      </div>

      {/* ── Section 1: General ───────────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section__title">General settings</div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Launch on startup</div>
            <div className="settings-row__desc">Start Fixnet together with Windows</div>
          </div>
          <Toggle
            on={appSettings.autoLaunch}
            onClick={() => updateAppSettings({ autoLaunch: !appSettings.autoLaunch })}
          />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Window behavior on close</div>
            <div className="settings-row__desc">Where the app minimizes to</div>
          </div>
          <div className="segmented">
            {(['tray', 'taskbar'] as WindowBehavior[]).map((w) => (
              <button
                key={w}
                className={`segmented__option ${appSettings.windowBehavior === w ? 'segmented__option--active' : ''}`}
                onClick={() => updateAppSettings({ windowBehavior: w })}
              >
                {w === 'tray' ? 'System tray' : 'Taskbar'}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">App theme</div>
            <div className="settings-row__desc">Interface appearance</div>
          </div>
          <div className="segmented">
            {(['light', 'dark', 'system'] as Theme[]).map((t) => (
              <button
                key={t}
                className={`segmented__option ${appSettings.theme === t ? 'segmented__option--active' : ''}`}
                onClick={() => updateAppSettings({ theme: t })}
              >
                {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System'}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Language</div>
            <div className="settings-row__desc">
              Changes the app's display language (prototype: interface text is not retranslated).
            </div>
          </div>
          <div className="segmented">
            {(['en', 'ru'] as Language[]).map((l) => (
              <button
                key={l}
                className={`segmented__option ${appSettings.language === l ? 'segmented__option--active' : ''}`}
                onClick={() => updateAppSettings({ language: l })}
              >
                {l === 'en' ? 'English' : 'Russian'}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">App updates</div>
            <div className="settings-row__desc">How Fixnet handles new version updates.</div>
          </div>
          <div className="segmented">
            {(['automatic', 'manual'] as UpdateMode[]).map((m) => (
              <button
                key={m}
                className={`segmented__option ${appSettings.updateMode === m ? 'segmented__option--active' : ''}`}
                onClick={() => updateAppSettings({ updateMode: m })}
              >
                {m === 'automatic' ? 'Install automatically' : 'Check manually'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: Account ───────────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section__title">Account settings</div>

        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div className="settings-row__label">Key</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
            <div className="settings-row__label">Subscription</div>
            <div className="settings-row__desc">
              {subscriptionLabel} · expires {formatDate(user.subscriptionExpiresAt)}
            </div>
          </div>
          <button className="btn btn--sm">Open personal cabinet</button>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Session</div>
          </div>
          <button className="btn btn--sm btn--danger" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </div>

      {/* ── Section 3: Connection ────────────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section__title">Connection</div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">DNS server</div>
            <div className="settings-row__desc">Used when a service has no custom DNS mode set</div>
          </div>
          <div className="segmented">
            {(['system', 'custom'] as const).map((d) => (
              <button
                key={d}
                className={`segmented__option ${appSettings.dnsMode === d ? 'segmented__option--active' : ''}`}
                onClick={() => updateAppSettings({ dnsMode: d })}
              >
                {d === 'system' ? 'System' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-subheading">General connection settings</div>
        <div className="settings-row__desc" style={{ marginBottom: 8 }}>
          Default parameters applied to newly added services.
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Connection type</div>
          </div>
          <div className="segmented">
            {(['udp', 'tcp', 'mixed'] as TransportType[]).map((v) => (
              <button
                key={v}
                className={`segmented__option ${appSettings.connectionDefaults.transportType === v ? 'segmented__option--active' : ''}`}
                onClick={() => updateConnectionDefaults({ transportType: v })}
              >
                {TRANSPORT_TYPE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Region</div>
          </div>
          <select
            className="form-select"
            value={appSettings.connectionDefaults.region}
            onChange={(e) => updateConnectionDefaults({ region: e.target.value })}
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.displayName} (load {r.serverLoad}%)
              </option>
            ))}
          </select>
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row__label">Use encryption</div>
          </div>
          <div className="segmented">
            {(['on', 'off'] as Encryption[]).map((v) => (
              <button
                key={v}
                className={`segmented__option ${appSettings.connectionDefaults.encryption === v ? 'segmented__option--active' : ''}`}
                onClick={() => updateConnectionDefaults({ encryption: v })}
              >
                {v === 'on' ? 'On' : 'Off'}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-row" style={{ borderBottom: 'none' }}>
          <div>
            <div className="settings-row__label">Enable IPv6</div>
          </div>
          <Toggle
            on={appSettings.connectionDefaults.ipv6}
            onClick={() => updateConnectionDefaults({ ipv6: !appSettings.connectionDefaults.ipv6 })}
          />
        </div>
      </div>

      {/* ── Section 3b: Emergency bridges ────────────────────────────────── */}
      <EmergencyBridgeSection />

      {/* ── Section 4: Advanced ──────────────────────────────────────────── */}
      <div className="settings-advanced-toggle">
        <div>
          <div className="settings-row__label">Show advanced settings</div>
          <div className="settings-row__desc">
            Reveals additional advanced options here, and when configuring individual services.
          </div>
        </div>
        <Toggle
          on={appSettings.showAdvancedSettings}
          onClick={() => updateAppSettings({ showAdvancedSettings: !appSettings.showAdvancedSettings })}
        />
      </div>

      {appSettings.showAdvancedSettings && (
        <div className="settings-section" style={{ marginTop: 10 }}>
          <div className="settings-section__title">Network simulation (mock parameters)</div>
          <div className="settings-row__desc" style={{ marginBottom: 10 }}>
            NFR-3: frequency and probability of route degradation are configurable for testing the flow.
          </div>

          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
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

          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
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
    </div>
  );
}
