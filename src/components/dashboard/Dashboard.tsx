import { Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ServiceDetailModal } from './ServiceDetailModal';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { RoutingDiagram } from './RoutingDiagram';
import { ServiceIcon } from '../common/ServiceIcon';
import { HeroBanner } from './HeroBanner';

export function Dashboard() {
  const isFirstLoginOfSession = useStore((s) => s.isFirstLoginOfSession);
  const library = useStore((s) => s.library);
  const isRunning = useStore((s) => s.isRunning);
  const activeServiceId = useStore((s) => s.activeServiceId);
  const closeServiceDetail = useStore((s) => s.closeServiceDetail);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const lastSessionServiceIds = useStore((s) => s.lastSessionServiceIds);
  const relaunchLastSession = useStore((s) => s.relaunchLastSession);
  const presets = useStore((s) => s.presets);
  const launchPreset = useStore((s) => s.launchPreset);

  if (isFirstLoginOfSession) {
    return <WelcomeOnboarding />;
  }

  const lastSessionServices = lastSessionServiceIds
    .map((id) => library.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  if (library.length === 0) {
    return <HeroBanner showRoutingCta onSelectServices={() => setActiveTab('library')} />;
  }

  const isRoutingLive = isRunning && library.some((s) => s.enabled);
  const hasLastSession = !isRoutingLive && lastSessionServices.length > 0;

  return (
    <div>
      {hasLastSession ? (
        <HeroBanner lastSession={{ services: lastSessionServices, onStart: relaunchLastSession }} />
      ) : (
        <HeroBanner />
      )}

      {isRoutingLive ? (
        <RoutingDiagram />
      ) : (
        <div>
          {presets.length > 0 && (
            <div className="preset-preview-row">
              {presets.map((preset) => {
                const presetServices = preset.serviceConfigs
                  .map((c) => library.find((s) => s.id === c.serviceId))
                  .filter((s): s is NonNullable<typeof s> => !!s);
                return (
                  <div key={preset.id} className="preset-preview-card">
                    <div className="preset-preview-card__name">{preset.name}</div>
                    <div className="quick-launch-card__icons">
                      {presetServices.map((s) => (
                        <span key={s.id} className="quick-launch-card__icon" title={s.name}>
                          <ServiceIcon name={s.name} fallback={s.icon} size={16} />
                        </span>
                      ))}
                    </div>
                    <button className="btn btn--sm btn--primary" onClick={() => launchPreset(preset.id)}>
                      <Play size={12} />
                      Launch
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeServiceId && <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />}
    </div>
  );
}
