import { Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ServiceDetailModal } from './ServiceDetailModal';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { RoutingDiagram } from './RoutingDiagram';

function DashboardHero({
  variant,
  onSelectServices,
}: {
  variant: 'full' | 'compact';
  onSelectServices?: () => void;
}) {
  return (
    <div className={`dashboard-hero dashboard-hero--${variant}`}>
      <div className="dashboard-hero__title">Welcome to Fixnet</div>
      <p className="dashboard-hero__subtitle">Faster, smarter, and more reliable connections</p>
      {variant === 'full' && onSelectServices && (
        <button className="btn btn--primary dashboard-hero__cta" onClick={onSelectServices}>
          Select services
        </button>
      )}
    </div>
  );
}

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

  return (
    <div>
      {library.length === 0 ? (
        <DashboardHero variant="full" onSelectServices={() => setActiveTab('library')} />
      ) : isRunning && library.some((s) => s.enabled) ? (
        <>
          <DashboardHero variant="compact" />
          <RoutingDiagram />
        </>
      ) : (
        <div>
          <DashboardHero variant="compact" />
          {lastSessionServices.length > 0 && (
            <div className="quick-launch-card" style={{ marginBottom: 16 }}>
              <div className="quick-launch-card__info">
                <div className="quick-launch-card__title">Last session</div>
                <div className="quick-launch-card__icons">
                  {lastSessionServices.map((s) => (
                    <span key={s.id} className="quick-launch-card__icon" title={s.name}>
                      {s.icon}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn btn--primary" onClick={relaunchLastSession}>
                <Play size={14} />
                Launch again
              </button>
            </div>
          )}

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
                          {s.icon}
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
