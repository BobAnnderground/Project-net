import { useStore } from '../../store/useStore';
import { ServiceDetailModal } from './ServiceDetailModal';
import { WelcomeOnboarding } from './WelcomeOnboarding';
import { RoutingDiagram } from './RoutingDiagram';
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
  const editLastSession = useStore((s) => s.editLastSession);

  if (isFirstLoginOfSession) {
    return <WelcomeOnboarding />;
  }

  const lastSessionServices = lastSessionServiceIds
    .map((id) => library.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  if (library.length === 0) {
    return <HeroBanner showRoutingCta onSelectServices={() => setActiveTab('services')} />;
  }

  const isRoutingLive = isRunning && library.some((s) => s.enabled);
  const hasLastSession = !isRoutingLive && lastSessionServices.length > 0;

  return (
    <div>
      {hasLastSession ? (
        <HeroBanner
          lastSession={{ services: lastSessionServices, onStart: relaunchLastSession, onEdit: editLastSession }}
        />
      ) : (
        <HeroBanner />
      )}

      {isRoutingLive && <RoutingDiagram />}

      {activeServiceId && <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />}
    </div>
  );
}
