import type { ReactNode } from 'react';
import clsx from 'clsx';
import { MapPin, Waypoints } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { SearchInput } from './SearchInput';
import { LIBRARY_TABS, type LibraryTab, type LibraryDisplayItem } from '../../lib/libraryItems';
import { useScrollFade } from '../../lib/useScrollFade';

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
  toolbarActions?: ReactNode;
  toolbarSubtitle?: string;
  // Step 3 of the onboarding tour dims the tabs/search row and subtitle
  // so "Auto-select popular" (passed in via toolbarActions, dimmed
  // per-button by the caller) stands out (Fixnet • Wip, node 1170:268348).
  dimToolbar?: boolean;
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
  toolbarActions,
  toolbarSubtitle,
  dimToolbar = false,
}: LibraryPickerGridProps) {
  const { ref: scrollRef, fadeTop, fadeBottom } = useScrollFade<HTMLDivElement>([visibleItems.length]);

  return (
    <>
      <div className={clsx('services-toolbar', { 'services-toolbar--dim': dimToolbar })}>
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

        <SearchInput
          className="services-search"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>

      {(toolbarActions || toolbarSubtitle) && (
        <div className="services-toolbar-row2">
          {toolbarActions && <div className="services-toolbar-row2__actions">{toolbarActions}</div>}
          {toolbarSubtitle && (
            <span
              className={clsx('services-toolbar-row2__subtitle', {
                'services-toolbar-row2__subtitle--dim': dimToolbar,
              })}
            >
              {toolbarSubtitle}
            </span>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className={clsx('services-grid-scroll', 'scroll-fade', {
          'scroll-fade--top': fadeTop,
          'scroll-fade--bottom': fadeBottom,
        })}
      >
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
                  { icon: Waypoints, label: item.modeLabel },
                ]}
                selected={selectedIds.has(item.id)}
                onClick={() => onToggle(item.id)}
                onSettingsClick={() => onSettingsClick(item)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
