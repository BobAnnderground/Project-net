import { useState } from 'react';
import { Server, Gamepad2, Clock, Square } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { REGIONS } from '../../data/regions';
import { ServiceSessionModal } from './ServiceSessionModal';
import type { ServiceStatus } from '../../types';

// ── Constants ────────────────────────────────────────────────────────────────

const ZONE1_WIDTH = 180;
const ZONE2_LEFT = 180;
const ZONE2_WIDTH = 320;
const ZONE3_LEFT = 500;
const ZONE3_WIDTH = 380;

const USER_NODE_W = 64;
const USER_NODE_H = 64;
const USER_NODE_X = ZONE1_WIDTH / 2 - USER_NODE_W / 2; // 58

const REGION_NODE_W = 160;
const REGION_NODE_H = 48;
const REGION_NODE_X = ZONE2_LEFT + (ZONE2_WIDTH - REGION_NODE_W) / 2; // 260

const LEAF_NODE_W = 220;
const LEAF_NODE_H = 68;
const LEAF_NODE_X = ZONE3_LEFT + (ZONE3_WIDTH - LEAF_NODE_W) / 2; // 580

const LEAF_GAP_INTRA = 8;   // between leaves in same region group
const LEAF_GAP_INTER = 16;  // between different region groups

// ── Types ────────────────────────────────────────────────────────────────────

type DiagState = 'connected' | 'connecting' | 'degraded' | 'error';

interface LeafLayout {
  serviceId: string;
  top: number;
}

interface RegionLayout {
  regionId: string;
  displayName: string;
  top: number;
  state: DiagState;
  leaves: LeafLayout[];
}

interface DiagramLayout {
  userTop: number;
  regions: RegionLayout[];
  totalHeight: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function serviceStatusToDiagState(status: ServiceStatus): DiagState {
  switch (status) {
    case 'connected': return 'connected';
    case 'connecting': return 'connecting';
    case 'degraded':  return 'degraded';
    case 'error':     return 'error';
    default:          return 'connecting';
  }
}

function aggregateRegionState(states: DiagState[]): DiagState {
  if (states.includes('error'))     return 'error';
  if (states.includes('degraded'))  return 'degraded';
  if (states.includes('connecting')) return 'connecting';
  return 'connected';
}

function stateColor(state: DiagState): string {
  switch (state) {
    case 'connected':  return 'var(--ok)';
    case 'connecting': return 'var(--accent)';
    case 'degraded':   return 'var(--warn)';
    case 'error':      return 'var(--err)';
  }
}

function stateDimColor(state: DiagState): string {
  switch (state) {
    case 'connected':  return 'var(--ok-dim)';
    case 'connecting': return 'var(--accent-dim)';
    case 'degraded':   return 'var(--warn-dim)';
    case 'error':      return 'var(--err-dim)';
  }
}

function stateChipLabel(status: ServiceStatus): string {
  switch (status) {
    case 'connected':  return 'Connected';
    case 'connecting': return 'Connecting…';
    case 'degraded':   return 'Degraded';
    case 'error':      return 'Error';
    default:           return 'Inactive';
  }
}

// ── Layout computation ───────────────────────────────────────────────────────

function computeLayout(
  regionGroups: Array<{ regionId: string; displayName: string; serviceIds: string[] }>,
  serviceStateMap: Map<string, DiagState>
): DiagramLayout {
  // First pass: compute all leaf y positions
  let cursor = 0;
  const regionLayouts: RegionLayout[] = [];

  for (let gi = 0; gi < regionGroups.length; gi++) {
    const group = regionGroups[gi];

    // Add inter-group gap before this group (not the first)
    if (gi > 0) cursor += LEAF_GAP_INTER;

    const leaves: LeafLayout[] = [];

    for (let li = 0; li < group.serviceIds.length; li++) {
      if (li > 0) cursor += LEAF_GAP_INTRA;
      leaves.push({ serviceId: group.serviceIds[li], top: cursor });
      cursor += LEAF_NODE_H;
    }

    // Region node is vertically centered on its group's leaf span
    const groupTop = leaves[0].top;
    const groupBottom = leaves[leaves.length - 1].top + LEAF_NODE_H;
    const regionTop = (groupTop + groupBottom) / 2 - REGION_NODE_H / 2;

    const leafStates = group.serviceIds.map((id) => serviceStateMap.get(id) ?? 'connecting');
    const regionState = aggregateRegionState(leafStates);

    regionLayouts.push({
      regionId: group.regionId,
      displayName: group.displayName,
      top: regionTop,
      state: regionState,
      leaves,
    });
  }

  const totalHeight = Math.max(cursor, USER_NODE_H);

  // User node is vertically centered on the midpoint of all region nodes
  let userTop: number;
  if (regionLayouts.length > 0) {
    const firstRegionCenter = regionLayouts[0].top + REGION_NODE_H / 2;
    const lastRegionCenter = regionLayouts[regionLayouts.length - 1].top + REGION_NODE_H / 2;
    const midY = (firstRegionCenter + lastRegionCenter) / 2;
    userTop = midY - USER_NODE_H / 2;
  } else {
    userTop = totalHeight / 2 - USER_NODE_H / 2;
  }

  return { userTop, regions: regionLayouts, totalHeight };
}

// ── SVG edge helpers ─────────────────────────────────────────────────────────

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = x1 + (x2 - x1) / 2;
  return `M ${x1},${y1} C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
}

interface EdgeProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  state: DiagState;
  strokeWidth: number;
}

function Edge({ x1, y1, x2, y2, state, strokeWidth }: EdgeProps) {
  const pathD = bezierPath(x1, y1, x2, y2);
  const color = stateColor(state);
  const isConnecting = state === 'connecting';
  const isError = state === 'error';

  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeOpacity={isConnecting ? 0.35 : 1}
        strokeDasharray={isError ? '6 3' : undefined}
      />
      {isConnecting && (
        <>
          <circle r={5} fill={color} fillOpacity={0.8}>
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              path={pathD}
            />
          </circle>
          <circle r={5} fill={color} fillOpacity={0.8}>
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              begin="0.6s"
              path={pathD}
            />
          </circle>
        </>
      )}
    </g>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function RoutingDiagram() {
  const library = useStore((s) => s.library);
  const routes = useStore((s) => s.routes);
  const stopAll = useStore((s) => s.stopAll);
  const [activeSessionServiceId, setActiveSessionServiceId] = useState<string | null>(null);

  // Filter to enabled services only
  const enabledServices = library.filter((s) => s.enabled);

  // Group by region, preserving first-seen order
  const regionOrder: string[] = [];
  const regionMap = new Map<string, string[]>(); // regionId -> serviceIds
  for (const svc of enabledServices) {
    if (!regionMap.has(svc.region)) {
      regionMap.set(svc.region, []);
      regionOrder.push(svc.region);
    }
    regionMap.get(svc.region)!.push(svc.id);
  }

  const regionGroups = regionOrder.map((rid) => {
    const regionDef = REGIONS.find((r) => r.id === rid);
    return {
      regionId: rid,
      displayName: regionDef?.displayName ?? rid,
      serviceIds: regionMap.get(rid) ?? [],
    };
  });

  // Build a map from serviceId -> DiagState
  const serviceById = new Map(enabledServices.map((s) => [s.id, s]));
  const serviceStateMap = new Map<string, DiagState>();
  for (const svc of enabledServices) {
    serviceStateMap.set(svc.id, serviceStatusToDiagState(svc.status));
  }

  const layout = computeLayout(regionGroups, serviceStateMap);

  // Edge connection points
  // User node right-center
  const userRightX = USER_NODE_X + USER_NODE_W;
  const userCenterY = layout.userTop + USER_NODE_H / 2;

  // Region node left-center
  const regionLeftX = REGION_NODE_X;

  // Leaf node left-center
  const leafLeftX = LEAF_NODE_X;

  return (
    <div className="routing-diagram">
      <div className="routing-diagram__header">
        <button className="btn btn--lg btn--primary" onClick={stopAll}>
          <Square size={16} />
          Stop routing
        </button>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: layout.totalHeight,
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        {/* SVG layer — behind nodes */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
          width="100%"
          height={layout.totalHeight}
          overflow="visible"
        >
          {/* User → each Region */}
          {layout.regions.map((reg) => {
            const regionCenterY = reg.top + REGION_NODE_H / 2;
            return (
              <Edge
                key={`user-reg-${reg.regionId}`}
                x1={userRightX}
                y1={userCenterY}
                x2={regionLeftX}
                y2={regionCenterY}
                state={reg.state}
                strokeWidth={2}
              />
            );
          })}

          {/* Region → each leaf */}
          {layout.regions.map((reg) => {
            const regionRightX = REGION_NODE_X + REGION_NODE_W;
            const regionCenterY = reg.top + REGION_NODE_H / 2;
            return reg.leaves.map((leaf) => {
              const leafState = serviceStateMap.get(leaf.serviceId) ?? 'connecting';
              const leafCenterY = leaf.top + LEAF_NODE_H / 2;
              return (
                <Edge
                  key={`reg-leaf-${leaf.serviceId}`}
                  x1={regionRightX}
                  y1={regionCenterY}
                  x2={leafLeftX}
                  y2={leafCenterY}
                  state={leafState}
                  strokeWidth={1.5}
                />
              );
            });
          })}
        </svg>

        {/* User node */}
        <div
          className="routing-node-user"
          style={{
            position: 'absolute',
            left: USER_NODE_X,
            top: layout.userTop,
            width: USER_NODE_W,
            height: USER_NODE_H,
            zIndex: 1,
          }}
        >
          You
        </div>

        {/* Region nodes */}
        {layout.regions.map((reg) => {
          const isGaming = reg.displayName.toLowerCase().includes('gaming');
          const borderColor = stateColor(reg.state);
          const dotColor = stateColor(reg.state);

          return (
            <div
              key={`region-node-${reg.regionId}`}
              className="routing-node-region"
              style={{
                position: 'absolute',
                left: REGION_NODE_X,
                top: reg.top,
                width: REGION_NODE_W,
                height: REGION_NODE_H,
                borderColor,
                zIndex: 1,
              }}
            >
              {isGaming ? (
                <Gamepad2 size={16} className="routing-node-region__icon" />
              ) : (
                <Server size={16} className="routing-node-region__icon" />
              )}
              <span className="routing-node-region__name">{reg.displayName}</span>
              <span
                className="routing-node-region__dot"
                style={{ background: dotColor }}
              />
            </div>
          );
        })}

        {/* Service leaf nodes */}
        {layout.regions.map((reg) =>
          reg.leaves.map((leaf) => {
            const svc = serviceById.get(leaf.serviceId);
            if (!svc) return null;
            const leafState = serviceStateMap.get(leaf.serviceId) ?? 'connecting';
            const borderColor = stateColor(leafState);
            const route = routes[svc.id];
            const latencyMs = route?.latencyMs ?? 0;
            const showLatency =
              svc.status === 'connected' || svc.status === 'degraded';

            return (
              <div
                key={`leaf-node-${svc.id}`}
                className="routing-node-leaf"
                onClick={() => setActiveSessionServiceId(svc.id)}
                style={{
                  position: 'absolute',
                  left: LEAF_NODE_X,
                  top: leaf.top,
                  width: LEAF_NODE_W,
                  height: LEAF_NODE_H,
                  borderColor,
                  zIndex: 1,
                }}
              >
                <div className="routing-node-leaf__row1">
                  <span className="routing-node-leaf__emoji">{svc.icon}</span>
                  <span className="routing-node-leaf__name">{svc.name}</span>
                </div>
                <div className="routing-node-leaf__row2">
                  <span className="routing-node-leaf__latency">
                    <Clock size={12} className="routing-node-leaf__clock" />
                    {showLatency ? `${latencyMs} ms` : '— ms'}
                  </span>
                  <span
                    className="routing-node-leaf__chip"
                    style={{
                      background: stateDimColor(leafState),
                      color: stateColor(leafState),
                    }}
                  >
                    {stateChipLabel(svc.status)}
                  </span>
                </div>
              </div>
            );
          })
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
