import { useStore } from '../../store/useStore';
import { ServiceDetailModal } from './ServiceDetailModal';
import { RegionStep } from './onboarding/RegionStep';
import { RoutingDiagram } from './RoutingDiagram';
import { HeroBanner } from './HeroBanner';
import { OnboardingCoachmark } from '../common/OnboardingCoachmark';

export function Dashboard() {
  const onboardingStage = useStore((s) => s.onboardingStage);
  const library = useStore((s) => s.library);
  const isRunning = useStore((s) => s.isRunning);
  const activeServiceId = useStore((s) => s.activeServiceId);
  const closeServiceDetail = useStore((s) => s.closeServiceDetail);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const lastSessionServiceIds = useStore((s) => s.lastSessionServiceIds);
  const relaunchLastSession = useStore((s) => s.relaunchLastSession);
  const editLastSession = useStore((s) => s.editLastSession);
  const beginOnboardingRegionStep = useStore((s) => s.beginOnboardingRegionStep);
  const skipOnboarding = useStore((s) => s.skipOnboarding);
  const advanceOnboardingTour = useStore((s) => s.advanceOnboardingTour);
  const retreatOnboardingTour = useStore((s) => s.retreatOnboardingTour);

  if (onboardingStage === 'welcome') {
    return <HeroBanner welcomeIntro={{ onGetStarted: beginOnboardingRegionStep, onSkip: skipOnboarding }} />;
  }

  if (onboardingStage === 'region') {
    return <RegionStep />;
  }

  const lastSessionServices = lastSessionServiceIds
    .map((id) => library.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  if (library.length === 0) {
    return (
      <div style={{ position: 'relative' }}>
        <HeroBanner showRoutingCta onSelectServices={() => setActiveTab('services')} />
        {onboardingStage === 'tour-home' && (
          <OnboardingCoachmark
            step={2}
            className="coachmark--home"
            showPrev={false}
            text="Pick which services run through Fixnet and fine-tune each one — like Ultra-Speed Mode for gaming. Everything else stays exactly as it was"
            onSkip={skipOnboarding}
            onPrev={retreatOnboardingTour}
            onNext={advanceOnboardingTour}
          />
        )}
      </div>
    );
  }

  const isRoutingLive = isRunning && library.some((s) => s.enabled);
  const hasLastSession = !isRoutingLive && lastSessionServices.length > 0;

  return (
    <div>
      {isRoutingLive ? (
        <RoutingDiagram />
      ) : hasLastSession ? (
        <HeroBanner
          lastSession={{ services: lastSessionServices, onStart: relaunchLastSession, onEdit: editLastSession }}
        />
      ) : (
        <HeroBanner />
      )}

      {activeServiceId && <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />}
    </div>
  );
}
