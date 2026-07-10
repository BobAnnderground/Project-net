import { useState } from 'react';
import { Modal } from '../common/Modal';
import { LibraryPickerGrid } from '../common/LibraryPickerGrid';
import { useStore } from '../../store/useStore';
import { useServiceSelection } from '../../lib/useServiceSelection';
import {
  buildCatalogDisplayItems,
  buildCustomDisplayItems,
  filterItemsByTab,
  resolveServiceIds,
  resolveDisplayItemServiceId,
  type LibraryTab,
} from '../../lib/libraryItems';

export function AddServiceModal({ presetId, onClose }: { presetId: string; onClose: () => void }) {
  const library = useStore((s) => s.library);
  const presets = useStore((s) => s.presets);
  const getOrCreateServiceForEntry = useStore((s) => s.getOrCreateServiceForEntry);
  const addServicesToPreset = useStore((s) => s.addServicesToPreset);
  const openServiceDetail = useStore((s) => s.openServiceDetail);

  const [tab, setTab] = useState<LibraryTab>('all');
  const [error, setError] = useState<string | null>(null);
  const { selectedIds, toggleSelected, handleSelectAllToggle } = useServiceSelection();

  const preset = presets.find((p) => p.id === presetId);
  const includedServiceIds = new Set(preset?.serviceConfigs.map((c) => c.serviceId) ?? []);
  const includedNames = new Set(
    library.filter((s) => includedServiceIds.has(s.id)).map((s) => s.name)
  );

  const catalogItems = buildCatalogDisplayItems().filter((i) => !includedNames.has(i.name));
  const customItems = buildCustomDisplayItems(library).filter((i) => !includedServiceIds.has(i.id));
  const visibleItems = filterItemsByTab(tab, catalogItems, customItems);

  function handleToggle(id: string) {
    setError(null);
    toggleSelected(id);
  }

  function handleSubmit() {
    if (selectedIds.size === 0) {
      setError('Select at least one service.');
      return;
    }
    const serviceIds = resolveServiceIds(selectedIds, getOrCreateServiceForEntry);
    addServicesToPreset(presetId, serviceIds);
    onClose();
  }

  return (
    <Modal
      title="Add services"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Add
          </button>
        </>
      }
    >
      <div className="form-label" style={{ marginBottom: 'var(--space-8)' }}>
        Services{selectedIds.size > 0 ? ` — ${selectedIds.size} selected` : ''}
      </div>

      <LibraryPickerGrid
        tab={tab}
        onTabChange={setTab}
        visibleItems={visibleItems}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onSelectAllToggle={handleSelectAllToggle}
        onSettingsClick={(item) => openServiceDetail(resolveDisplayItemServiceId(item, getOrCreateServiceForEntry))}
        emptyTitle="Nothing left to add"
        emptyText="All matching services are already included in this preset."
      />

      {error && (
        <div className="warning-box" style={{ marginTop: 'var(--space-12)', borderColor: 'var(--err)', background: 'var(--err-dim)', color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
