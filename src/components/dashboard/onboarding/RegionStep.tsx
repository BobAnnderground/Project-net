import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { WORLD_REGIONS } from '../../../data/worldRegions';
import { useStore } from '../../../store/useStore';

// Selected-tile radio (Fixnet • Wip, node 1170:268717 dark / 1170:268787
// light): ring + dot don't share a fixed relationship across themes, so
// both colors come from dedicated CSS vars rather than existing tokens.
function RadioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="var(--onboard-radio-ring)" />
      <circle cx="8" cy="8" r="3" fill="var(--onboard-radio-dot)" />
    </svg>
  );
}

export function RegionStep() {
  const skipOnboarding = useStore((s) => s.skipOnboarding);
  const commitOnboardingRegion = useStore((s) => s.commitOnboardingRegion);
  // Seeded from the store, not a bare useState(null) — retreatOnboardingTour
  // can land back here from the step-2 tooltip's "prev" arrow, and the pick
  // made on the way through shouldn't be lost.
  const savedHomeRegion = useStore((s) => s.user.homeRegion);
  const [homeRegion, setHomeRegion] = useState<string | null>(savedHomeRegion);

  return (
    <div className="onboard-panel">
      <div className="onboard-header">
        <div className="onboard-step">1 / 4</div>
        <h1 className="onboard-heading">Choose your region</h1>
        <p className="onboard-subtitle">
          Choose a broad region to help optimize your connection. Your exact location stays private, and you can
          change your region anytime in Settings.
        </p>
      </div>

      <div className="region-grid">
        {WORLD_REGIONS.map((region) => {
          const selected = homeRegion === region.id;
          return (
            <button
              key={region.id}
              className={`onboard-region-tile${selected ? ' onboard-region-tile--selected' : ''}`}
              onClick={() => setHomeRegion((prev) => (prev === region.id ? null : region.id))}
            >
              {selected && (
                <span className="onboard-region-tile__radio">
                  <RadioIcon />
                </span>
              )}
              <div className="onboard-region-tile__name">{region.name}</div>
            </button>
          );
        })}
      </div>

      <div className="onboard-footer">
        <button className="btn" onClick={skipOnboarding}>
          Skip onboarding
        </button>
        <button className="btn btn--primary" onClick={() => commitOnboardingRegion(homeRegion)}>
          Continue
          <span className="btn__divider" />
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
