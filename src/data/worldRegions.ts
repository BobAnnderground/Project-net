export interface WorldRegion {
  id: string;
  name: string;
}

// Broad, general-purpose world regions the user can pick from to describe
// roughly where *they* are — deliberately coarser than a country or city, so
// nothing here narrows a user down to a specific place. Separate from
// REGIONS, which lists the proxy server locations traffic is actually
// routed through.
export const WORLD_REGIONS: WorldRegion[] = [
  { id: 'north-america', name: 'North America' },
  { id: 'south-america', name: 'South America' },
  { id: 'western-europe', name: 'Western Europe' },
  { id: 'eastern-europe', name: 'Eastern Europe' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'north-africa', name: 'North Africa' },
  { id: 'southern-africa', name: 'Southern Africa' },
  { id: 'central-asia', name: 'Central Asia' },
  { id: 'south-asia', name: 'South Asia' },
  { id: 'east-asia', name: 'East Asia' },
  { id: 'southeast-asia', name: 'Southeast Asia' },
  { id: 'oceania', name: 'Oceania' },
];
