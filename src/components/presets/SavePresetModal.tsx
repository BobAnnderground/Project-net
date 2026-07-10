import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../store/useStore';

type Mode = 'existing' | 'new';

export function SavePresetModal({ serviceIds, onClose }: { serviceIds: string[]; onClose: () => void }) {
  const presets = useStore((s) => s.presets);
  const createPreset = useStore((s) => s.createPreset);
  const addServicesToPreset = useStore((s) => s.addServicesToPreset);

  const hasExistingPresets = presets.length > 0;
  const [mode, setMode] = useState<Mode>(hasExistingPresets ? 'existing' : 'new');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(presets[0]?.id ?? null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  function handleSubmit() {
    if (mode === 'existing') {
      if (!selectedPresetId) {
        setError('Select a preset.');
        return;
      }
      addServicesToPreset(selectedPresetId, serviceIds);
      onClose();
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a preset name.');
      return;
    }
    if (presets.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A preset with this name already exists.');
      return;
    }
    createPreset(trimmed, serviceIds);
    onClose();
  }

  return (
    <Modal
      title="Add to preset"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            {mode === 'existing' ? 'Add' : 'Create'}
          </button>
        </>
      }
    >
      {hasExistingPresets && (
        <div className="segmented" style={{ marginBottom: 'var(--space-16)' }}>
          <button
            className={`segmented__option ${mode === 'existing' ? 'segmented__option--active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => handleModeChange('existing')}
          >
            Existing preset
          </button>
          <button
            className={`segmented__option ${mode === 'new' ? 'segmented__option--active' : ''}`}
            style={{ flex: 1 }}
            onClick={() => handleModeChange('new')}
          >
            New preset
          </button>
        </div>
      )}

      {mode === 'existing' ? (
        <div className="form-group">
          <label className="form-label">Preset</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {presets.map((p) => (
              <button
                key={p.id}
                className={`region-tile${selectedPresetId === p.id ? ' region-tile--selected' : ''}`}
                onClick={() => {
                  setSelectedPresetId(p.id);
                  setError(null);
                }}
              >
                <div className="region-tile__name">{p.name}</div>
                <div className="region-tile__meta">
                  {p.serviceConfigs.length} service{p.serviceConfigs.length === 1 ? '' : 's'}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Gaming"
            autoFocus
          />
        </div>
      )}

      <div className="form-hint">
        {mode === 'existing'
          ? 'The selected services will be added to the chosen preset.'
          : `The preset will include the ${serviceIds.length} selected service${serviceIds.length === 1 ? '' : 's'} and their current settings.`}
      </div>

      {error && (
        <div className="warning-box" style={{ marginTop: 'var(--space-12)', borderColor: 'var(--err)', background: 'var(--err-dim)', color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
