import {
  siYoutube,
  siDiscord,
  siTelegram,
  siSteam,
  siValorant,
  siNetflix,
  siSpotify,
  siGooglechrome,
  siPerplexity,
  siGooglegemini,
  siWhatsapp,
  siSignal,
  siEpicgames,
  siRiotgames,
  siTwitch,
  siClaude,
} from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';

// Keyed by the catalog entry's display name (LIBRARY_CATALOG[].name in
// src/data/catalog.ts). ChatGPT, Grok, and Disney+ have no mark in
// simple-icons — those keep their emoji fallback.
const BRAND_ICONS_BY_NAME: Record<string, SimpleIcon> = {
  youtube: siYoutube,
  discord: siDiscord,
  telegram: siTelegram,
  steam: siSteam,
  valorant: siValorant,
  netflix: siNetflix,
  spotify: siSpotify,
  'chrome (browser)': siGooglechrome,
  perplexity: siPerplexity,
  gemini: siGooglegemini,
  whatsapp: siWhatsapp,
  signal: siSignal,
  'epic games': siEpicgames,
  'riot games': siRiotgames,
  twitch: siTwitch,
  claude: siClaude,
};

export function getBrandIcon(serviceName: string): SimpleIcon | undefined {
  return BRAND_ICONS_BY_NAME[serviceName.trim().toLowerCase()];
}
