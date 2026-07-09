import { useState } from 'react';
import { Wrench, Plus, Play } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { LibraryPickerGrid } from '../common/LibraryPickerGrid';
import { ServiceDetailModal } from '../dashboard/ServiceDetailModal';
import { CreateCustomServiceModal } from './CreateCustomServiceModal';
import { ManualServiceIntroModal } from './ManualServiceIntroModal';
import { SavePresetModal } from '../presets/SavePresetModal';
import { useServiceSelection } from '../../lib/useServiceSelection';
import {
  buildCatalogDisplayItems,
  buildCustomDisplayItems,
  filterItemsByTab,
  resolveServiceIds,
  resolveDisplayItemServiceId,
  type LibraryTab,
} from '../../lib/libraryItems';

export function Library() {
  const library = useStore((s) => s.library);
  const getOrCreateServiceForEntry = useStore((s) => s.getOrCreateServiceForEntry);
  const enableServices = useStore((s) => s.enableServices);
  const startWithOnly = useStore((s) => s.startWithOnly);
  const activeServiceId = useStore((s) => s.activeServiceId);
  const openServiceDetail = useStore((s) => s.openServiceDetail);
  const closeServiceDetail = useStore((s) => s.closeServiceDetail);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const [manualAddStep, setManualAddStep] = useState<'closed' | 'intro' | 'form'>('closed');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tab, setTab] = useState<LibraryTab>('all');
  const [presetServiceIds, setPresetServiceIds] = useState<string[]>([]);
  const { selectedIds, setSelectedIds, toggleSelected, handleSelectAllToggle } = useServiceSelection();

  const catalogItems = buildCatalogDisplayItems();
  const customItems = buildCustomDisplayItems(library);
  const visibleItems = filterItemsByTab(tab, catalogItems, customItems);

  function handleStart() {
    const serviceIds = resolveServiceIds(selectedIds, getOrCreateServiceForEntry);
    startWithOnly(serviceIds);
    setActiveTab('dashboard');
  }

  function handleAddToPreset() {
    const serviceIds = resolveServiceIds(selectedIds, getOrCreateServiceForEntry);
    enableServices(serviceIds);
    setPresetServiceIds(serviceIds);
    setShowSaveModal(true);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Service library</div>
          <div className="page-subtitle">Preset catalog — FR-1, FR-2 SRS</div>
        </div>
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
            <button className="btn btn--sm" onClick={handleAddToPreset}>
              <Plus size={12} />
              Add to preset
            </button>
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
        onSelectAllToggle={handleSelectAllToggle}
        onSettingsClick={(item) => openServiceDetail(resolveDisplayItemServiceId(item, getOrCreateServiceForEntry))}
        emptyTitle="No custom services yet"
        emptyText='Use "Create service manually" to add your own service to the library.'
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
      {showSaveModal && (
        <SavePresetModal
          serviceIds={presetServiceIds}
          onClose={() => {
            setShowSaveModal(false);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}
