import { LIBRARY_CATALOG, catalogById } from '../data/catalog';
import { REGIONS } from '../data/regions';
import { TRANSPORT_TYPE_CHIP_LABELS } from './labels';
import type { Service, ServiceCategory } from '../types';

export type LibraryTab = 'all' | 'games' | 'social' | 'ai' | 'entertainment' | 'other' | 'custom';

export const LIBRARY_TABS: { id: LibraryTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'games', label: 'Games' },
  { id: 'social', label: 'Social' },
  { id: 'ai', label: 'AI' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'other', label: 'Other' },
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
    case 'social':
      return catalogItems.filter((i) => i.category === 'messenger');
    case 'ai':
      return catalogItems.filter((i) => i.category === 'ai');
    case 'entertainment':
      return catalogItems.filter((i) => i.category === 'streaming');
    case 'other':
      return catalogItems.filter((i) => i.category === 'other' || i.category === 'browser');
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

// Inverse of resolveServiceIds: given real services, find the ids the picker
// grid actually selects against — the catalog entry id for catalog-sourced
// services (the grid keys those by entry id, not the materialized service
// id), or the service's own id for custom ones.
export function displayIdsForServices(services: Service[]): string[] {
  return services.map((service) => {
    if (!service.addedFromLibrary) return service.id;
    const entry = LIBRARY_CATALOG.find((e) => e.name === service.name);
    return entry ? entry.id : service.id;
  });
}
