import { Search, MapPin, Waypoints } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { LIBRARY_TABS, type LibraryTab, type LibraryDisplayItem } from '../../lib/libraryItems';

interface LibraryPickerGridProps {
  tab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  visibleItems: LibraryDisplayItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSettingsClick: (item: LibraryDisplayItem) => void;
  emptyTitle: string;
  emptyText: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
}

export function LibraryPickerGrid({
  tab,
  onTabChange,
  visibleItems,
  selectedIds,
  onToggle,
  onSettingsClick,
  emptyTitle,
  emptyText,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: LibraryPickerGridProps) {
  return (
    <>
      <div className="services-toolbar">
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

        <div className="search-input-wrap services-search">
          <Search size={14} className="search-input-wrap__icon" />
          <input
            className="form-input search-input-wrap__input"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">{emptyTitle}</div>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="service-card-grid">
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
