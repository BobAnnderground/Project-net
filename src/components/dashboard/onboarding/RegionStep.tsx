import { useState } from 'react';
import { WORLD_REGIONS } from '../../../data/worldRegions';
import { useStore } from '../../../store/useStore';

export function RegionStep() {
  const skipOnboarding = useStore((s) => s.skipOnboarding);
  const commitOnboardingRegion = useStore((s) => s.commitOnboardingRegion);
  const [homeRegion, setHomeRegion] = useState<string | null>(null);

  return (
    <div>
      <div className="onboard-step">1 / 4</div>
      <h1 className="onboard-heading">Choose your region</h1>
      <p className="settings-row__desc" style={{ marginBottom: 'var(--space-16)' }}>
        Choose a broad region to help optimize your connection. Your exact location stays private, and you can
        change your region anytime in Settings.
      </p>

      <div className="region-grid">
        {WORLD_REGIONS.map((region) => (
          <button
            key={region.id}
            className={`region-tile${homeRegion === region.id ? ' region-tile--selected' : ''}`}
            onClick={() => setHomeRegion((prev) => (prev === region.id ? null : region.id))}
          >
            <div className="region-tile__name">{region.name}</div>
          </button>
        ))}
      </div>

      <div className="onboard-footer" style={{ justifyContent: 'space-between' }}>
        <button className="btn" onClick={skipOnboarding}>
          Skip onboarding
        </button>
        <button className="btn btn--primary" onClick={() => commitOnboardingRegion(homeRegion)}>
          Continue
        </button>
      </div>
    </div>
  );
}
