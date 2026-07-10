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

export function CreatePresetModal({ onClose }: { onClose: () => void }) {
  const library = useStore((s) => s.library);
  const presets = useStore((s) => s.presets);
  const getOrCreateServiceForEntry = useStore((s) => s.getOrCreateServiceForEntry);
  const createPreset = useStore((s) => s.createPreset);
  const openServiceDetail = useStore((s) => s.openServiceDetail);

  const [name, setName] = useState('');
  const [tab, setTab] = useState<LibraryTab>('all');
  const [error, setError] = useState<string | null>(null);
  const { selectedIds, toggleSelected, handleSelectAllToggle } = useServiceSelection();

  const catalogItems = buildCatalogDisplayItems();
  const customItems = buildCustomDisplayItems(library);
  const visibleItems = filterItemsByTab(tab, catalogItems, customItems);

  function handleToggle(id: string) {
    setError(null);
    toggleSelected(id);
  }

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a preset name.');
      return;
    }
    if (presets.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A preset with this name already exists.');
      return;
    }
    if (selectedIds.size === 0) {
      setError('Select at least one service.');
      return;
    }
    const serviceIds = resolveServiceIds(selectedIds, getOrCreateServiceForEntry);
    createPreset(trimmed, serviceIds);
    onClose();
  }

  return (
    <Modal
      title="Create preset"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Create
          </button>
        </>
      }
    >
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="e.g. Gaming"
          autoFocus
        />
      </div>

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
        emptyTitle="No custom services yet"
        emptyText="Create one from the Library screen first."
      />

      {error && (
        <div className="warning-box" style={{ marginTop: 'var(--space-12)', borderColor: 'var(--err)', background: 'var(--err-dim)', color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </Modal>
  );
}
