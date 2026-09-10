# Fixnet — CLAUDE.md

## Project overview

Fixnet is a Windows desktop-app prototype (1200x800px fixed window) for per-app/per-service traffic routing — each service gets its own proxy region and connection settings, unlike a device-wide VPN. Built entirely as a Vite + React 19 + TypeScript clickable mock: no real backend, no real networking. All state lives in a single Zustand store (`src/store/useStore.ts`) driven by a mock simulation engine (`src/sim/engine.ts`) that uses `setTimeout`/`setInterval` to simulate connection events. UI language is English-only. The project was scoped and iterated in Russian conversation but all user-facing text is English.

---

## Design-task checklist (mandatory, self-initiated)

Run through this at the end of every task that touches visual/UI design — a new component, a restyle, bringing something to a Figma spec — and state the results in the reply without being asked first. This exists because skipping it once produced real, user-caught regressions: a CTA left at the wrong size after a "bring to spec" pass, and two other button families (HeroBanner, Settings) left with no hover states because the task's scope was silently narrowed to the one class named in the ticket.

1. **Inventory before implementing.** Before restyling a shared pattern (buttons, cards, inputs, chips, etc.), grep the whole codebase for every element that is visually the same kind of thing — not just the specific class or component named in the task. State what's in scope and what's explicitly being left out, before writing any CSS/JSX. Don't let scope narrow itself silently to "the one class I was told to touch."
2. **Screen × state completion table before reporting done.** Enumerate every screen/component touched — directly or transitively, since a shared class change ripples beyond the files edited — crossed with every relevant state (default/hover/active/disabled/selected/etc., both themes if the app is theme-aware). Mark each cell pass/fail from actual verification (computed styles via Playwright, or a screenshot) — never from memory or assumption that "it must have inherited the fix."
3. **Full-app screenshot pass, not just the files edited.** Before calling a design task done, screenshot every screen in the app in every theme — including ones not directly touched this task — since a shared-component change surfaces in places that don't share a file with the edit (a hero banner CTA or a settings action button reusing the same visual pattern under a completely different class name is exactly how the last regression slipped through).

---

## Stack

- **Runtime:** Node.js (ESM), TypeScript ~6.0.2
- **UI:** React 19.2.7, react-dom 19.2.7
- **Bundler:** Vite 8.1.1 (`@vitejs/plugin-react` 6.0.3)
- **State:** Zustand 5.0.14 (no persist middleware — all state is in-memory, reset on page reload)
- **Styling:** Single global stylesheet split across `src/index.css` (CSS custom properties / tokens) and `src/App.css` (all component classes). No CSS modules, no Tailwind, no styled-components.
- **Icons:** lucide-react 1.23.0 — always import individual named icons, never the barrel.
- **Brand icons:** simple-icons 16.25.0 — used via `src/lib/brandIcons.ts`; renders SVG paths for known service names (ChatGPT, Grok, Disney+ have no entry — use emoji fallback).
- **Class merging:** clsx 2.1.1
- **ID generation:** nanoid 5.1.16
- **Linter:** oxlint 1.71.0 (no eslint)
- **tsconfig strict flags:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`

---

## Project layout

```
Fixnet/
├── src/
│   ├── index.css              — CSS custom properties (design tokens), base reset, custom font-faces
│   ├── App.css                — All component-level CSS classes; both files form one design system
│   ├── main.tsx               — Entry point; mounts <App /> in StrictMode
│   ├── App.tsx                — Root: auth/crossfade/shell view state machine; theme application
│   ├── types/
│   │   └── index.ts           — Canonical entity types; single source of truth for all shapes
│   ├── store/
│   │   └── useStore.ts        — Zustand store: all state + all actions; no slices
│   ├── sim/
│   │   └── engine.ts          — Mock network event engine: timers, connection/degradation/bridge logic
│   ├── data/
│   │   ├── catalog.ts         — LIBRARY_CATALOG: 19 preset LibraryEntry items with emoji icons
│   │   ├── regions.ts         — REGIONS: 9 proxy server locations services route through
│   │   ├── worldRegions.ts    — WORLD_REGIONS: 12 broad user home-region options (onboarding only, not routing)
│   │   ├── notificationPool.ts — NOTIFICATION_POOL: random notification templates for debug trigger
│   │   └── factory.ts         — serviceFromLibraryEntry, serviceFromCustomInput, routeForService, defaultAppSettings, defaultUser, defaultNotifications
│   ├── lib/
│   │   ├── labels.ts          — CATEGORY_LABELS, TRANSPORT_TYPE_LABELS, CONNECTION_MODE_LABELS, formatLatency, formatNotificationTime, connectionModeChipLabel
│   │   ├── libraryItems.ts    — LibraryTab type, LIBRARY_TABS, LibraryDisplayItem, build/filter/resolve helpers
│   │   ├── brandIcons.ts      — getBrandIcon(name): maps service display names to simple-icons SVG data
│   │   ├── useResolvedTheme.ts — Hook: resolves 'system' theme via matchMedia
│   │   ├── useServiceSelection.ts — Hook: manages a Set<string> of selected service/catalog IDs
│   │   └── useScrollFade.ts   — Hook: detects top/bottom scroll overflow for fade gradient effect
│   └── components/
│       ├── auth/
│       │   └── AuthScreen.tsx          — 16-digit key entry (4 cells × 4 digits); theme toggle; shake on error, crossfade on success
│       ├── layout/
│       │   ├── WindowTitleBar.tsx      — Windows-style title bar (minimize/close mock buttons; minimize = show restore chip)
│       │   ├── Sidebar.tsx             — Nav (Home/Services/Settings), connection pulse indicator, notification bell, subscription/trial footer
│       │   └── NotificationPanel.tsx   — Overlay notification window (mark all read, delete all with undo)
│       ├── notifications/
│       │   ├── NoticeCard.tsx          — Shared card for both toast and panel notification items
│       │   ├── NotificationToastStack.tsx — Top-right toast stack: peek (1 visible) or expanded list
│       │   ├── NotificationUndoToast.tsx  — Bottom "X notifications deleted / Undo" strip
│       │   └── NotificationDebugTrigger.tsx — Invisible button to push a random notification (prototype QA only)
│       ├── dashboard/
│       │   ├── Dashboard.tsx           — State machine: welcome | region | library-empty+tour | running (RoutingDiagram) | stopped (HeroBanner)
│       │   ├── HeroBanner.tsx          — Two-card layout: "Service Routing" card (start/edit/select) + "Full Mode" card (UI placeholder, feature not implemented)
│       │   ├── RoutingDiagram.tsx      — SVG topology diagram: You → Region nodes → Service leaf nodes, with bezier edges and animated connecting dots
│       │   ├── ServiceDetailModal.tsx  — Per-service config modal: region, encryption, transport, DNS, connectionMode, includeSubdomains, network rules (advanced), start-this-service-only action
│       │   ├── ServiceSessionModal.tsx — Per-service monitoring modal: status badge, latency/stability stats, quality charts, bridge info, enable toggle
│       │   └── onboarding/
│       │       └── RegionStep.tsx      — Onboarding step 1/4: broad world-region picker (WORLD_REGIONS tiles)
│       ├── services/
│       │   ├── Services.tsx              — Full-screen Services page: LibraryPickerGrid + selected-services side panel with start/stop/reconnect actions; onboarding coachmarks
│       │   ├── CreateCustomServiceModal.tsx — Form: name, domains+includeSubdomains, exePath, ipRange
│       │   └── ManualServiceIntroModal.tsx  — Pre-form warning: recommends contacting support for public services
│       ├── settings/
│       │   └── Settings.tsx             — 4 tabs: General (autoLaunch, launchInTray, reconnectOnStartup, closeToTray, theme, language), Account (key display/copy/regenerate, subscription, logout), Connection (DNS primary+backups, default region, emergency bridge, backup bridges), Advanced (degradation chance, tick interval, showAdvancedSettings) behind toggle
│       └── common/
│           ├── ServiceCard.tsx          — Grid tile: brand icon + name + 2 chips (region, connection mode); check badge when selected; gear settings button. Used in Services and CreatePresetModal.
│           ├── LibraryPickerGrid.tsx    — Tab bar (All/Games/Social/AI/Entertainment/Other/Custom) + search + 4-column ServiceCard grid; reused in Services.tsx
│           ├── ServiceIcon.tsx          — Renders simple-icons SVG for known service names; emoji string fallback for unknown
│           ├── BrandLogo.tsx            — The "n" glyph square logo mark (used in Sidebar and AuthScreen)
│           ├── SearchInput.tsx          — Styled search input with magnifier icon
│           ├── OnboardingCoachmark.tsx  — Floating tip box: step indicator, skip/prev/next; overlaid on real screens during tour
│           ├── Dropdown.tsx             — Custom styled dropdown (used in Settings DNS selector)
│           ├── Toast.tsx                — Simple one-line transient message (store.toast field; auto-dismisses after 5s)
│           ├── Modal.tsx                — Wrapper: overlay + modal box in standard (440px) or lg (860px) size; sticky header/footer
│           ├── StatusBadge.tsx          — Colored dot + label for ServiceStatus values
│           ├── Toggle.tsx               — CSS toggle switch (on/off)
│           └── QualityChart.tsx         — SVG sparkline for qualityHistory (latencyMs or stability)
```

---

## Design token system

All tokens are CSS custom properties on `:root` (dark mode defaults) overridden by `:root[data-theme="light"]`. Toggled by writing `document.documentElement.dataset.theme` in `App.tsx`. `theme: 'system'` resolves via `useResolvedTheme` hook (`window.matchMedia`).

**Light theme is provisional** — no light Figma mockups exist yet; values are hand-derived from dark palette.

### Core semantic tokens

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `--bg-0` | `#141116` | `#f5f1f8` | Deepest background |
| `--bg-1` | `#272429` | `#ffffff` | Card / panel surface |
| `--bg-2` | `#302e32` | `#f8f5fa` | Input / secondary surface |
| `--bg-3` | `#353237` | `#ede6f2` | Toggle track / tertiary |
| `--border` | `#3a373b` | `#ddd0e6` | All borders |
| `--text-0` | `#ffffff` | `#1c1424` | Primary text |
| `--text-1` | `rgba(255,255,255,0.56)` | `rgba(28,20,36,0.62)` | Secondary text |
| `--text-2` | `rgba(255,255,255,0.24)` | `rgba(28,20,36,0.34)` | Muted / labels |
| `--accent` | `#5b2299` | `#5b2299` | Primary action, active state (purple) |
| `--accent-dim` | `#2e1745` | `#ece0f7` | Accent background tint |
| `--ok` | `#18b363` | `#16a34a` | Connected status |
| `--ok-dim` | `#152d23` | `#e1f7ea` | Connected background |
| `--warn` | `#f0db1a` | `#a6790a` | Degraded status |
| `--warn-dim` | `#4b4417` | `#fbf0d9` | Degraded background |
| `--err` | `#ff3838` | `#dc2626` | Error status |
| `--err-dim` | `#41181c` | `#fbe2e2` | Error background |
| `--info` | `#7d8ff0` | `#5768d6` | Connecting / bridge |
| `--radius` | `12px` | — | Standard border-radius |
| `--radius-sm` | `8px` | — | Small border-radius |
| `--radius-full` | `999px` | — | Pill shape |
| `--font` | `"ABC Favorit", "Segoe UI", …` | — | Body font stack (ABC Favorit loaded via @font-face) |
| `--font-display` | `"Panama", Georgia, serif` | — | Display / heading font |
| `--font-mono` | `"Cascadia Code", …` | — | Monospace |

### Additional token families (see `src/index.css`)

All are exact values from specific Figma nodes, not derived from the core tokens above:

| Family prefix | Purpose |
|---|---|
| `--frames-*` | Service cards on the Services screen (card bg, borders, text, badge) — theme-aware |
| `--auth-*` | Auth screen (its own dedicated color scheme) |
| `--notif-*` | Notification panel and notification icon tones |
| `--btn-*` | Button system (primary/secondary gradient, shadow, disabled) |
| `--hero-*` | Dashboard hero cards (blue and purple card variants) |
| `--onboard-*` | Onboarding region-tile radio ring and dot |
| `--space-*` | Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 68 px |

Invariant tokens (same in both themes, contrast against saturated surfaces): `--on-accent`, `--shadow-color-rgb`, `--overlay-rgb`, `--frames-bg-rgb`, `--window-bg`.

---

## Entities and types (`src/types/index.ts`)

### Service

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| name | string | |
| icon | string | Emoji character (fallback when no brand SVG) |
| category | `'ai' \| 'game' \| 'streaming' \| 'browser' \| 'messenger' \| 'other'` | |
| detectionMethod | `'domain' \| 'exe' \| 'game' \| 'manual'` | |
| domains | string[] | |
| includeSubdomains | boolean | Default false |
| exePath | string \| null | |
| ipRange | string \| null | Manual IP range rule |
| additionalRules | NetworkRule[] | |
| region | string | Region.id |
| enabled | boolean | |
| encryption | `'on' \| 'off'` | |
| transportType | `'udp' \| 'tcp' \| 'mixed'` | ⚠️ D-1: SRS says `'auto' \| 'tcp' \| 'udp' \| 'wireguard-like'` |
| dnsMode | `'default' \| 'custom'` | Per-service DNS |
| connectionMode | `'default' \| 'fast' \| 'stable' \| 'secure'` | ⚠️ D-2: Not in SRS |
| advancedSettings | Record\<string, unknown\> | Always `{}` in practice |
| isCustom | boolean | |
| status | `'inactive' \| 'connecting' \| 'connected' \| 'degraded' \| 'error'` | |
| addedFromLibrary | boolean | |

### Region

| Field | Type | Notes |
|---|---|---|
| id | string | e.g. `'sweden'`, `'moscow-gaming-node'` |
| displayName | string | |
| country | string | |
| serverLoad | number | 0–100, mock static value |
| recommendedFor | ServiceCategory[] | |

9 regions in `src/data/regions.ts`: sweden, germany-1, germany-2, netherlands, finland, moscow-gaming-node, usa-east, usa-west, japan.

### Route

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| serviceId | string | |
| regionId | string | |
| status | `'idle' \| 'active' \| 'degraded' \| 'unavailable'` | |
| latencyMs | number | Mock, updated each tick |
| stability | number | 0–100, mock |
| usesBridge | boolean | |

### Connection

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| routeId | string | |
| startedAt | number | Unix ms |
| endedAt | number \| null | Unix ms |
| qualityHistory | QualitySample[] | Max 40 samples (`MAX_QUALITY_SAMPLES`) |

`QualitySample`: `{ timestamp: number; latencyMs: number; stability: number }`

### Bridge

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| name | string | Always `Bridge-N` (sequential) |
| status | `'available' \| 'connecting' \| 'connected' \| 'failed'` | |
| triggeredBy | string \| null | **serviceId** ⚠️ D-3: SRS §3.8 says routeId |
| isAuto | boolean | |

### AppNotification

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| tone | `'neutral' \| 'positive' \| 'negative'` | Controls color scheme of card |
| icon | `'server' \| 'server-off' \| 'region' \| 'library' \| 'billing' \| 'chat'` | Maps to Lucide icon in NoticeCard |
| title | string | Short heading |
| message | string | Body text |
| createdAt | number | Unix ms |
| read | boolean | |
| toastDismissed | boolean | Tracks whether top-right toast was dismissed; independent of `read` |
| action | NotificationAction \| null | Single optional CTA |

`NotificationAction`: `{ label: string; actionType: 'reconnect' }` — only one action type exists.

⚠️ D-4: Entirely different schema from SRS §3.9 (which describes typed event notifications with `type`, `severity`, `relatedServiceId`, multiple `actions`).

Max 60 notifications (`MAX_NOTIFICATIONS`). Notifications are **not** emitted by the engine — they are pre-seeded static content (`defaultNotifications()` in factory.ts) plus a debug `pushRandomNotification` store action.

### User

| Field | Type | Notes |
|---|---|---|
| id | string | `'user-1'` hardcoded default |
| name | string | `'Alex'` default |
| email | string | |
| subscriptionStatus | `'active' \| 'expired' \| 'trial'` | Default: `'trial'` |
| subscriptionExpiresAt | number | Unix ms; default = now + 7 days |
| homeRegion | string \| null | User's broad world region; set during onboarding; no effect on routing ⚠️ D-5: was `country` |

### AppSettings

| Field | Type | Default | Notes |
|---|---|---|---|
| autoLaunch | boolean | true | Start with Windows |
| launchInTray | boolean | true | Minimize to tray on launch |
| reconnectOnStartup | boolean | true | Auto-reconnect saved services on start |
| closeToTray | boolean | false | Close button goes to tray |
| theme | `'light' \| 'dark' \| 'system'` | `'dark'` | |
| language | `'en' \| 'ru'` | `'en'` | UI does not retranslate in prototype |
| region | string | `REGIONS[0].id` | Default routing region for new services |
| dns | DnsSettings | `{ current: '1.1.1.1', backups: [''] }` | ⚠️ D-6: replaces SRS `dnsMode: 'system'\|'custom'` |
| showAdvancedSettings | boolean | false | Gates advanced UI in Settings |
| advancedNetwork | `{ degradationChance: number; tickIntervalMs: number; autoBridge: boolean }` | 12%, 4000ms, **true** | |

`DnsSettings`: `{ current: string; backups: string[] }` — stores actual DNS addresses, not a mode enum.

⚠️ D-6: SRS §3.10 describes `dnsMode: 'system'|'custom'` and `windowBehavior: 'tray'|'taskbar'`. Implementation replaces both with the above restructured fields.

### LibraryEntry

| Field | Type | Notes |
|---|---|---|
| id | string | Stable catalog ID (e.g. `'chatgpt'`, `'steam'`) |
| name | string | |
| icon | string | Emoji |
| category | ServiceCategory | |
| domains | string[] | |
| recommendedRegion | string | Region.id |
| recommendedConnectionMode | ConnectionMode | ⚠️ D-2: Not in SRS |
| description | string | |
| popular | boolean | Used for "Auto-select popular" action in Services |

### OnboardingStage

`'welcome' | 'region' | 'tour-home' | 'tour-services' | 'tour-selected'`

4-stage first-run flow. `null` means onboarding is finished or skipped. Login sets stage to `'welcome'`; each advance/skip/commit action moves it forward. ⚠️ D-7: Entirely different from SRS §6 flow 1 description.

### WorldRegion (from `src/data/worldRegions.ts`)

`{ id: string; name: string }` — 12 broad regions (North America, South America, etc.). Used only in onboarding `RegionStep`. Sets `User.homeRegion`. No effect on routing. Separate from REGIONS (proxy locations).

---

## Store (`src/store/useStore.ts`)

### State fields

| Field | Type | Initial value |
|---|---|---|
| isAuthenticated | boolean | false |
| onboardingStage | OnboardingStage \| null | null |
| hasSeenAutomaticTip | boolean | false |
| authKey | string | `'1111111111111111'` |
| user | User | defaultUser |
| appSettings | AppSettings | defaultAppSettings |
| library | Service[] | [] |
| routes | Record\<string, Route\> | {} |
| connections | Record\<string, Connection\> | {} |
| bridges | Bridge[] | [] |
| isRunning | boolean | false |
| lastSessionServiceIds | string[] | [] |
| activeTab | TabId | `'dashboard'` |
| activeServiceId | string \| null | null |
| toast | `{ id: string; message: string } \| null` | null |
| emergencyBridge | `{ code, addedAt, status: 'active'\|'failed' } \| null` | pre-set to a "failed" example bridge |
| backupBridges | `{ id, code, addedAt, status: 'connected'\|'disconnected' }[]` | [] |
| pendingServiceSelection | string[] \| null | null |
| notifications | AppNotification[] | `defaultNotifications()` (8 seed items) |
| notificationsOpen | boolean | false |
| notificationsUndo | `{ id, items, count } \| null` | null |

`TabId = 'dashboard' | 'services' | 'settings'` — ⚠️ D-8: SRS §7 lists Library and Presets; neither exists as a tab now.

### Key conventions

- `routes` and `connections` are both keyed by **serviceId**, not route.id or connection.id. One active route and one active connection per service at a time (⚠️ D-9).
- `library` is a flat array of all services. Catalog services: `addedFromLibrary === true && s.name === entry.name` — no field linking back to catalog entry ID.
- Engine is imported lazily via `import('../sim/engine')` inside store actions to avoid circular dependency.
- `pendingServiceSelection` is set by `editLastSession` to pre-seed the Services page selection with last-session display IDs; cleared by `clearPendingServiceSelection` on mount.
- `notificationsUndo` auto-expires after 5s (setTimeout in `deleteAllNotifications`).

### Actions by domain

**Service management**
- `addServiceFromLibrary(entryId)` — creates Service + Route; enabled=false
- `createCustomService(input)` — creates from `CustomServiceInput`; enabled=false; shows toast
- `removeService(serviceId)` — stops in engine; removes from library, routes, connections
- `updateService(serviceId, patch)` — partial update; syncs route.regionId if region changes
- `toggleServiceEnabled(serviceId)` — flips enabled; if isRunning, calls beginConnect or stopService
- `enableServices(serviceIds)` — enables multiple at once; if isRunning, begins connecting each
- `toggleCatalogSelection(entryId)` — Services card click: if service exists, toggle enabled; if not, create enabled=true
- `getOrCreateServiceForEntry(entryId)` — ensures disabled service exists for catalog entry; returns serviceId

**Run control**
- `startAll()` — sets isRunning=true, calls engine.startSimulation
- `stopAll()` — calls engine.stopSimulation, sets isRunning=false, saves lastSessionServiceIds
- `relaunchLastSession()` — re-enables services from lastSessionServiceIds that still exist, then startAll
- `startWithOnly(serviceIds)` — stops any running session first, enables only given services, calls startAll; used by "Start selected" and "Reconnect with changes" in Services, and "start this service only" in ServiceDetailModal

**Engine hooks** (called only by engine or store internally)
- `setServiceStatus(serviceId, status)` — updates service.status; creates Connection on 'connected', closes it on 'inactive'
- `setRouteStatus(serviceId, status, patch?)` — updates route fields; appends QualitySample to connection.qualityHistory when active/degraded
- `ensureBridge(serviceId, isAuto)` — finds or creates Bridge for a service
- `setBridgeStatus(bridgeId, status)`

**Notifications**
- `pushRandomNotification()` — pulls a random template from `notificationPool.ts`, pushes to notifications array; **prototype/debug only** — not called by engine
- `markNotificationRead(id)`, `markAllNotificationsRead()`
- `deleteAllNotifications()` — clears list, sets notificationsUndo (5s undo window)
- `undoDeleteAllNotifications()`
- `dismissToast(id)`, `dismissAllToasts()` — sets toastDismissed on notification(s)

**Settings / DNS**
- `updateAppSettings(patch)`, `resetAppSettings()`
- `updateDns(patch)` — updates dns.current
- `addBackupDns()`, `updateBackupDns(index, value)`, `removeBackupDns(index)` — manage dns.backups array

**Bridge management (Settings screen)**
- `addEmergencyBridge(code)` — sets emergencyBridge; shows toast
- `addBackupBridge(code)`, `removeBackupBridge(id)`

**Auth**
- `login(code)` — compares against authKey; on success: isAuthenticated=true, **onboardingStage='welcome'**; returns bool
- `logout()` — stops simulation if running, sets isAuthenticated=false
- `regenerateAuthKey()` — generates new 16-digit numeric string

**Onboarding** (welcome → region → tour-home → tour-services → tour-selected → null)
- `beginOnboardingRegionStep()` — stage: 'welcome' → 'region'
- `commitOnboardingRegion(regionId)` — saves homeRegion if non-null; stage → 'tour-home'
- `advanceOnboardingTour()` — advances through tour stages; 'tour-home' also sets activeTab='services'
- `retreatOnboardingTour()` — steps back; 'tour-services' also sets activeTab='dashboard'
- `skipOnboarding()` — stage → null
- `dismissAutomaticTip()` — sets hasSeenAutomaticTip=true

**UI**
- `setActiveTab(tab)`, `openServiceDetail(serviceId)`, `closeServiceDetail()`
- `showToast(message)` — sets toast, auto-clears after 5s
- `editLastSession()` — converts lastSessionServiceIds to display IDs, sets pendingServiceSelection, navigates to 'services' tab
- `clearPendingServiceSelection()`
- `toggleNotificationsPanel()`, `closeNotificationsPanel()`

---

## Simulation engine (`src/sim/engine.ts`)

### Timer maps

| Map | Key | Lifecycle |
|---|---|---|
| `connectTimers` | serviceId | Set by `beginConnect`; cleared on resolution or `stopService` |
| `recoveryTimers` | serviceId | Set by `scheduleAutoRetry` / `attemptRestoreMainRoute`; cleared on trigger or `stopService` |
| `tickInterval` | — (single interval) | Started by `restartTick`; cleared by `stopSimulation` |

### Exported functions

| Function | What it does |
|---|---|
| `beginConnect(serviceId)` | Sets status=connecting, then after 800–2000ms: 8% chance → error + scheduleAutoRetry; 92% → connected |
| `stopService(serviceId)` | Clears timers; sets inactive + idle route |
| `retryService(serviceId)` | Calls beginConnect if isRunning |
| `startSimulation()` | Calls beginConnect for all enabled services; restarts tick |
| `stopSimulation()` | Clears all timers; sets all services inactive |
| `restartTick()` | Restarts setInterval using appSettings.advancedNetwork.tickIntervalMs |
| `updateTickInterval()` | Calls restartTick only if tick is currently running |
| `connectBridgeFor(serviceId, isAuto)` | Creates bridge, sets connecting → after 1200–2200ms → connected + route active (usesBridge=true) |

### Tick behavior (every `tickIntervalMs`, default 4000ms)

For each enabled service:
- **connected:** jitter latency ±10ms, stability ±5/+3; if random < degradationChance → `degradeService`
- **degraded:** jitter latency +20/−5ms, stability ±8/+4; if random < degradationChance×0.5 → `loseRoute`; else if random > 0.55 → `recoverService`

### Internal flow: loseRoute → bridge

1. `loseRoute` → status=error, route=unavailable, call `attemptRestoreMainRoute`
2. `attemptRestoreMainRoute` waits 2500–4000ms: 35% chance → `beginConnect`; else if autoBridge → `connectBridgeFor(auto=true)`; else **no action** (no notification pushed)

### Notifications: engine does NOT emit them

The engine calls only: `setServiceStatus`, `setRouteStatus`, `ensureBridge`, `setBridgeStatus`. It does **not** call `pushRandomNotification` or any notification action. All notifications in the app are either pre-seeded static content (`defaultNotifications()`) or manually triggered via the `NotificationDebugTrigger` component. ⚠️ D-10: SRS FR-13 requires dynamic notifications on status changes.

---

## Component map

| Component | File | Owns local state? | Key store selectors | Notes |
|---|---|---|---|---|
| App | `src/App.tsx` | view, minimized | isAuthenticated, activeTab, notificationsOpen | View state machine: 'auth'/'crossfade'/'shell' |
| AuthScreen | `auth/AuthScreen.tsx` | cells[4], authState, shakeKey | login, theme | 4×4-digit cells; paste support; theme toggle; shake animation on error |
| WindowTitleBar | `layout/WindowTitleBar.tsx` | no | — | Minimize = sets minimized in App; shows restore chip |
| Sidebar | `layout/Sidebar.tsx` | no | activeTab, user, isRunning, library, notifications | Connection pulse ring; subscription footer; bell → toggleNotificationsPanel; no account popup |
| NotificationPanel | `layout/NotificationPanel.tsx` | no | notifications, multiple actions | Full overlay window: count, mark-all-read, delete-all |
| NoticeCard | `notifications/NoticeCard.tsx` | no | — | Shared card: tone/icon/title/message + optional action button; variant='toast'\|'window' |
| NotificationToastStack | `notifications/NotificationToastStack.tsx` | expanded | notifications, dismissToast, dismissAllToasts | Filters `!toastDismissed`; collapses into peek stack when >1 |
| NotificationUndoToast | `notifications/NotificationUndoToast.tsx` | no | notificationsUndo, undoDeleteAllNotifications | Shows only when notificationsUndo is non-null |
| NotificationDebugTrigger | `notifications/NotificationDebugTrigger.tsx` | no | pushRandomNotification | Invisible button; prototype QA only |
| Dashboard | `dashboard/Dashboard.tsx` | no | onboardingStage, library, isRunning, activeServiceId, lastSessionServiceIds | State machine renders: HeroBanner welcome → RegionStep → HeroBanner empty/stopped → RoutingDiagram |
| HeroBanner | `dashboard/HeroBanner.tsx` | no | — | Welcome intro mode OR service-routing mode (start/edit/select) + Full Mode card (no-op placeholder) |
| RoutingDiagram | `dashboard/RoutingDiagram.tsx` | no | library, routes, stopAll | SVG topology; computes layout; shown only while isRunning |
| ServiceDetailModal | `dashboard/ServiceDetailModal.tsx` | regionSearch, hasChanges, showCloseConfirm | service, showAdvancedSettings, multiple actions | Config modal: region, encryption, transport, connectionMode, DNS mode, includeSubdomains, ipRange, network rules; "Start this service only" button; close-with-changes confirm |
| ServiceSessionModal | `dashboard/ServiceSessionModal.tsx` | no | service, route, connection, bridges, toggleServiceEnabled | Monitoring modal: status, latency/stability stats, QualityChart, bridge info, enable toggle |
| RegionStep | `dashboard/onboarding/RegionStep.tsx` | homeRegion (local selection) | skipOnboarding, commitOnboardingRegion | Onboarding step 1/4: WORLD_REGIONS tile grid |
| OnboardingCoachmark | `common/OnboardingCoachmark.tsx` | no | — | Steps 2/4, 3/4, 4/4; overlaid on Home and Services screens |
| Services | `services/Services.tsx` | manualAddStep, tab, searchQuery, selectedIds | library, isRunning, multiple actions | Tab bar + search + 4-col grid + selected panel; "Auto-select popular"; onboarding coachmarks |
| CreateCustomServiceModal | `services/CreateCustomServiceModal.tsx` | form fields | createCustomService | Form: name, domains, includeSubdomains, exePath, ipRange |
| ManualServiceIntroModal | `services/ManualServiceIntroModal.tsx` | no | — | Pre-form advisory: recommends support contact for public services |
| Settings | `settings/Settings.tsx` | copied, pendingRegen | appSettings, authKey, user, multiple actions | 4 tabs: General / Account / Connection / Advanced |
| ServiceCard | `common/ServiceCard.tsx` | no | — | Grid tile; chips take LucideIcon + label; check badge when selected; gear button |
| LibraryPickerGrid | `common/LibraryPickerGrid.tsx` | no | — | Tab bar + SearchInput + scroll-fade grid; used by Services.tsx |
| ServiceIcon | `common/ServiceIcon.tsx` | no | — | Renders simple-icons SVG (by display name lookup); falls back to emoji string |
| BrandLogo | `common/BrandLogo.tsx` | no | — | "n" glyph square; used in Sidebar and AuthScreen |
| SearchInput | `common/SearchInput.tsx` | no | — | |
| Dropdown | `common/Dropdown.tsx` | open | — | Custom styled select; used for DNS in Settings |
| Toast | `common/Toast.tsx` | no | toast | Simple one-line toast (not a notification toast) |
| Modal | `common/Modal.tsx` | no | — | standard=440px, lg=860px; sticky header/footer |
| StatusBadge | `common/StatusBadge.tsx` | no | — | |
| Toggle | `common/Toggle.tsx` | no | — | |
| QualityChart | `common/QualityChart.tsx` | no | — | SVG sparkline for QualitySample[] |

---

## Key data distinctions

**REGIONS** (`src/data/regions.ts`) — the 9 proxy server locations that service traffic routes through. Every `Service.region` and `Route.regionId` references one of these IDs. This is routing infrastructure.

**WORLD_REGIONS** (`src/data/worldRegions.ts`) — 12 broad geographic regions representing the user's own approximate physical location. Used only in onboarding `RegionStep` to set `User.homeRegion`. Has no effect on routing. Shape: `{ id: string; name: string }`. Entirely separate from Region.

---

## Conventions

- **No TypeScript enums.** All union types use string literals. `erasableSyntaxOnly` enforces this.
- **No `any`.** `Record<string, unknown>` is used where needed (advancedSettings).
- **No class components.** All components are function components.
- **No inline styles for layout.** Inline `style` is only used for dynamic values (computed positions in RoutingDiagram, rare overrides). All structural layout is in App.css.
- **Import type for type-only imports.** `verbatimModuleSyntax` enforces this.
- **State mutations only through Zustand actions.** Never call `useStore.setState` from components.
- **IDs are nanoid strings.** All entities use `nanoid()` for ID generation. Dates are Unix millisecond numbers (`Date.now()`), never `Date` objects or ISO strings.
- **Lucide imports are individual named imports**, e.g. `import { Play, Plus } from 'lucide-react'`.
- **clsx for class merging** in components that need conditional classes.
- **Engine imported dynamically** inside store actions (`import('../sim/engine').then(...)`) to avoid circular dependency at module load time.
- **Window minimize** sets a React `minimized` state in App, showing a `.window-restore-chip` button — no Electron/OS integration.
- **Auth key** is a 16-digit numeric string stored in plain store state. Default is `'1111111111111111'`. No hashing, no real auth.
- **Onboarding** is a 4-stage tour (welcome / region / tour-home / tour-services / tour-selected) that sets `User.homeRegion` but does NOT automatically start services or create presets.
- **`LibraryDisplayItem`** is the view-model for Services/picker grids. Selected IDs in the grid can be either real service IDs (custom items) or catalog entry IDs (catalog items not yet materialized). `resolveServiceIds` and `displayIdsForServices` convert between the two forms.
- **ServiceDetailModal vs ServiceSessionModal**: Detail modal is for config (region, encryption, transport, etc.); Session modal is for monitoring (status, latency, quality charts). Only Detail modal is currently reachable from UI (RoutingDiagram, Services page settings gear).

---

## Known SRS divergences

| ID | SRS section | SRS says | Implementation does | Status |
|---|---|---|---|---|
| D-1 | §3.2 Service.transportType | `'auto' \| 'tcp' \| 'udp' \| 'wireguard-like'` | `'udp' \| 'tcp' \| 'mixed'` — 'auto' replaced by 'mixed', 'wireguard-like' dropped | Intentional redesign |
| D-2 | §3.2 Service / §LibraryEntry | No `connectionMode` field | Added `connectionMode: 'default' \| 'fast' \| 'stable' \| 'secure'` on both Service and LibraryEntry | New field beyond spec |
| D-3 | §3.8 Bridge.triggeredBy | `routeId` | Stores **serviceId** — engine looks up bridges by serviceId | Intentional — engine works per-service |
| D-4 | §3.9 Notification | `type: route_unavailable \| server_overload \| quality_degraded \| ...`, `severity`, `relatedServiceId`, multiple `actions` | Completely different schema: `tone`, `icon`, `title`, `toastDismissed`, single `action: { actionType: 'reconnect' }` | Intentional redesign — content/editorial model not event model |
| D-5 | §3.1 User | `country: string \| null` (per old implementation) | `homeRegion: string \| null` — stores a WORLD_REGIONS id (broad region), not a country name | Intentional redesign |
| D-6 | §3.10 AppSettings | `dnsMode: 'system'\|'custom'`, `windowBehavior: 'tray'\|'taskbar'`, `updateMode`, `connectionDefaults` | `dns: DnsSettings` (actual DNS addresses + backups), `launchInTray`, `reconnectOnStartup`, `closeToTray` — mode enums replaced by concrete settings | Intentional redesign |
| D-7 | §3.7 Preset / §5.7 / §6 flows 6–7 | Full Preset system: save config, apply preset, named preset list | **Presets feature entirely removed** — no Preset entity, no preset state, no preset UI | Intentional descoping |
| D-8 | §3.1 User | serviceLibrary, presets, appSettings, bridges as User fields | All live as top-level store fields, not nested under user | Architectural simplification |
| D-9 | §3.5 Route | store keyed by route.id implied | `routes` and `connections` keyed by **serviceId**; one route per service by design | Intentional simplification |
| D-10 | §5.5 FR-13 / FR-14 | "When route status changes to degraded/unavailable/error, a Notification is created"; notifications have actionable types | Engine does **not** emit notifications. All notifications are pre-seeded static content or debug-triggered random templates. | Not yet implemented — engine-driven live notifications are missing |
| D-11 | §3.8 Bridge.name | "Name/type of bridge" (open-ended) | Always `Bridge-N` sequential counter | Intentional simplification |
| D-12 | §5.3 FR-7 | `inactive → connecting → connected` | 8% chance of `connecting → error`; auto-retry scheduled (4–8s) | Intentional — adds realism |
| D-13 | §5.1 FR-4 | "Added service defaults to inactive until app launched" | Catalog-toggle from Services screen creates service with enabled=true and auto-connects if isRunning | Intentional UX improvement |
| D-14 | §6 flow 1 | "First launch → auth → empty library → onboarding with add-services proposal" | Onboarding is a 4-stage guided tour: welcome splash → broad region picker → coachmark on Home → coachmark on Services → coachmark on selected panel; no service-picker step | Intentional redesign — richer flow |
| D-15 | §7 UI: sidebar | Dashboard, Library, Presets, Settings | Home (dashboard), **Services**, Settings — Library and Presets tabs removed | Intentional redesign |
| D-16 | §7 UI: Dashboard | "List of added services with live statuses + general summary + Start/Stop button" | When stopped: HeroBanner with "Service Routing" + "Full Mode" cards. When running: RoutingDiagram SVG topology. No service list or stat cards on home. | Intentional redesign |
| D-17 | §7 UI: Full Mode card | Not mentioned in SRS | HeroBanner shows a "Full Mode" card (route all traffic through single connection). Marked in code as out of scope for this prototype pass — button has no onClick handler. | Partial/placeholder — feature not modeled in store |
