import { useState } from 'react';
import { Wrench, Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LibraryPickerGrid } from '../common/LibraryPickerGrid';
import { ServiceDetailModal } from '../dashboard/ServiceDetailModal';
import { CreateCustomServiceModal } from './CreateCustomServiceModal';
import { ManualServiceIntroModal } from './ManualServiceIntroModal';
import { useServiceSelection } from '../../lib/useServiceSelection';
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
  const [manualAddStep, setManualAddStep] = useState<'closed' | 'intro' | 'form'>('closed');
  const [tab, setTab] = useState<LibraryTab>('all');
  const { selectedIds, toggleSelected } = useServiceSelection();

  const catalogItems = buildCatalogDisplayItems();
  const customItems = buildCustomDisplayItems(library);
  const visibleItems = filterItemsByTab(tab, catalogItems, customItems);

  function handleStart() {
    const serviceIds = resolveServiceIds(selectedIds, getOrCreateServiceForEntry);
    startWithOnly(serviceIds);
    setActiveTab('dashboard');
  }

  return (
    <div>
      <div className="page-header page-header--end">
        <button className="btn btn--primary" onClick={() => setManualAddStep('intro')}>
          <Wrench size={14} />
          Create service manually
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="selection-bar">
          <div className="selection-bar__count">
            {selectedIds.size} service{selectedIds.size > 1 ? 's' : ''} selected
          </div>
          <div className="selection-bar__actions">
            <button className="btn btn--sm btn--primary" onClick={handleStart}>
              <Play size={12} />
              Start
            </button>
          </div>
        </div>
      )}

      <LibraryPickerGrid
        tab={tab}
        onTabChange={setTab}
        visibleItems={visibleItems}
        selectedIds={selectedIds}
        onToggle={toggleSelected}
        onSettingsClick={(item) => openServiceDetail(resolveDisplayItemServiceId(item, getOrCreateServiceForEntry))}
        emptyTitle="No custom services yet"
        emptyText='Use "Create service manually" to add your own service.'
      />

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
