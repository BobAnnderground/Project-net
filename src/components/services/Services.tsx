import { useState, useEffect } from 'react';
import { Plus, Play, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LibraryPickerGrid } from '../common/LibraryPickerGrid';
import { ServiceDetailModal } from '../dashboard/ServiceDetailModal';
import { ServiceIcon } from '../common/ServiceIcon';
import { OnboardingCoachmark } from '../common/OnboardingCoachmark';
import { CreateCustomServiceModal } from './CreateCustomServiceModal';
import { ManualServiceIntroModal } from './ManualServiceIntroModal';
import { useServiceSelection } from '../../lib/useServiceSelection';
import { LIBRARY_CATALOG } from '../../data/catalog';
import {
  buildCatalogDisplayItems,
  buildCustomDisplayItems,
  filterItemsByTab,
  resolveServiceIds,
  resolveDisplayItemServiceId,
  type LibraryTab,
} from '../../lib/libraryItems';

export function Services() {
  const library = useStore((s) => s.library);
  const getOrCreateServiceForEntry = useStore((s) => s.getOrCreateServiceForEntry);
  const startWithOnly = useStore((s) => s.startWithOnly);
  const activeServiceId = useStore((s) => s.activeServiceId);
  const openServiceDetail = useStore((s) => s.openServiceDetail);
  const closeServiceDetail = useStore((s) => s.closeServiceDetail);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const pendingServiceSelection = useStore((s) => s.pendingServiceSelection);
  const clearPendingServiceSelection = useStore((s) => s.clearPendingServiceSelection);
  const onboardingStage = useStore((s) => s.onboardingStage);
  const skipOnboarding = useStore((s) => s.skipOnboarding);
  const advanceOnboardingTour = useStore((s) => s.advanceOnboardingTour);
  const retreatOnboardingTour = useStore((s) => s.retreatOnboardingTour);
  const [manualAddStep, setManualAddStep] = useState<'closed' | 'intro' | 'form'>('closed');
  const [tab, setTab] = useState<LibraryTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedIds, setSelectedIds, toggleSelected } = useServiceSelection();

  // Seed the selection once when arriving via "Edit" from the last-session
  // card, then clear the pending value so it isn't reapplied later.
  useEffect(() => {
    if (pendingServiceSelection) {
      setSelectedIds(new Set(pendingServiceSelection));
      clearPendingServiceSelection();
    }
  }, [pendingServiceSelection, setSelectedIds, clearPendingServiceSelection]);

  const catalogItems = buildCatalogDisplayItems();
  const customItems = buildCustomDisplayItems(library);
  const visibleItems = filterItemsByTab(tab, catalogItems, customItems).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const selectedItems = [...catalogItems, ...customItems].filter((item) => selectedIds.has(item.id));
  const isOnboardingTour = onboardingStage === 'tour-services' || onboardingStage === 'tour-selected';

  function handleStart() {
    const serviceIds = resolveServiceIds(selectedIds, getOrCreateServiceForEntry);
    startWithOnly(serviceIds);
    setActiveTab('dashboard');
    if (isOnboardingTour) skipOnboarding();
  }

  function handleAutoSelectPopular() {
    setSelectedIds(new Set(LIBRARY_CATALOG.filter((e) => e.popular).map((e) => e.id)));
  }

  return (
    <div className="services-page">
      <div className="services-main">
        <div className="page-header">
          <div className="page-subtitle">Select the services you want to save to a preset</div>
          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            {isOnboardingTour && (
              <button className="btn" onClick={handleAutoSelectPopular}>
                Auto-select popular
              </button>
            )}
            <button
              className="btn btn--primary"
              disabled={isOnboardingTour}
              onClick={() => setManualAddStep('intro')}
            >
              <Plus size={14} />
              Add service
            </button>
          </div>
        </div>

        <LibraryPickerGrid
          tab={tab}
          onTabChange={setTab}
          visibleItems={visibleItems}
          selectedIds={selectedIds}
          onToggle={toggleSelected}
          onSettingsClick={(item) => openServiceDetail(resolveDisplayItemServiceId(item, getOrCreateServiceForEntry))}
          emptyTitle="No custom services yet"
          emptyText='Use "Add service" to add your own service.'
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by services"
        />
      </div>

      {selectedIds.size > 0 && (
        <aside className="services-selected-panel">
          <div className="services-selected-panel__header">
            <span className="services-selected-panel__count">
              {selectedIds.size} service{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button className="btn btn--sm btn--primary" onClick={handleStart}>
              <Play size={12} />
              Start selected
            </button>
          </div>

          <div className="services-selected-panel__list">
            {selectedItems.map((item) => (
              <div key={item.id} className="services-selected-card">
                <div className="services-selected-card__icon">
                  <ServiceIcon name={item.name} fallback={item.icon} size={20} />
                </div>
                <div className="services-selected-card__info">
                  <span className="services-selected-card__name">{item.name}</span>
                  <span className="services-selected-card__meta">{item.regionLabel}</span>
                </div>
                <button
                  className="services-selected-card__remove"
                  onClick={() => toggleSelected(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      {onboardingStage === 'tour-services' && (
        <OnboardingCoachmark
          step={3}
          className="coachmark--services"
          text='Choose the services you need manually, or tap "Auto-select popular" to preselect the most popular ones for your region'
          onSkip={skipOnboarding}
          onPrev={retreatOnboardingTour}
          onNext={advanceOnboardingTour}
        />
      )}
      {onboardingStage === 'tour-selected' && (
        <OnboardingCoachmark
          step={4}
          isLast
          className="coachmark--selected"
          text='Tap "Start selected" to launch a connection for your selected services'
          onSkip={skipOnboarding}
          onPrev={retreatOnboardingTour}
          onNext={advanceOnboardingTour}
        />
      )}

      {activeServiceId && (
        <ServiceDetailModal serviceId={activeServiceId} onClose={closeServiceDetail} />
      )}

      {manualAddStep === 'intro' && (
        <ManualServiceIntroModal
          onCancel={() => setManualAddStep('closed')}
          onContactSupport={() => setManualAddStep('closed')}
          onProceed={() => setManualAddStep('form')}
        />
      )}
      {manualAddStep === 'form' && (
        <CreateCustomServiceModal
          onClose={() => setManualAddStep('closed')}
          onCreated={() => {
            setManualAddStep('closed');
            setTab('custom');
          }}
        />
      )}
    </div>
  );
}
