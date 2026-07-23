import clsx from 'clsx';
import { Play } from 'lucide-react';
import { ServiceIcon } from '../common/ServiceIcon';

interface LastSessionInfo {
  services: { id: string; name: string; icon: string }[];
  onStart: () => void;
}

interface HeroBannerProps {
  showRoutingCta?: boolean;
  onSelectServices?: () => void;
  lastSession?: LastSessionInfo;
}

const MAX_SESSION_ICONS = 6;

export function HeroBanner({ showRoutingCta, onSelectServices, lastSession }: HeroBannerProps) {
  const visibleSessionServices = lastSession?.services.slice(0, MAX_SESSION_ICONS) ?? [];
  const overflowCount = lastSession ? lastSession.services.length - visibleSessionServices.length : 0;
  const showCompactArt = !showRoutingCta && !lastSession;

  return (
    <div
      className={clsx('hero-banner', {
        'hero-banner--cta': showRoutingCta,
        'hero-banner--session': !!lastSession,
      })}
    >
      {showCompactArt && <img src="/images/hero-keyvisual.png" alt="" className="hero-banner__art" />}
      {showRoutingCta && (
        <img src="/images/Key-visual-Welcome.webp" alt="" className="hero-banner__keyvisual" />
      )}
      {lastSession && (
        <img src="/images/Key-visual-last-session.webp" alt="" className="hero-banner__keyvisual" />
      )}
      <div className="hero-banner__content">
        <h1 className="hero-banner__title">{lastSession ? 'Last session' : 'Welcome to Fixnet'}</h1>

        {showRoutingCta && (
          <div className="hero-banner__routing-row">
            <div className="hero-banner__routing-col">
              <div className="hero-banner__routing-text">
                <p className="hero-banner__routing-heading">Service Routing</p>
                <p className="hero-banner__routing-desc">
                  Choose the best route for each service to maintain a fast and stable connection
                </p>
              </div>
              <button className="hero-banner__btn hero-banner__btn--accent" onClick={onSelectServices}>
                Select services
              </button>
            </div>
            <div className="hero-banner__routing-col">
              <div className="hero-banner__routing-text">
                <p className="hero-banner__routing-heading">Full mode</p>
                <p className="hero-banner__routing-desc">
                  Routes all traffic through a single connection. Individual service settings are ignored
                </p>
              </div>
              {/* No onClick: full-tunnel routing isn't modeled in the store yet. */}
              <button className="hero-banner__btn hero-banner__btn--tertiary">Enable full mode</button>
            </div>
          </div>
        )}

        {lastSession && (
          <>
            <div className="hero-banner__session-icons">
              {visibleSessionServices.map((s) => (
                <span key={s.id} className="hero-banner__session-icon" title={s.name}>
                  <ServiceIcon name={s.name} fallback={s.icon} size={24} />
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="hero-banner__session-icon hero-banner__session-icon--overflow">
                  +{overflowCount}
                </span>
              )}
            </div>
            <button
              className="hero-banner__btn hero-banner__btn--accent hero-banner__session-start"
              onClick={lastSession.onStart}
            >
              <Play size={14} />
              Start
            </button>
          </>
        )}

        {!showRoutingCta && !lastSession && (
          <p className="hero-banner__subtitle">Faster, smarter, and more reliable connections</p>
        )}
      </div>

      {lastSession && (
        <div className="hero-banner__fullmode-panel">
          <div className="hero-banner__routing-text">
            <p className="hero-banner__routing-heading">Full mode</p>
            <p className="hero-banner__routing-desc">
              Routes all traffic through a single connection. Individual service settings are ignored
            </p>
          </div>
          {/* No onClick: full-tunnel routing isn't modeled in the store yet. */}
          <button className="hero-banner__btn hero-banner__btn--tertiary">Enable full mode</button>
        </div>
      )}
    </div>
  );
}
