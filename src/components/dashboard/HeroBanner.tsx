import { ArrowRight, PencilLine, Play, SlidersHorizontal } from 'lucide-react';
import { ServiceIcon } from '../common/ServiceIcon';
import { useResolvedTheme } from '../../lib/useResolvedTheme';
import type { Service } from '../../types';

interface ServiceRoutingInfo {
  isEmpty: boolean;
  services: Service[];
  onSelectServices: () => void;
  onStart: () => void;
  onEdit: () => void;
}

interface WelcomeIntroInfo {
  onGetStarted: () => void;
  onSkip: () => void;
}

interface HeroBannerProps {
  serviceRouting?: ServiceRoutingInfo;
  welcomeIntro?: WelcomeIntroInfo;
}

const MAX_ROW_ICONS = 7;

export function HeroBanner({ serviceRouting, welcomeIntro }: HeroBannerProps) {
  const resolvedTheme = useResolvedTheme();

  if (welcomeIntro) {
    return (
      <div className="hero-banner">
        <img src="/images/Key-visual-Welcome.webp" alt="" className="hero-banner__keyvisual" />
        <div className="hero-banner__content">
          <h1 className="hero-banner__title">Welcome to Fixnet</h1>
          <p className="hero-banner__subtitle">
            Let's set a few things up so Fixnet works exactly the way you need. It only takes a minute
          </p>
          <div className="hero-banner__welcome-actions">
            <button className="btn btn--primary" onClick={welcomeIntro.onGetStarted}>
              Get started
            </button>
            <button className="btn" onClick={welcomeIntro.onSkip}>
              Skip onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceRouting) return null;

  const { isEmpty, services, onSelectServices, onStart, onEdit } = serviceRouting;
  const visibleIcons = services.slice(0, MAX_ROW_ICONS);
  const overflowCount = services.length - visibleIcons.length;
  const isLight = resolvedTheme === 'light';

  return (
    <div className="dashboard-hero">
      <div className="dashboard-hero__card dashboard-hero__card--routing">
        <img
          src={isLight ? '/images/Home screen/Service Routing-light.webp' : '/images/Home screen/Service Routing.webp'}
          alt=""
          className="dashboard-hero__art dashboard-hero__art--routing"
        />
        <div className="dashboard-hero__body">
          <div className="dashboard-hero__text">
            <h2 className="dashboard-hero__heading">Service Routing</h2>
            <p className="dashboard-hero__desc">
              Choose the best route for each service to maintain a fast and stable connection
            </p>
          </div>
          <div className="dashboard-hero__actions">
            {isEmpty ? (
              <button className="btn" onClick={onSelectServices}>
                Select services
                <span className="btn__divider" />
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button className="btn" onClick={onStart}>
                  Start
                  <span className="btn__divider" />
                  <Play size={14} />
                </button>
                <button className="btn" onClick={onEdit}>
                  Edit
                  <span className="btn__divider" />
                  <PencilLine size={14} />
                </button>
              </>
            )}
          </div>
        </div>
        {!isEmpty && (
          <div className="dashboard-hero__services">
            {visibleIcons.map((s) => (
              <span key={s.id} className="dashboard-hero__service-icon" title={s.name}>
                <ServiceIcon name={s.name} fallback={s.icon} size={24} />
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="dashboard-hero__service-icon dashboard-hero__service-icon--overflow">
                +{overflowCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-hero__card dashboard-hero__card--fullmode">
        <img
          src={isLight ? '/images/Home screen/Full mode-light.webp' : '/images/Home screen/Full mode.webp'}
          alt=""
          className="dashboard-hero__art dashboard-hero__art--fullmode"
        />
        <div className="dashboard-hero__body dashboard-hero__body--bottom">
          <div className="dashboard-hero__text">
            <h2 className="dashboard-hero__heading">Full mode</h2>
            <p className="dashboard-hero__desc">
              Routes all traffic through a single connection. Individual service settings are ignored
            </p>
          </div>
          <div className="dashboard-hero__actions">
            <button className="btn btn--icon" aria-label="Full mode settings">
              <SlidersHorizontal size={14} />
            </button>
            {/* No onClick: full-tunnel routing isn't modeled in the store yet — matches the
                mockup visually (a live-looking primary CTA), but the feature itself is out
                of scope for this pass. */}
            <button className="btn btn--primary">
              Enable full mode
              <span className="btn__divider" />
              <Play size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
