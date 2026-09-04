import { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { Plus, Play, Square, RotateCw, SlidersHorizontal, MapPin, Waypoints } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useScrollFade } from '../../lib/useScrollFade';
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

// The selected-service "remove" badge (Fixnet • Wip / Fixnet • Library,
// node 295:799 "Delete"): a disc with the X boolean-subtracted out of it,
// so the X is negative space, not a drawn shape — the circle underneath
// (.services-selected-card__remove-hole) shows through the hole. Both
// layers are theme-colored via CSS, not hardcoded — confirmed against the
// rendered light frame that the whole badge inverts (dark disc/light
// cutout in light theme), not just the invariant dark-theme colors baked
// into Figma's own flattened SVG export. Path itself lifted unchanged.
function RemoveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle className="services-selected-card__remove-hole" cx="7.99508" cy="7.99499" r="6.665" />
      <path
        className="services-selected-card__remove-disc"
        d="M7.99992 1.33334C9.76732 1.33521 11.4624 2.03812 12.7122 3.28777C13.962 4.53761 14.6647 6.23247 14.6666 8.00001C14.6666 9.31855 14.2754 10.6081 13.5429 11.7044C12.8105 12.8002 11.7696 13.6544 10.552 14.1589C9.33391 14.6633 7.99224 14.7963 6.69913 14.5391C5.40618 14.2818 4.21856 13.6457 3.28637 12.7136C2.35425 11.7813 1.71939 10.5938 1.46215 9.30079C1.20496 8.00777 1.33664 6.66726 1.84105 5.44923C2.3456 4.23114 3.20057 3.18958 4.29679 2.45704C5.3929 1.7247 6.68167 1.33346 7.99992 1.33334ZM11.1379 4.86199C10.8776 4.60193 10.4555 4.60174 10.1952 4.86199L7.99992 7.0573L5.8046 4.86199C5.54423 4.60193 5.12214 4.60174 4.86189 4.86199C4.60193 5.12226 4.60193 5.54442 4.86189 5.8047L7.05721 8.00001L4.86189 10.1953C4.60193 10.4556 4.60193 10.8778 4.86189 11.138C5.12214 11.3983 5.54423 11.3981 5.8046 11.138L7.99992 8.94272L10.1952 11.138C10.4555 11.3983 10.8776 11.3981 11.1379 11.138C11.3983 10.8777 11.3983 10.4557 11.1379 10.1953L8.94263 8.00001L11.1379 5.8047C11.3983 5.54435 11.3983 5.12234 11.1379 4.86199Z"
      />
    </svg>
  );
}

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

  const countLabel = `${selectedIds.size} service${selectedIds.size > 1 ? 's' : ''}`;
  const { ref: selectedListRef, fadeTop: selectedFadeTop, fadeBottom: selectedFadeBottom } =
    useScrollFade<HTMLDivElement>([selectedItems.length]);

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
              <button
                className="btn"
                disabled={isOnboardingTour}
                onClick={() => setManualAddStep('intro')}
              >
                Add service
                <span className="btn__divider" />
                <Plus size={14} />
              </button>
              <button className="btn" onClick={handleAutoSelectPopular}>
                Auto-select popular
              </button>
            </>
          }
        />
      </div>

      {selectedIds.size > 0 && (
        <aside className="services-selected-panel">
          <div className={`services-selected-panel__header${isRunning ? ' services-selected-panel__header--split' : ''}`}>
            {!isRunning && (
              <>
                <span className="services-selected-panel__count">{countLabel}</span>
                <button className="btn btn--primary" onClick={handleStart}>
                  Start selected
                  <span className="btn__divider" />
                  <Play size={14} />
                </button>
              </>
            )}
            {isRunning && matchesRunningSelection && (
              <>
                <button className="btn" onClick={stopAll}>
                  Stop current connection
                  <span className="btn__divider" />
                  <Square size={14} />
                </button>
                <span className="services-selected-panel__count services-selected-panel__count--row2">
                  {countLabel}
                </span>
              </>
            )}
            {isRunning && !matchesRunningSelection && (
              <>
                <button className="btn" onClick={handleStart}>
                  Reconnect with changes
                  <span className="btn__divider" />
                  <RotateCw size={14} />
                </button>
                <span className="services-selected-panel__count services-selected-panel__count--row2">
                  {countLabel}
                </span>
              </>
            )}
          </div>

          <div
            ref={selectedListRef}
            className={clsx('services-selected-panel__list', 'scroll-fade', {
              'scroll-fade--top': selectedFadeTop,
              'scroll-fade--bottom': selectedFadeBottom,
            })}
          >
            {selectedItems.map((item) => (
              <div key={item.id} className="services-selected-card">
                <button
                  className="services-selected-card__remove"
                  onClick={() => toggleSelected(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <RemoveIcon />
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
