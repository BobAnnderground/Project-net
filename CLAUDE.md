# Fixnet — CLAUDE.md

## Project overview

Fixnet is a Windows desktop-app prototype (1200x800px fixed window) for per-app/per-service traffic routing — each service gets its own proxy region and connection settings, unlike a device-wide VPN. Built entirely as a Vite + React 19 + TypeScript clickable mock: no real backend, no real networking. All state lives in a single Zustand store (`src/store/useStore.ts`) driven by a mock simulation engine (`src/sim/engine.ts`) that uses `setTimeout`/`setInterval` to simulate connection events. UI language is English-only. The project was scoped and iterated in Russian conversation but all user-facing text is English.

---

## Stack

- **Runtime:** Node.js (ESM), TypeScript ~6.0.2
- **UI:** React 19.2.7, react-dom 19.2.7
- **Bundler:** Vite 8.1.1 (`@vitejs/plugin-react` 6.0.3)
- **State:** Zustand 5.0.14 (no persist middleware — all state is in-memory, reset on page reload)
- **Styling:** Single global stylesheet split across `src/index.css` (CSS custom properties / tokens) and `src/App.css` (all component classes). No CSS modules, no Tailwind, no styled-components.
- **Icons:** lucide-react 1.23.0 — always import individual named icons, never the barrel.
- **Class merging:** clsx 2.1.1
- **ID generation:** nanoid 5.1.16
- **Linter:** oxlint (no eslint)
- **tsconfig strict flags:** `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`

---

## Project layout

```
Fixnet/
├── src/
│   ├── index.css              — CSS custom properties (design tokens), base reset, scrollbar
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
│   │   ├── worldCountries.ts  — WORLD_COUNTRIES: large list of user's own physical countries (onboarding only, not routing)
│   │   └── factory.ts         — serviceFromLibraryEntry, serviceFromCustomInput, routeForService, defaultAppSettings, defaultUser
│   ├── lib/
│   │   ├── labels.ts          — CATEGORY_LABELS, formatLatency
│   │   └── libraryItems.ts    — LibraryTab type, LIBRARY_TABS, LibraryDisplayItem, build/filter helpers
│   └── components/
│       ├── auth/
│       │   └── AuthScreen.tsx          — 16-digit key entry (4 cells × 4 digits); shake on error, crossfade on success
│       ├── layout/
│       │   ├── WindowTitleBar.tsx      — Windows-style title bar (minimize/close mock buttons; minimize = hide to chip)
│       │   ├── Sidebar.tsx             — Nav (Dashboard/Library/Presets/Settings), bell+notification panel, account popup with logout
│       │   └── NotificationCenter.tsx  — Dropdown notification list with per-item action buttons
│       ├── dashboard/
│       │   ├── Dashboard.tsx           — Conditional: onboarding | empty-state | stopped (last-session + preset quick-launch cards) | running (RoutingDiagram)
│       │   ├── WelcomeOnboarding.tsx   — 2-step wizard: step 1 = service picker (catalog tiles), step 2 = home country picker (WORLD_COUNTRIES)
│       │   ├── RoutingDiagram.tsx      — SVG topology diagram: You → Region nodes → Service leaf nodes, with bezier edges and animated connecting dots
│       │   └── ServiceDetailModal.tsx  — Per-service modal: status, latency/stability stats, quality charts, region/encryption/transport/DNS controls, network rules editor (advanced), remove button
│       ├── library/
│       │   ├── Library.tsx              — Catalog grid with All/Games/Programs/Custom tabs; multi-select with bulk "Add to preset"/"Start" action bar; "Create service manually" button
│       │   └── CreateCustomServiceModal.tsx — Form to create a custom service (name, category, detection method, domains/exePath, region)
│       ├── presets/
│       │   ├── Presets.tsx              — Expandable preset cards with inline service grid; apply (with confirm step), delete, expand to see/remove services and add new ones
│       │   ├── CreatePresetModal.tsx    — Full-size modal (860px) with embedded LibraryPickerGrid to name preset and pick services
│       │   ├── AddServiceModal.tsx      — Same full-size picker, pre-filtered to exclude already-included services; adds to existing preset
│       │   └── SavePresetModal.tsx      — Simple name-entry modal used from Library's "Add to preset" bulk action
│       ├── settings/
│       │   └── Settings.tsx             — General (theme, language, window behavior, auto-launch, update mode), Account (auth key display/copy/regenerate, subscription, logout), Connection (DNS, transport defaults, region, encryption, IPv6, auto-bridge), Advanced simulation parameters (degradation chance, tick interval) behind showAdvancedSettings toggle
│       └── common/
│           ├── ServiceCard.tsx          — Unified 108px tile: icon swatch + name + 2 info chips; optional check badge (selected), settings gear button, optional remove (X) button. Used in onboarding, library, presets, preset picker modals.
│           ├── LibraryPickerGrid.tsx    — Segmented tab bar + 4-column ServiceCard grid with "Select all" tile; reused in Library, CreatePresetModal, AddServiceModal
│           ├── Modal.tsx                — Wrapper: overlay + modal box in standard (440px) or lg (860px) size; sticky header/footer
│           ├── StatusBadge.tsx          — Colored dot + label for ServiceStatus values
│           ├── Toggle.tsx               — CSS toggle switch (on/off)
│           └── QualityChart.tsx         — SVG sparkline for qualityHistory (latencyMs or stability)
```

---

## Design token system

All tokens are CSS custom properties on `:root` (dark mode defaults) overridden by `:root[data-theme="light"]`. Toggled by writing `document.documentElement.dataset.theme` in `App.tsx`. `theme: 'system'` resolves via `window.matchMedia('(prefers-color-scheme: light)')`.

| Token | Dark | Light | Meaning |
|---|---|---|---|
| `--bg-0` | `#0d1117` | `#eef1f5` | Deepest background |
| `--bg-1` | `#131a22` | `#ffffff` | Card / panel surface |
| `--bg-2` | `#1a232d` | `#f5f7fa` | Input / secondary surface |
| `--bg-3` | `#212c38` | `#e9edf2` | Toggle track / tertiary |
| `--border` | `#2a3644` | `#d7dde4` | All borders |
| `--text-0` | `#eef2f6` | `#16202a` | Primary text |
| `--text-1` | `#a9b7c6` | `#4d5b68` | Secondary text |
| `--text-2` | `#6b7a89` | `#8894a0` | Muted / labels |
| `--accent` | `#3ea6ff` | `#1c7ed6` | Primary action, active state |
| `--accent-dim` | `#1f4864` | `#dceafb` | Accent background tint |
| `--ok` | `#35c975` | `#1f9d55` | Connected status |
| `--ok-dim` | `#133a24` | `#e3f7ea` | Connected background |
| `--warn` | `#f0a83a` | `#c9791a` | Degraded status |
| `--warn-dim` | `#4a3413` | `#fbeed9` | Degraded background |
| `--err` | `#f2495c` | `#d9273c` | Error status |
| `--err-dim` | `#4a1a20` | `#fbe1e4` | Error background |
| `--info` | `#7d8ff0` | `#5768d6` | Bridge/connecting |
| `--radius` | `10px` | — | Standard border-radius |
| `--radius-sm` | `6px` | — | Small border-radius |
| `--font` | `"Segoe UI", -apple-system, …` | — | Body font stack |

No `--info-dim` token exists; bridge info boxes use `rgba(125,143,240,0.1)` inline.

---

## Entities and types (`src/types/index.ts`)

### Service

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| name | string | |
| icon | string | Emoji character |
| category | `'ai' \| 'game' \| 'streaming' \| 'browser' \| 'messenger' \| 'other'` | |
| detectionMethod | `'domain' \| 'exe' \| 'game' \| 'manual'` | |
| domains | string[] | |
| exePath | string \| null | |
| additionalRules | NetworkRule[] | |
| region | string | Region.id |
| enabled | boolean | |
| encryption | `'on' \| 'off'` | |
| transportType | `'auto' \| 'tcp' \| 'udp' \| 'wireguard-like'` | |
| dnsMode | `'default' \| 'custom'` | Per-service DNS; distinct from AppSettings.dnsMode |
| advancedSettings | Record\<string, unknown\> | Always `{}` in practice; no UI writes to it |
| isCustom | boolean | true = user-created, not from catalog |
| status | `'inactive' \| 'connecting' \| 'connected' \| 'degraded' \| 'error'` | |
| addedFromLibrary | boolean | Used to disambiguate catalog vs custom services |

### Region

| Field | Type | Notes |
|---|---|---|
| id | string | e.g. `'sweden'`, `'moscow-gaming-node'` |
| displayName | string | |
| country | string | |
| serverLoad | number | 0–100, mock static value |
| recommendedFor | ServiceCategory[] | |

9 regions defined in `src/data/regions.ts`: sweden, germany-1, germany-2, netherlands, finland, moscow-gaming-node, usa-east, usa-west, japan.

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

QualitySample: `{ timestamp: number; latencyMs: number; stability: number }`

### ServiceConfigSnapshot (inside Preset)

| Field | Type | Notes |
|---|---|---|
| serviceId | string | |
| region | string | |
| enabled | boolean | |
| encryption | Encryption | |
| transportType | TransportType | |

⚠️ D-3: Snapshot omits `dnsMode`, `additionalRules`, `advancedSettings` vs. SRS §3.7 implication.

### Preset

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| name | string | |
| serviceConfigs | ServiceConfigSnapshot[] | |
| isActive | boolean | At most one preset has `isActive: true` at a time |
| createdAt | number | Unix ms |

### Bridge

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| name | string | `Bridge-N` where N = bridges.length + 1 at creation time |
| status | `'available' \| 'connecting' \| 'connected' \| 'failed'` | |
| triggeredBy | string \| null | serviceId (⚠️ D-6: SRS §3.8 says routeId) |
| isAuto | boolean | |

### AppNotification

| Field | Type | Notes |
|---|---|---|
| id | string | nanoid |
| type | `'route_unavailable' \| 'server_overload' \| 'quality_degraded' \| 'service_unresponsive' \| 'bridge_suggested' \| 'bridge_connected' \| 'subscription_expiring'` | |
| relatedServiceId | string \| null | |
| severity | `'info' \| 'warning' \| 'critical'` | |
| message | string | |
| createdAt | number | Unix ms |
| read | boolean | |
| actions | NotificationAction[] | |

NotificationAction: `{ label: string; actionType: 'switch_route' \| 'connect_bridge' \| 'go_to_service' \| 'dismiss' }`

Max 60 notifications stored (`MAX_NOTIFICATIONS`). ⚠️ D-4: `subscription_expiring` is defined but never emitted by the engine.

### User

| Field | Type | Notes |
|---|---|---|
| id | string | `'user-1'` hardcoded default |
| name | string | `'Alex'` default |
| email | string | |
| subscriptionStatus | `'active' \| 'expired' \| 'trial'` | Default: `'trial'` |
| subscriptionExpiresAt | number | Unix ms; default = now + 7 days |
| country | string \| null | User's physical location; set during onboarding step 2; no effect on routing |

### AppSettings

| Field | Type | Notes |
|---|---|---|
| autoLaunch | boolean | Default: false |
| theme | `'light' \| 'dark' \| 'system'` | Default: `'dark'` |
| dnsMode | `'system' \| 'custom'` | App-level DNS; ⚠️ D-1: different union from Service.dnsMode |
| windowBehavior | `'tray' \| 'taskbar'` | Default: `'tray'` |
| language | `'en' \| 'ru'` | Default: `'en'`; UI does not actually retranslate in prototype |
| updateMode | `'automatic' \| 'manual'` | Default: `'automatic'` |
| connectionDefaults | `{ transportType, region, encryption, ipv6: boolean }` | Applied to new services; not retroactive |
| showAdvancedSettings | boolean | Default: false; gates advanced UI sections globally |
| advancedNetwork | `{ degradationChance: number; tickIntervalMs: number; autoBridge: boolean }` | Defaults: 12%, 4000ms, false |

### LibraryEntry

| Field | Type | Notes |
|---|---|---|
| id | string | Stable catalog ID (e.g. `'chatgpt'`, `'steam'`) |
| name | string | |
| icon | string | Emoji |
| category | ServiceCategory | |
| domains | string[] | |
| recommendedRegion | string | Region.id |
| description | string | |
| popular | boolean | Controls onboarding initial visibility |

---

## Store (`src/store/useStore.ts`)

### State fields

| Field | Type | Initial value |
|---|---|---|
| isAuthenticated | boolean | false |
| isFirstLoginOfSession | boolean | false |
| authKey | string | `'1111111111111111'` |
| user | User | defaultUser |
| appSettings | AppSettings | defaultAppSettings |
| library | Service[] | [] |
| routes | Record\<string, Route\> | {} |
| connections | Record\<string, Connection\> | {} |
| bridges | Bridge[] | [] |
| presets | Preset[] | [] |
| notifications | AppNotification[] | [] |
| isRunning | boolean | false |
| lastSessionServiceIds | string[] | [] |
| activeTab | TabId | `'dashboard'` |
| activeServiceId | string \| null | null |

`TabId = 'dashboard' | 'library' | 'presets' | 'settings'`

### Key conventions

- `routes` and `connections` are both keyed by **serviceId**, not route.id or connection.id. One active route and one active connection per service at a time (⚠️ D-2).
- Any action that modifies the service list calls `clearPresetActivity(presets)` to set `isActive: false` on all presets (no stale "active" badge).
- `library` is a flat array of all services (both catalog-sourced and custom). Catalog services are found by `addedFromLibrary === true && s.name === entry.name` — there is no separate field linking a service back to its catalog entry ID.
- The engine is imported lazily via dynamic `import('../sim/engine')` inside store actions that need to trigger simulation side-effects, avoiding circular dependency issues at module load time.

### Actions by domain

**Service management**
- `addServiceFromLibrary(entryId)` — creates Service + Route from catalog entry; enabled=false
- `createCustomService(input)` — creates Service + Route from CustomServiceInput; enabled=false
- `removeService(serviceId)` — stops service in engine, removes from library, routes, connections
- `updateService(serviceId, patch)` — partial update; also syncs route.regionId when region changes
- `toggleServiceEnabled(serviceId)` — flips enabled; if isRunning, calls beginConnect or stopService
- `toggleCatalogSelection(entryId)` — Library card click: if service exists, toggle enabled; if not, create and enable
- `getOrCreateServiceForEntry(entryId)` — ensures a (disabled) service exists for a catalog entry; returns serviceId; used for "peek settings" before committing

**Run control**
- `startAll()` — sets isRunning=true, calls engine.startSimulation (connects all enabled services)
- `stopAll()` — calls engine.stopSimulation, sets isRunning=false, saves lastSessionServiceIds
- `relaunchLastSession()` — re-enables services from lastSessionServiceIds that still exist, then startAll

**Engine hooks** (called only by engine or store internally)
- `setServiceStatus(serviceId, status)` — updates service.status; creates Connection on 'connected', closes it on 'inactive'
- `setRouteStatus(serviceId, status, patch?)` — updates route fields; appends QualitySample to connection.qualityHistory when active/degraded
- `ensureBridge(serviceId, isAuto)` — finds or creates Bridge for a service
- `setBridgeStatus(bridgeId, status)`
- `pushNotification(n)` — prepends notification; trims to MAX_NOTIFICATIONS (60)
- `markNotificationRead(id)`, `markAllNotificationsRead()`
- `performNotificationAction(notificationId, actionType)` — marks read; dispatches to engine (connectBridgeFor, retryService) or sets activeTab/activeServiceId

**Presets**
- `createPreset(name, serviceIds)` — snapshots current configs of given serviceIds; marks new preset isActive=true
- `applyPreset(presetId)` — rewrites region/enabled/encryption/transportType for matching services; triggers connects/disconnects if isRunning
- `deletePreset(presetId)`
- `removeServiceFromPreset(presetId, serviceId)`
- `addServicesToPreset(presetId, serviceIds)` — adds only services not already in preset

**Settings**
- `updateAppSettings(patch)`, `updateAdvancedNetwork(patch)` (also calls engine.updateTickInterval), `updateConnectionDefaults(patch)`

**Auth**
- `login(code)` — compares against authKey; sets isAuthenticated=true, isFirstLoginOfSession=true; returns bool
- `logout()` — stops simulation if running, sets isAuthenticated=false
- `regenerateAuthKey()` — generates new 16-digit numeric string
- `commitOnboardingSelection(entryIds, userCountry)` — creates/enables services for selected catalog entries; saves 'Onboarding preset'; sets user.country; clears isFirstLoginOfSession; calls startAll
- `skipOnboarding()` — clears isFirstLoginOfSession only

**UI**
- `setActiveTab(tab)`, `openServiceDetail(serviceId)`, `closeServiceDetail()`

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
| `connectBridgeFor(serviceId, isAuto)` | Creates bridge, sets connecting, after 1200–2200ms → connected + route active (usesBridge=true) |

### Tick behavior (every `tickIntervalMs`, default 4000ms)

For each enabled service:
- **connected:** jitter latency ±10ms, stability ±5/+3; if random < degradationChance → `degradeService`
- **degraded:** jitter latency +20/−5ms, stability ±8/+4; if random < degradationChance×0.5 → `loseRoute`; else if random > 0.55 → `recoverService`

### Internal flow: loseRoute → bridge

1. `loseRoute` → status=error, route=unavailable, push `route_unavailable` notification, call `attemptRestoreMainRoute`
2. `attemptRestoreMainRoute` waits 2500–4000ms: 35% chance → `beginConnect`; else if autoBridge → `connectBridgeFor(auto=true)`; else push `bridge_suggested` notification

### Notification types actually emitted

| Type | Emitted by |
|---|---|
| `service_unresponsive` | `beginConnect` (8% failure path) |
| `server_overload` | `degradeService` (50% of degradations) |
| `quality_degraded` | `degradeService` (other 50%) |
| `route_unavailable` | `loseRoute` |
| `bridge_suggested` | `attemptRestoreMainRoute` (non-auto path) |
| `bridge_connected` | `connectBridgeFor` |
| `subscription_expiring` | **Never emitted** ⚠️ D-4 |

---

## Component map

| Component | File | Owns local state? | Key store selectors | Notes |
|---|---|---|---|---|
| App | `src/App.tsx` | view, minimized | isAuthenticated, activeTab, theme | View state machine: 'auth'/'crossfade'/'shell' |
| AuthScreen | `auth/AuthScreen.tsx` | cells[4], authState, shakeKey | login | 4×4-digit cells; paste support; shake animation on error |
| WindowTitleBar | `layout/WindowTitleBar.tsx` | no | — | Minimize = sets minimized in App; shows restore chip |
| Sidebar | `layout/Sidebar.tsx` | accountOpen | activeTab, user, notifications, isRunning | Bell badge; account popup; nav |
| NotificationCenter | `layout/NotificationCenter.tsx` | — | notifications, actions | Rendered inside Sidebar's bell area |
| Dashboard | `dashboard/Dashboard.tsx` | no | isFirstLoginOfSession, library, isRunning, presets, lastSessionServiceIds | Renders onboarding OR empty-state OR routing diagram OR quick-launch |
| WelcomeOnboarding | `dashboard/WelcomeOnboarding.tsx` | step, selectedIds, expandedCategories, homeCountry, countrySearch | commitOnboardingSelection, skipOnboarding, getOrCreateServiceForEntry | Step 1: service picker; step 2: country picker (WORLD_COUNTRIES) |
| RoutingDiagram | `dashboard/RoutingDiagram.tsx` | no | library, routes, stopAll | SVG topology; computes layout; shown only while isRunning |
| ServiceDetailModal | `dashboard/ServiceDetailModal.tsx` | no | service, route, connection, bridges, showAdvancedSettings, multiple actions | Full service config + quality charts; network rule editor behind advanced toggle |
| Library | `library/Library.tsx` | showCustomModal, showSaveModal, tab, selectedIds, presetServiceIds | library, many actions | Tabs: All/Games/Programs/Custom; bulk select bar |
| CreateCustomServiceModal | `library/CreateCustomServiceModal.tsx` | form fields | createCustomService | Warning box for manual detection method |
| Presets | `presets/Presets.tsx` | showCreateModal, pendingApplyId, expandedId, addServicePresetId | presets, library, multiple actions | Expandable cards; inline service cards with remove; apply confirm |
| CreatePresetModal | `presets/CreatePresetModal.tsx` | name, tab, selectedIds, error | library, getOrCreateServiceForEntry, createPreset | lg modal (860px); embedded LibraryPickerGrid |
| AddServiceModal | `presets/AddServiceModal.tsx` | tab, selectedIds, error | library, presets, addServicesToPreset | lg modal; pre-filters out already-included services |
| SavePresetModal | `presets/SavePresetModal.tsx` | name | createPreset | Simple name input; takes pre-resolved serviceIds from Library |
| Settings | `settings/Settings.tsx` | copied, pendingRegen | appSettings, authKey, user, multiple actions | 4 sections; advanced network simulation behind toggle |
| ServiceCard | `common/ServiceCard.tsx` | no | — | Reused in onboarding/library/presets/picker modals; optional remove button |
| LibraryPickerGrid | `common/LibraryPickerGrid.tsx` | no | — | Tab bar + 4-col grid + "Select all" tile; reused in Library, CreatePresetModal, AddServiceModal |
| Modal | `common/Modal.tsx` | no | — | standard=440px, lg=860px; sticky header/footer |
| StatusBadge | `common/StatusBadge.tsx` | no | — | |
| Toggle | `common/Toggle.tsx` | no | — | |
| QualityChart | `common/QualityChart.tsx` | no | — | SVG sparkline for QualitySample[] |

---

## Key data distinctions

**REGIONS** (`src/data/regions.ts`) — the 9 proxy server locations that service traffic routes through (Sweden, Germany #1/#2, Netherlands, Finland, Moscow Gaming Node, USA East/West, Japan). Every Service.region and Route.regionId references one of these IDs. This is routing infrastructure.

**WORLD_COUNTRIES** (`src/data/worldCountries.ts`) — a large searchable list of countries representing the user's own physical location. Used only in onboarding step 2 to set `User.country`. Has no effect on routing. The `WorldCountry` shape is `{ id, name, continent }` — entirely separate from `Region`.

---

## Conventions

- **No TypeScript enums.** All union types use string literals. `erasableSyntaxOnly` enforces this.
- **No `any`.** `Record<string, unknown>` is used where needed (advancedSettings).
- **No class components.** All components are function components.
- **No inline styles for layout.** Inline `style` is only used for dynamic values (colors from CSS vars, computed positions in RoutingDiagram, ad-hoc overrides). All structural layout is in App.css.
- **Import type for type-only imports.** `verbatimModuleSyntax` enforces this.
- **State mutations only through Zustand actions.** Never call `useStore.setState` from components.
- **IDs are nanoid strings.** All entities use `nanoid()` for ID generation. Dates are Unix millisecond numbers (`Date.now()`), never `Date` objects or ISO strings.
- **Lucide imports are individual named imports**, e.g. `import { Play, Plus } from 'lucide-react'`.
- **clsx for class merging** in components that need conditional classes.
- **Engine imported dynamically** inside store actions (`import('../sim/engine').then(...)`) to avoid circular dependency at module load time.
- **Window minimize** sets a React `minimized` state in App, showing a `.window-restore-chip` button instead of the full window — no Electron/OS integration.
- **Auth key** is a 16-digit numeric string stored in plain store state. Default is `'1111111111111111'`. No hashing, no real auth.
- **Onboarding** auto-saves selections as a preset named `'Onboarding preset'` (upserted on re-run) and immediately calls `startAll`.

---

## Known SRS divergences

| ID | SRS section | SRS says | Implementation does | Status |
|---|---|---|---|---|
| D-1 | §3.10 AppSettings.dnsMode | `'system' \| 'custom'` | Matches; but Service.dnsMode uses `'default' \| 'custom'` — same field name on different entities, different union literals | Intentional (different scope) |
| D-2 | §3.5 Route | One route per service as identifier; store keyed by route.id implied | `routes` and `connections` keyed by **serviceId**; one route per service by design | Intentional simplification |
| D-3 | §3.7 ServiceConfigSnapshot | `{serviceId, region, enabled, ...overrides}` implies full config | Snapshot omits `dnsMode`, `additionalRules`, `advancedSettings` | Intentional — partial snapshot |
| D-4 | §3.9 Notification type | `subscription_expiring` should be emitted when subscription nears expiry | Defined in types; never emitted by engine; no expiry check logic exists | Not yet implemented |
| D-5 | §3.8 Bridge.triggeredBy | Described as `routeId` | Implementation stores **serviceId** in `triggeredBy` | Intentional — engine looks up bridges by serviceId |
| D-6 | §3.8 Bridge.name | "Name/type of bridge" (open-ended) | Always `Bridge-N` sequential counter | Intentional simplification |
| D-7 | §5.3 FR-7 | `inactive → connecting → connected` | 8% chance of `connecting → error`; auto-retry scheduled | Intentional — adds realism |
| D-8 | §3.1 User | serviceLibrary, presets, appSettings, bridges as User fields | All live in top-level store fields, not nested under user | Architectural simplification |
| D-9 | §6 User flow 1 | First launch → mock auth → empty library → onboarding | Auth exists (16-digit key); onboarding is a 2-step wizard (service picker + country picker) that auto-starts services on finish; "empty library" state on home has a quick-link to Library | Implemented differently — richer than spec |
| D-10 | §7 UI: Dashboard | "List of added services with live statuses" + "general summary" + Start/Stop button | When running: replaced entirely by RoutingDiagram (topology SVG). When stopped: shows last-session quick-launch card + preset preview cards. No stat cards, no service list on home. | Intentional redesign |
| D-11 | §7 UI: structure | "Side navigation + content area" | Windows-style title bar (32px) + sidebar (220px) + content area; title bar is a separate grid row | Intentional |
| D-12 | §5.7 FR-17 | "Save current configuration as named preset" | Presets are created by picking services from a full picker modal (not by snapshotting current config). Library has bulk "Add to preset" action. "Onboarding preset" auto-created on first login. | Extended beyond spec |
| D-13 | §5.1 FR-4 | "Added service defaults to inactive until app launched" | Catalog-toggle from Library and onboarding set enabled=true immediately and auto-connect if isRunning | Intentional UX improvement |
