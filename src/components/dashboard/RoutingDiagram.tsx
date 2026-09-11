import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Globe, Lock, Zap, Gauge, TriangleAlert, Square } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { REGIONS } from '../../data/regions';
import { connectionModeChipLabel, formatLatency } from '../../lib/labels';
import { ServiceSessionModal } from './ServiceSessionModal';
import { ServiceIcon } from '../common/ServiceIcon';
import type { ConnectionMode, Service, ServiceStatus } from '../../types';

// ── Constants ────────────────────────────────────────────────────────────────

const USER_SIZE = 60;
const CARD_WIDTH = 276;
const CARD_HEIGHT = 148;
const CARD_GAP = 12;
const MAX_VISIBLE_CARDS = 4;
const MAX_ROW_ICONS = 7;

// Entrance choreography timings (ms from mount) — see CLAUDE.md's Home
// screen work for the underlying design ref; steps per the "Главный экран /
// active-connection" reveal spec (Fixnet · Wip, nodes 1261:50077 → 1261:50829).
const PHASE_DELAYS: Record<IntroPhase, number> = {
  user: 0,
  skeleton: 300,
  lines: 650,
  shimmer: 950,
  content: 1700,
  colorize: 2300,
  done: 3000,
};

type IntroPhase = 'user' | 'skeleton' | 'lines' | 'shimmer' | 'content' | 'colorize' | 'done';

const PHASE_ORDER: IntroPhase[] = ['user', 'skeleton', 'lines', 'shimmer', 'content', 'colorize', 'done'];

/** Which phase a run that started `elapsed` ms ago should already be in —
 *  lets the intro resume at the right point after a remount instead of
 *  replaying from scratch (e.g. navigating away from Home and back). */
function phaseForElapsed(elapsed: number): IntroPhase {
  let phase: IntroPhase = 'user';
  for (const p of PHASE_ORDER) {
    if (elapsed >= PHASE_DELAYS[p]) phase = p;
  }
  return phase;
}

type DiagState = 'connected' | 'connecting' | 'degraded' | 'error';

const CONNECTION_MODE_ICON: Record<ConnectionMode, typeof Zap> = {
  fast: Zap,
  secure: Lock,
  stable: Gauge,
  default: Globe,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function serviceStatusToDiagState(status: ServiceStatus): DiagState {
  switch (status) {
    case 'connected': return 'connected';
    case 'degraded':  return 'degraded';
    case 'error':     return 'error';
    default:          return 'connecting';
  }
}

function aggregateRegionState(states: DiagState[]): DiagState {
  if (states.includes('error'))      return 'error';
  if (states.includes('degraded'))   return 'degraded';
  if (states.includes('connecting')) return 'connecting';
  return 'connected';
}

function stateLineColor(state: DiagState): string {
  switch (state) {
    case 'connected':  return 'var(--routing-line-connected)';
    case 'degraded':   return 'var(--routing-line-degraded)';
    case 'error':      return 'var(--routing-line-error)';
    case 'connecting': return 'var(--routing-line-main)';
  }
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = x1 + (x2 - x1) / 2;
  return `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
}

// ── Layout ───────────────────────────────────────────────────────────────────

interface RegionGroup {
  regionId: string;
  displayName: string;
  services: Service[];
}

function groupByRegion(services: Service[]): RegionGroup[] {
  const order: string[] = [];
  const map = new Map<string, Service[]>();
  for (const svc of services) {
    if (!map.has(svc.region)) {
      map.set(svc.region, []);
      order.push(svc.region);
    }
    map.get(svc.region)!.push(svc);
  }
  return order.map((regionId) => {
    const def = REGIONS.find((r) => r.id === regionId);
    return { regionId, displayName: def?.displayName ?? regionId, services: map.get(regionId) ?? [] };
  });
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  group: RegionGroup;
  top: number;
  left: number;
  routes: ReturnType<typeof useStore.getState>['routes'];
  introPhase: IntroPhase;
  onOpenService: (id: string) => void;
}

function Card({ group, top, left, routes, introPhase, onOpenService }: CardProps) {
  const states = group.services.map((s) => serviceStatusToDiagState(s.status));
  const state = aggregateRegionState(states);
  const primary = group.services[0];
  const Icon = CONNECTION_MODE_ICON[primary.connectionMode];
  const modeLabel = connectionModeChipLabel(primary.connectionMode, primary.category);

  const contentReady = introPhase === 'content' || introPhase === 'colorize' || introPhase === 'done';
  const colored = introPhase === 'colorize' || introPhase === 'done';

  const route = routes[primary.id];
  const showPing = colored && (state === 'connected' || state === 'degraded');
  const latencyMs = route?.latencyMs ?? 0;

  const visibleServices = group.services.slice(0, MAX_ROW_ICONS);
  const overflowCount = group.services.length - visibleServices.length;

  return (
    <div
      className="routing-card"
      data-state={colored ? state : 'pending'}
      style={{ position: 'absolute', top, left, width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      {/* Skeleton layer */}
      <div className="routing-card__skeleton" style={{ opacity: contentReady ? 0 : 1 }}>
        <span className="routing-card__skeleton-bar routing-card__skeleton-bar--title" />
        <span className="routing-card__skeleton-bar routing-card__skeleton-bar--sub" />
      </div>

      {/* Real content layer */}
      <div className="routing-card__body" style={{ opacity: contentReady ? 1 : 0 }}>
        <div className="routing-card__glow" />
        <div className="routing-card__header">
          <p className="routing-card__title">{group.displayName}</p>
          {colored && state === 'error' && <TriangleAlert size={16} className="routing-card__attention" />}
        </div>
        <div className="routing-card__row">
          <span className="routing-card__mode">
            <Icon size={16} className="routing-card__mode-icon" />
            {modeLabel}
          </span>
          <span className="routing-card__ping">{showPing ? formatLatency(latencyMs) : '— ms'}</span>
        </div>
        <div className="routing-card__divider" />
        <div className="routing-card__services">
          {visibleServices.map((svc) => (
            <button
              key={svc.id}
              type="button"
              className="routing-card__service-icon"
              title={svc.name}
              onClick={() => onOpenService(svc.id)}
            >
              <ServiceIcon name={svc.name} fallback={svc.icon} size={16} />
            </button>
          ))}
          {overflowCount > 0 && (
            <span className="routing-card__service-icon routing-card__service-icon--overflow">
              +{overflowCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function RoutingDiagram() {
  const library = useStore((s) => s.library);
  const routes = useStore((s) => s.routes);
  const stopAll = useStore((s) => s.stopAll);
  const routingStartedAt = useStore((s) => s.routingStartedAt);
  const [activeSessionServiceId, setActiveSessionServiceId] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<IntroPhase>(() =>
    phaseForElapsed(routingStartedAt ? Date.now() - routingStartedAt : 0)
  );
  const [sessionId] = useState(() => crypto.randomUUID().replace(/-/g, '').slice(0, 24));
  const [copied, setCopied] = useState(false);

  const schemeRef = useRef<HTMLDivElement>(null);
  const [schemeWidth, setSchemeWidth] = useState(0);
  const [schemeHeight, setSchemeHeight] = useState(0);

  useEffect(() => {
    const el = schemeRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setSchemeWidth(entries[0].contentRect.width);
      setSchemeHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const startedAt = routingStartedAt ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const timers = PHASE_ORDER.filter((phase) => PHASE_DELAYS[phase] > elapsed).map((phase) =>
      setTimeout(() => setIntroPhase(phase), PHASE_DELAYS[phase] - elapsed)
    );
    return () => timers.forEach(clearTimeout);
  }, [routingStartedAt]);

  const enabledServices = useMemo(() => library.filter((s) => s.enabled), [library]);
  const groups = useMemo(() => groupByRegion(enabledServices), [enabledServices]);

  const visibleGroups = groups.slice(0, MAX_VISIBLE_CARDS);
  const overflowGroups = groups.length - visibleGroups.length;

  const cardsTotalHeight =
    visibleGroups.length > 0 ? visibleGroups.length * CARD_HEIGHT + (visibleGroups.length - 1) * CARD_GAP : 0;
  const bandHeight = Math.max(schemeHeight, cardsTotalHeight, USER_SIZE);
  const cardsTop = (bandHeight - cardsTotalHeight) / 2;
  const userTop = bandHeight / 2 - USER_SIZE / 2;
  const cardsLeft = Math.max(schemeWidth - CARD_WIDTH, 0);

  const showLines = introPhase !== 'user' && introPhase !== 'skeleton';
  const showShimmer = introPhase === 'shimmer';
  const colored = introPhase === 'colorize' || introPhase === 'done';

  const totalServers = groups.length;
  const errorServers = groups.filter((g) => aggregateRegionState(g.services.map((s) => serviceStatusToDiagState(s.status))) === 'error').length;
  const totalServices = enabledServices.length;
  const errorServices = enabledServices.filter((s) => s.status === 'error').length;

  function handleCopySessionId() {
    navigator.clipboard.writeText(sessionId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="routing-diagram" data-intro-phase={introPhase}>
      <div className="routing-diagram__panel">
        <div className="routing-diagram__panel-row">
          <span className="routing-diagram__panel-label">Session ID</span>
          {introPhase === 'user' ? (
            <span className="routing-diagram__spinner" aria-label="Resolving session" />
          ) : (
            <button type="button" className="routing-diagram__session-id" onClick={handleCopySessionId}>
              {sessionId}
              <Copy size={14} />
            </button>
          )}
        </div>
        <div className="routing-diagram__panel-counts">
          <div className="routing-diagram__panel-row">
            <span className="routing-diagram__panel-label routing-diagram__panel-label--fixed">Servers</span>
            <span className="routing-diagram__count routing-diagram__count--green">
              <i /> {colored ? totalServers - errorServers : 0}
            </span>
            <span className="routing-diagram__count routing-diagram__count--red">
              <i /> {colored ? errorServers : 0}
            </span>
          </div>
          <div className="routing-diagram__panel-row">
            <span className="routing-diagram__panel-label routing-diagram__panel-label--fixed">Services</span>
            <span className="routing-diagram__count routing-diagram__count--green">
              <i /> {colored ? totalServices - errorServices : 0}
            </span>
            <span className="routing-diagram__count routing-diagram__count--red">
              <i /> {colored ? errorServices : 0}
            </span>
          </div>
        </div>
        {copied && <span className="routing-diagram__copied">Copied</span>}
      </div>

      <button type="button" className="btn btn--primary btn--lg routing-diagram__disconnect" onClick={stopAll}>
        Disconnect
        <span className="btn__divider" />
        <Square size={14} />
      </button>

      <div className="routing-diagram__scheme" ref={schemeRef}>
        <div
          className="routing-diagram__user"
          style={{ top: userTop, left: 0 }}
        >
          <div className="routing-diagram__user-avatar">
            <div className="routing-diagram__user-glow" />
          </div>
          <span className="routing-diagram__user-label">User</span>
        </div>

        <svg
          className="routing-diagram__lines"
          style={{ opacity: showLines ? 1 : 0 }}
          width="100%"
          height={bandHeight}
          overflow="visible"
        >
          <defs>
            {visibleGroups.map((group, i) => {
              const state = aggregateRegionState(group.services.map((s) => serviceStatusToDiagState(s.status)));
              const y2 = cardsTop + i * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
              return (
                <linearGradient
                  key={`grad-${group.regionId}`}
                  id={`routing-line-grad-${group.regionId}`}
                  gradientUnits="userSpaceOnUse"
                  x1={USER_SIZE / 2}
                  y1={userTop + USER_SIZE / 2}
                  x2={cardsLeft}
                  y2={y2}
                >
                  <stop offset="0%" stopColor="var(--routing-line-main)" />
                  <stop offset="100%" stopColor={colored ? stateLineColor(state) : 'var(--routing-line-main)'} />
                </linearGradient>
              );
            })}
          </defs>
          {visibleGroups.map((group, i) => {
            const y1 = userTop + USER_SIZE / 2;
            const y2 = cardsTop + i * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
            const pathD = bezierPath(USER_SIZE / 2, y1, cardsLeft, y2);
            return (
              <path
                key={group.regionId}
                d={pathD}
                fill="none"
                stroke={`url(#routing-line-grad-${group.regionId})`}
                strokeWidth={1.5}
              />
            );
          })}
          {showShimmer &&
            visibleGroups.map((group, i) => {
              const y1 = userTop + USER_SIZE / 2;
              const y2 = cardsTop + i * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
              const pathD = bezierPath(USER_SIZE / 2, y1, cardsLeft, y2);
              return (
                <circle key={`dot-${group.regionId}`} r={4} className="routing-diagram__line-dot">
                  <animateMotion dur="1.1s" repeatCount="indefinite" path={pathD} />
                </circle>
              );
            })}
        </svg>

        {visibleGroups.map((group, i) => (
          <Card
            key={group.regionId}
            group={group}
            top={cardsTop + i * (CARD_HEIGHT + CARD_GAP)}
            left={cardsLeft}
            routes={routes}
            introPhase={introPhase}
            onOpenService={setActiveSessionServiceId}
          />
        ))}

        {overflowGroups > 0 && (
          <div
            className="routing-diagram__ghost-stack"
            style={{ top: cardsTop + cardsTotalHeight + CARD_GAP, left: cardsLeft, opacity: introPhase === 'done' ? 1 : 0 }}
          >
            <div className="routing-diagram__ghost-item routing-diagram__ghost-item--label">
              +{overflowGroups} server{overflowGroups > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {activeSessionServiceId && (
        <ServiceSessionModal
          serviceId={activeSessionServiceId}
          onClose={() => setActiveSessionServiceId(null)}
        />
      )}
    </div>
  );
}
