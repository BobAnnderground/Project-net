import { useState } from 'react';
import { Plus, CheckCircle2, Trash2, Play, ChevronDown, MapPin, Waypoints } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { REGIONS } from '../../data/regions';
import { TRANSPORT_TYPE_CHIP_LABELS } from '../../lib/labels';
import { ServiceCard } from '../common/ServiceCard';
import { ServiceDetailModal } from '../dashboard/ServiceDetailModal';
import { CreatePresetModal } from './CreatePresetModal';
import { AddServiceModal } from './AddServiceModal';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Presets() {
  const presets = useStore((s) => s.presets);
  const library = useStore((s) => s.library);
  const launchPreset = useStore((s) => s.launchPreset);
  const deletePreset = useStore((s) => s.deletePreset);
  const removeServiceFromPreset = useStore((s) => s.removeServiceFromPreset);
  const activeServiceId = useStore((s) => s.activeServiceId);
  const openServiceDetail = useStore((s) => s.openServiceDetail);
  const closeServiceDetail = useStore((s) => s.closeServiceDetail);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addServicePresetId, setAddServicePresetId] = useState<string | null>(null);

  function handleLaunch(presetId: string) {
    launchPreset(presetId);
    setActiveTab('dashboard');
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Presets</div>
          <div className="page-subtitle">Named sets of service settings — FR-17, FR-18 SRS</div>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          Create preset
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">No presets yet</div>
          <p>Create a preset and pick the services it should launch, so you can relaunch them anytime.</p>
        </div>
      ) : (
        <div className="presets-list">
          {presets.map((preset) => {
            const isExpanded = expandedId === preset.id;
            return (
              <div
                key={preset.id}
                className={`preset-card ${preset.isActive ? 'preset-card--active' : ''} ${isExpanded ? 'preset-card--expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : preset.id)}
              >
                <div className="preset-card__row">
                  <div className="preset-card__main">
                    <div className="preset-card__name">
                      {preset.name}
                      {preset.isActive && <CheckCircle2 size={14} color="var(--accent)" />}
                    </div>
                    <div className="preset-card__meta">
                      {preset.serviceConfigs.length} service{preset.serviceConfigs.length === 1 ? '' : 's'} · created{' '}
                      {formatDate(preset.createdAt)}
                    </div>
                  </div>

                  <ChevronDown size={16} className="preset-card__chevron" />

                  <div className="preset-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn--sm btn--primary" onClick={() => handleLaunch(preset.id)}>
                      <Play size={12} />
                      Launch
                    </button>
                    <button className="btn btn--sm btn--danger" onClick={() => deletePreset(preset.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="preset-card__services" onClick={(e) => e.stopPropagation()}>
                    {preset.serviceConfigs.length === 0 && (
                      <div className="form-hint">No services in this preset yet.</div>
                    )}
                    {preset.serviceConfigs.map((cfg) => {
                      const svc = library.find((s) => s.id === cfg.serviceId);
                      if (!svc) return null;
                      const region = REGIONS.find((r) => r.id === svc.region);
                      return (
                        <ServiceCard
                          key={svc.id}
                          icon={svc.icon}
                          name={svc.name}
                          chips={[
                            { icon: MapPin, label: region?.displayName ?? svc.region },
                            { icon: Waypoints, label: TRANSPORT_TYPE_CHIP_LABELS[svc.transportType] },
                          ]}
                          selected={false}
                          onClick={() => {}}
                          onSettingsClick={() => openServiceDetail(svc.id)}
                          onRemoveClick={() => removeServiceFromPreset(preset.id, svc.id)}
                        />
                      );
                    })}

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setAddServicePresetId(preset.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setAddServicePresetId(preset.id);
                        }
                      }}
                      className="service-card service-card--select-all"
                    >
                      <div className="service-card__header">
                        <div className="service-card__icon-swatch">
                          <Plus size={16} />
                        </div>
                        <span className="service-card__name">Add service</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && <CreatePresetModal onClose={() => setShowCreateModal(false)} />}
      {addServicePresetId && (
        <AddServiceModal presetId={addServicePresetId} onClose={() => setAddServicePresetId(null)} />
      )}
      {activeServiceId && <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />}
    </div>
  );
}
