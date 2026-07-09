import { MapPin, Waypoints, ListChecks } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { LIBRARY_TABS, type LibraryTab, type LibraryDisplayItem } from '../../lib/libraryItems';

interface LibraryPickerGridProps {
  tab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  visibleItems: LibraryDisplayItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAllToggle: (ids: string[], selectAll: boolean) => void;
  onSettingsClick: (item: LibraryDisplayItem) => void;
  emptyTitle: string;
  emptyText: string;
}

export function LibraryPickerGrid({
  tab,
  onTabChange,
  visibleItems,
  selectedIds,
  onToggle,
  onSelectAllToggle,
  onSettingsClick,
  emptyTitle,
  emptyText,
}: LibraryPickerGridProps) {
  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((i) => selectedIds.has(i.id));
  const visibleIds = visibleItems.map((i) => i.id);
  const showSelectAll = visibleItems.length > 2;

  function handleSelectAllClick() {
    onSelectAllToggle(visibleIds, !allVisibleSelected);
  }

  return (
    <>
      <div className="segmented library-tabs">
        {LIBRARY_TABS.map((t) => (
          <button
            key={t.id}
            className={`segmented__option ${tab === t.id ? 'segmented__option--active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{emptyTitle}</div>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="service-card-grid">
          {showSelectAll && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleSelectAllClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectAllClick();
                }
              }}
              className={`service-card service-card--select-all ${allVisibleSelected ? 'service-card--selected' : ''}`}
            >
              <div className="service-card__header">
                <div className="service-card__icon-swatch">
                  <ListChecks size={16} />
                </div>
                <span className="service-card__name">Select all</span>
              </div>
            </div>
          )}

          {visibleItems.map((item) => (
            <ServiceCard
              key={item.id}
              icon={item.icon}
              name={item.name}
              chips={[
                { icon: MapPin, label: item.regionLabel },
                { icon: Waypoints, label: item.transportLabel },
              ]}
              selected={selectedIds.has(item.id)}
              onClick={() => onToggle(item.id)}
              onSettingsClick={() => onSettingsClick(item)}
            />
          ))}
        </div>
      )}
    </>
  );
}
