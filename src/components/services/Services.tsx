import { useState, useEffect, useMemo } from 'react';
import { Plus, Play, Square, RotateCw, SlidersHorizontal, MapPin, Waypoints, X } from 'lucide-react';
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
  displayIdsForServices,
  type LibraryTab,
} from '../../lib/libraryItems';

export function Services() {
  const library = useStore((s) => s.library);
  const isRunning = useStore((s) => s.isRunning);
  const getOrCreateServiceForEntry = useStore((s) => s.getOrCreateServiceForEntry);
  const startWithOnly = useStore((s) => s.startWithOnly);
  const stopAll = useStore((s) => s.stopAll);
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

  // Landing here while a session is already running starts you off editing
  // that running set, so the panel opens straight into "Stop current
  // connection" — matching it needs one click, not re-picking every card.
  // Mount-only: seeds the initial selection, not a live sync with `library`.
  useEffect(() => {
    if (isRunning && !pendingServiceSelection) {
      const runningServices = library.filter((s) => s.enabled);
      if (runningServices.length > 0) {
        setSelectedIds(new Set(displayIdsForServices(runningServices)));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catalogItems = buildCatalogDisplayItems();
  const customItems = buildCustomDisplayItems(library);
  const visibleItems = filterItemsByTab(tab, catalogItems, customItems).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const selectedItems = [...catalogItems, ...customItems].filter((item) => selectedIds.has(item.id));
  const isOnboardingTour = onboardingStage === 'tour-services' || onboardingStage === 'tour-selected';

  // Whether the current selection is exactly what's already running, so the
  // panel can offer "Stop" instead of relaunching the same set, and offer
  // "Reconnect with changes" instead of "Start" when the two sets diverge.
  const matchesRunningSelection = useMemo(() => {
    if (!isRunning) return false;
    const runningIds = new Set(displayIdsForServices(library.filter((s) => s.enabled)));
    if (runningIds.size !== selectedIds.size) return false;
    for (const id of selectedIds) {
      if (!runningIds.has(id)) return false;
    }
    return true;
  }, [isRunning, library, selectedIds]);

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
          toolbarSubtitle="Choose the services you want to connect"
          toolbarActions={
            <>
              <button className="btn" onClick={handleAutoSelectPopular}>
                Auto-select popular
              </button>
              <button
                className="btn"
                disabled={isOnboardingTour}
                onClick={() => setManualAddStep('intro')}
              >
                Add service
                <Plus size={14} />
              </button>
            </>
          }
        />
      </div>

      {selectedIds.size > 0 && (
        <aside className="services-selected-panel">
          <div className="services-selected-panel__header">
            <span className="services-selected-panel__count">
              {selectedIds.size} service{selectedIds.size > 1 ? 's' : ''}
            </span>
            {!isRunning && (
              <button className="btn btn--sm btn--gradient" onClick={handleStart}>
                Start selected
                <Play size={12} />
              </button>
            )}
            {isRunning && matchesRunningSelection && (
              <button className="btn btn--sm btn--gradient" onClick={stopAll}>
                Stop current connection
                <Square size={12} />
              </button>
            )}
            {isRunning && !matchesRunningSelection && (
              <button className="btn btn--sm btn--gradient" onClick={handleStart}>
                Reconnect with changes
                <RotateCw size={12} />
              </button>
            )}
          </div>

          <div className="services-selected-panel__list">
            {selectedItems.map((item) => (
              <div key={item.id} className="services-selected-card">
                <button
                  className="services-selected-card__remove"
                  onClick={() => toggleSelected(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <X size={10} />
                </button>
                <div className="services-selected-card__icon">
                  <ServiceIcon name={item.name} fallback={item.icon} size={20} />
                </div>
                <div className="services-selected-card__chips">
                  <span className="service-chip">
                    <MapPin size={12} className="service-chip__icon" />
                    <span className="service-chip__label">{item.regionLabel}</span>
                  </span>
                  <span className="service-chip">
                    <Waypoints size={12} className="service-chip__icon" />
                    <span className="service-chip__label">{item.modeLabel}</span>
                  </span>
                </div>
                <button
                  className="services-selected-card__settings-btn"
                  onClick={() => openServiceDetail(resolveDisplayItemServiceId(item, getOrCreateServiceForEntry))}
                  aria-label={`Settings for ${item.name}`}
                >
                  <SlidersHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>

          {selectedIds.size > 1 && (
            <button className="services-selected-panel__delete-all" onClick={() => setSelectedIds(new Set())}>
              Delete all
            </button>
          )}
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
