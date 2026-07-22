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

  if (isFirstLoginOfSession) {
    return <WelcomeOnboarding />;
  }

  const lastSessionServices = lastSessionServiceIds
    .map((id) => library.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  if (library.length === 0) {
    return <HeroBanner showRoutingCta onSelectServices={() => setActiveTab('services')} />;
  }

  return (
    <div>
      <HeroBanner />

      {isRunning && library.some((s) => s.enabled) ? (
        <RoutingDiagram />
      ) : (
        <div>
          {lastSessionServices.length > 0 && (
            <div className="quick-launch-card" style={{ marginBottom: 'var(--space-16)' }}>
              <div className="quick-launch-card__info">
                <div className="quick-launch-card__title">Last session</div>
                <div className="quick-launch-card__icons">
                  {lastSessionServices.map((s) => (
                    <span key={s.id} className="quick-launch-card__icon" title={s.name}>
                      <ServiceIcon name={s.name} fallback={s.icon} size={16} />
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
        </div>
      )}

      {activeServiceId && <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />}
    </div>
  );
}
