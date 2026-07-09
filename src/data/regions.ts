import type { Region } from '../types';

export const REGIONS: Region[] = [
  { id: 'sweden', displayName: 'Sweden', country: 'Sweden', serverLoad: 34, recommendedFor: ['ai', 'browser'] },
  { id: 'germany-1', displayName: 'Germany #1', country: 'Germany', serverLoad: 58, recommendedFor: ['streaming', 'browser'] },
  { id: 'germany-2', displayName: 'Germany #2', country: 'Germany', serverLoad: 22, recommendedFor: ['ai', 'messenger'] },
  { id: 'netherlands', displayName: 'Netherlands', country: 'Netherlands', serverLoad: 46, recommendedFor: ['streaming', 'game'] },
  { id: 'finland', displayName: 'Finland', country: 'Finland', serverLoad: 15, recommendedFor: ['game', 'ai'] },
  { id: 'moscow-gaming-node', displayName: 'Moscow Gaming Node', country: 'Russia', serverLoad: 71, recommendedFor: ['game'] },
  { id: 'usa-east', displayName: 'USA East', country: 'United States', serverLoad: 63, recommendedFor: ['streaming', 'ai', 'other'] },
  { id: 'usa-west', displayName: 'USA West', country: 'United States', serverLoad: 39, recommendedFor: ['game', 'streaming'] },
  { id: 'japan', displayName: 'Japan', country: 'Japan', serverLoad: 28, recommendedFor: ['game', 'messenger'] },
];

export const regionById = (id: string): Region | undefined => REGIONS.find((r) => r.id === id);
