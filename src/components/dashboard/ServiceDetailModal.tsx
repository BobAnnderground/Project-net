import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Plus, Trash2, Play, Search } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useStore } from '../../store/useStore';
import { REGIONS } from '../../data/regions';
import { TRANSPORT_TYPE_LABELS, CONNECTION_MODE_LABELS } from '../../lib/labels';
import { SavePresetModal } from '../presets/SavePresetModal';
import type { Encryption, NetworkRule, TransportType, ConnectionMode } from '../../types';

export function ServiceDetailModal({ serviceId, onClose }: { serviceId: string; onClose: () => void }) {
  const service = useStore((s) => s.library.find((sv) => sv.id === serviceId));
  const showAdvancedSettings = useStore((s) => s.appSettings.showAdvancedSettings);
  const updateService = useStore((s) => s.updateService);
  const enableServices = useStore((s) => s.enableServices);
  const startWithOnly = useStore((s) => s.startWithOnly);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  if (!service) return null;

  function handleUpdateService(patch: Parameters<typeof updateService>[1]) {
    if (!service) return;
    updateService(service.id, patch);
    setHasChanges(true);
  }

  function handleCloseAttempt() {
    if (hasChanges) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }

  function handleAddToPreset() {
    if (!service) return;
    enableServices([service.id]);
    setShowSaveModal(true);
  }

  function handleStart() {
    if (!service) return;
    startWithOnly([service.id]);
    setActiveTab('dashboard');
    onClose();
  }

  function addRule() {
    if (!service) return;
    const rule: NetworkRule = { id: nanoid(), type: 'port', value: '', direction: 'both' };
    handleUpdateService({ additionalRules: [...service.additionalRules, rule] });
  }

  function updateRule(ruleId: string, patch: Partial<NetworkRule>) {
    if (!service) return;
    handleUpdateService({
      additionalRules: service.additionalRules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
    });
  }

  function removeRule(ruleId: string) {
    if (!service) return;
    handleUpdateService({ additionalRules: service.additionalRules.filter((r) => r.id !== ruleId) });
  }

  return (
    <Modal title={service.name} onClose={handleCloseAttempt}>
      <div className="form-group">
        <label className="form-label">Region</label>
        <div className="search-input-wrap">
          <Search size={14} className="search-input-wrap__icon" />
          <input
            className="form-input search-input-wrap__input"
            placeholder="Search regions..."
            value={regionSearch}
            onChange={(e) => setRegionSearch(e.target.value)}
          />
        </div>
        <div className="region-picker-list">
          {REGIONS.filter((r) =>
            r.displayName.toLowerCase().includes(regionSearch.trim().toLowerCase())
          ).map((r) => (
            <button
              key={r.id}
              className={`region-tile${service.region === r.id ? ' region-tile--selected' : ''}`}
              onClick={() => handleUpdateService({ region: r.id })}
            >
              <div className="region-tile__name">{r.displayName}</div>
              <div className="region-tile__meta">{r.country} · load {r.serverLoad}%</div>
            </button>
          ))}
        </div>
      </div>

      {showAdvancedSettings ? (
        <>
          <div className="form-group">
            <label className="form-label">Encryption</label>
            <div className="segmented">
              {(['on', 'off'] as Encryption[]).map((v) => (
                <button
                  key={v}
                  className={`segmented__option ${service.encryption === v ? 'segmented__option--active' : ''}`}
                  onClick={() => handleUpdateService({ encryption: v })}
                >
                  {v === 'on' ? 'On' : 'Off'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Connection type</label>
            <div className="segmented">
              {(['udp', 'tcp', 'mixed'] as TransportType[]).map((v) => (
                <button
                  key={v}
                  className={`segmented__option ${service.transportType === v ? 'segmented__option--active' : ''}`}
                  onClick={() => handleUpdateService({ transportType: v })}
                >
                  {TRANSPORT_TYPE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">DNS</label>
            <div className="segmented">
              {(['default', 'custom'] as const).map((v) => (
                <button
                  key={v}
                  className={`segmented__option ${service.dnsMode === v ? 'segmented__option--active' : ''}`}
                  onClick={() => handleUpdateService({ dnsMode: v })}
                >
                  {v === 'default' ? 'Automatic' : 'Custom server'}
                </button>
              ))}
            </div>
            <div className="form-hint">
              Not specific to this service — falls back to the global DNS setting in Settings.
            </div>
          </div>
        </>
      ) : (
        <div className="form-group">
          <label className="form-label">Connection mode</label>
          <div className="segmented">
            {(['default', 'fast', 'stable', 'secure'] as ConnectionMode[]).map((v) => (
              <button
                key={v}
                className={`segmented__option ${service.connectionMode === v ? 'segmented__option--active' : ''}`}
                onClick={() => handleUpdateService({ connectionMode: v })}
              >
                {CONNECTION_MODE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>
      )}

      {showAdvancedSettings && (
        <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-12)', marginTop: 'var(--space-4)' }}>
          <label className="form-label">Advanced settings</label>
          <div className="form-hint" style={{ marginBottom: 'var(--space-12)' }}>
            Technical detection details and network rules — for experienced users.
          </div>

          <div className="detail-grid" style={{ marginBottom: 'var(--space-12)' }}>
            <div className="detail-stat">
              <div className="detail-stat__label">Detection method</div>
              <div className="detail-stat__value" style={{ fontSize: 13 }}>{service.detectionMethod}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Custom service</div>
              <div className="detail-stat__value" style={{ fontSize: 13 }}>{service.isCustom ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {service.domains.length > 0 && (
            <div className="form-group">
              <label className="form-label">Domains</label>
              <div className="form-hint">
                {service.domains.join(', ')}
                {service.includeSubdomains ? ' (including subdomains)' : ''}
              </div>
            </div>
          )}

          {service.exePath && (
            <div className="form-group">
              <label className="form-label">Executable path</label>
              <div className="form-hint">{service.exePath}</div>
            </div>
          )}

          {service.ipRange && (
            <div className="form-group">
              <label className="form-label">IP range</label>
              <div className="form-hint">{service.ipRange}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Additional network rules</label>
            {service.additionalRules.map((rule) => (
              <div key={rule.id} style={{ display: 'flex', gap: 'var(--space-8)', marginBottom: 'var(--space-8)' }}>
                <select
                  className="form-select"
                  value={rule.type}
                  onChange={(e) => updateRule(rule.id, { type: e.target.value as NetworkRule['type'] })}
                  style={{ flex: '0 0 90px' }}
                >
                  <option value="port">Port</option>
                  <option value="ipRange">IP range</option>
                  <option value="protocol">Protocol</option>
                </select>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                  placeholder="Value"
                />
                <select
                  className="form-select"
                  value={rule.direction}
                  onChange={(e) => updateRule(rule.id, { direction: e.target.value as NetworkRule['direction'] })}
                  style={{ flex: '0 0 90px' }}
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="both">Both</option>
                </select>
                <button className="btn btn--sm btn--danger" onClick={() => removeRule(rule.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button className="btn btn--sm" onClick={addRule}>
              <Plus size={12} />
              Add rule
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAddToPreset}>
          <Plus size={14} />
          Add to preset
        </button>
        <button className="btn btn--primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleStart}>
          <Play size={14} />
          Start
        </button>
      </div>

      {showSaveModal && (
        <SavePresetModal serviceIds={[service.id]} onClose={() => setShowSaveModal(false)} />
      )}

      {showCloseConfirm && (
        <Modal
          title="Unsaved changes"
          onClose={() => setShowCloseConfirm(false)}
          footer={
            <>
              <button className="btn" onClick={() => setShowCloseConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={onClose}>
                Close
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--text-1)', margin: 0, lineHeight: 1.5 }}>
            There are unsaved changes. Are you sure you want to close this window?
          </p>
        </Modal>
      )}
    </Modal>
  );
}
