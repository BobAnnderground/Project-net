import { useState } from 'react';
import { MapPin, Waypoints } from 'lucide-react';
import { LIBRARY_CATALOG } from '../../data/catalog';
import { REGIONS } from '../../data/regions';
import { WORLD_REGIONS } from '../../data/worldRegions';
import { useStore } from '../../store/useStore';
import type { LibraryEntry, ServiceCategory } from '../../types';
import { ServiceCard } from '../common/ServiceCard';
import { ServiceDetailModal } from './ServiceDetailModal';

function buildVisibleEntries(catalog: LibraryEntry[], expanded: Set<ServiceCategory>): LibraryEntry[] {
  const popular = catalog.filter((e) => e.popular);
  const result: LibraryEntry[] = [];
  for (const entry of popular) {
    result.push(entry);
    if (expanded.has(entry.category)) {
      result.push(...catalog.filter((e) => !e.popular && e.category === entry.category));
    }
  }
  return result;
}

export function WelcomeOnboarding() {
  const commitOnboardingSelection = useStore((s) => s.commitOnboardingSelection);
  const skipOnboarding = useStore((s) => s.skipOnboarding);
  const getOrCreateServiceForEntry = useStore((s) => s.getOrCreateServiceForEntry);
  const activeServiceId = useStore((s) => s.activeServiceId);
  const openServiceDetail = useStore((s) => s.openServiceDetail);
  const closeServiceDetail = useStore((s) => s.closeServiceDetail);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<ServiceCategory>>(new Set());
  const [homeRegion, setHomeRegion] = useState<string | null>(null);

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleCardClick(entry: LibraryEntry) {
    toggleId(entry.id);
    if (entry.popular && !expandedCategories.has(entry.category)) {
      setExpandedCategories((prev) => new Set(prev).add(entry.category));
    }
  }

  function handleFinalize(regionId: string | null) {
    const regionName = regionId ? WORLD_REGIONS.find((r) => r.id === regionId)?.name ?? null : null;
    commitOnboardingSelection([...selectedIds], regionName);
  }

  const visibleEntries = buildVisibleEntries(LIBRARY_CATALOG, expandedCategories);

  if (step === 2) {
    return (
      <div>
        <h1 className="onboard-heading">Where are you located?</h1>
        <p className="settings-row__desc" style={{ marginBottom: 'var(--space-16)' }}>
          Step 2 of 2 — pick a broad region, not your exact country, so nothing here can identify you. This only
          personalizes your experience; each service is still routed through whichever proxy region works best for
          it.
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
          <button className="btn" onClick={() => setStep(1)}>
            Back
          </button>
          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            <button className="btn" onClick={() => handleFinalize(null)}>
              Skip
            </button>
            <button className="btn btn--primary" onClick={() => handleFinalize(homeRegion)}>
              Launch services
            </button>
          </div>
        </div>

        {activeServiceId && (
          <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="onboard-heading">Choose the services you want to launch</h1>
      <p className="settings-row__desc" style={{ marginBottom: 'var(--space-24)' }}>Step 1 of 2</p>

      <div className="service-card-grid" style={{ marginBottom: 'var(--space-24)' }}>
        {visibleEntries.map((entry) => {
          const region = REGIONS.find((r) => r.id === entry.recommendedRegion);
          return (
            <div className="service-card--reveal" key={entry.id}>
              <ServiceCard
                icon={entry.icon}
                name={entry.name}
                chips={[
                  { icon: MapPin, label: region?.displayName ?? entry.recommendedRegion },
                  { icon: Waypoints, label: 'auto' },
                ]}
                selected={selectedIds.has(entry.id)}
                onClick={() => handleCardClick(entry)}
                onSettingsClick={() => openServiceDetail(getOrCreateServiceForEntry(entry.id))}
              />
            </div>
          );
        })}
      </div>

      <div className="onboard-footer" style={{ justifyContent: 'space-between' }}>
        <button className="btn" onClick={skipOnboarding}>
          Skip
        </button>
        <button
          className="btn btn--primary"
          disabled={selectedIds.size === 0}
          onClick={() => setStep(2)}
        >
          Next
        </button>
      </div>

      {activeServiceId && (
        <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />
      )}
    </div>
  );
}
