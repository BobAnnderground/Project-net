import clsx from 'clsx';

interface HeroBannerProps {
  showRoutingCta?: boolean;
  onSelectServices?: () => void;
}

export function HeroBanner({ showRoutingCta, onSelectServices }: HeroBannerProps) {
  return (
    <div className={clsx('hero-banner', { 'hero-banner--cta': showRoutingCta })}>
      <img src="/images/hero-keyvisual.png" alt="" className="hero-banner__art" />
      <div className="hero-banner__content">
        <h1 className="hero-banner__title">Welcome to Fixnet</h1>
        {showRoutingCta ? (
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
        ) : (
          <p className="hero-banner__subtitle">Faster, smarter, and more reliable connections</p>
        )}
      </div>
    </div>
  );
}
