import { LIBRARY_CATALOG, catalogById } from '../data/catalog';
import { REGIONS } from '../data/regions';
import { TRANSPORT_TYPE_CHIP_LABELS } from './labels';
import type { Service, ServiceCategory } from '../types';

export type LibraryTab = 'all' | 'games' | 'programs' | 'custom';

export const LIBRARY_TABS: { id: LibraryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'games', label: 'Games' },
  { id: 'programs', label: 'Programs' },
  { id: 'custom', label: 'Custom' },
];

export interface LibraryDisplayItem {
  id: string;
  icon: string;
  name: string;
  regionLabel: string;
  transportLabel: string;
  isCustom: boolean;
  category: ServiceCategory;
}

export function buildCatalogDisplayItems(): LibraryDisplayItem[] {
  return LIBRARY_CATALOG.map((entry) => {
    const region = REGIONS.find((r) => r.id === entry.recommendedRegion);
    return {
      id: entry.id,
      icon: entry.icon,
      name: entry.name,
      regionLabel: region?.displayName ?? entry.recommendedRegion,
      transportLabel: 'auto',
      isCustom: false,
      category: entry.category,
    };
  });
}

export function buildCustomDisplayItems(library: Service[]): LibraryDisplayItem[] {
  return library
    .filter((s) => s.isCustom)
    .map((s) => {
      const region = REGIONS.find((r) => r.id === s.region);
      return {
        id: s.id,
        icon: s.icon,
        name: s.name,
        regionLabel: region?.displayName ?? s.region,
        transportLabel: TRANSPORT_TYPE_CHIP_LABELS[s.transportType],
        isCustom: true,
        category: s.category,
      };
    });
}

export function filterItemsByTab(
  tab: LibraryTab,
  catalogItems: LibraryDisplayItem[],
  customItems: LibraryDisplayItem[]
): LibraryDisplayItem[] {
  switch (tab) {
    case 'all':
      return [...catalogItems, ...customItems];
    case 'games':
      return catalogItems.filter((i) => i.category === 'game');
    case 'programs':
      return catalogItems.filter((i) => i.category !== 'game');
    case 'custom':
      return customItems;
  }
}

// A selected id is either a real service id (custom items, or catalog items
// already added to the library) or a bare catalog entry id that hasn't been
// materialized into a library service yet — resolve every id to a real one.
export function resolveServiceIds(
  ids: Iterable<string>,
  getOrCreateServiceForEntry: (entryId: string) => string
): string[] {
  return Array.from(ids).map((id) => {
    const entry = catalogById(id);
    return entry ? getOrCreateServiceForEntry(id) : id;
  });
}

export function resolveDisplayItemServiceId(
  item: LibraryDisplayItem,
  getOrCreateServiceForEntry: (entryId: string) => string
): string {
  return item.isCustom ? item.id : getOrCreateServiceForEntry(item.id);
}
