import { useStore } from '../store/useStore';

// Mock network event engine — SRS sections 5.4-5.6, 3.2, 3.8.
// All "network" events are simulated with timers and pseudo-random numbers.

const connectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const recoveryTimers = new Map<string, ReturnType<typeof setTimeout>>();
let tickInterval: ReturnType<typeof setInterval> | null = null;

function randRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clearConnectTimer(serviceId: string) {
  const t = connectTimers.get(serviceId);
  if (t) {
    clearTimeout(t);
    connectTimers.delete(serviceId);
  }
}

function clearRecoveryTimer(serviceId: string) {
  const t = recoveryTimers.get(serviceId);
  if (t) {
    clearTimeout(t);
    recoveryTimers.delete(serviceId);
  }
}

export function beginConnect(serviceId: string) {
  clearConnectTimer(serviceId);
  clearRecoveryTimer(serviceId);
  const state = useStore.getState();
  state.setServiceStatus(serviceId, 'connecting');
  state.setRouteStatus(serviceId, 'idle', { latencyMs: 0 });

  const t = setTimeout(() => {
    connectTimers.delete(serviceId);
    const s = useStore.getState();
    const service = s.library.find((sv) => sv.id === serviceId);
    if (!service || !s.isRunning || !service.enabled) return;

    const failed = Math.random() < 0.08;
    if (failed) {
      s.setServiceStatus(serviceId, 'error');
      s.setRouteStatus(serviceId, 'unavailable');
      s.pushNotification({
        type: 'service_unresponsive',
        relatedServiceId: serviceId,
        severity: 'critical',
        message: `${service.name}: failed to establish a connection.`,
        actions: [{ label: 'Retry connection', actionType: 'switch_route' }],
      });
      scheduleAutoRetry(serviceId);
    } else {
      s.setServiceStatus(serviceId, 'connected');
      s.setRouteStatus(serviceId, 'active', { latencyMs: randRange(20, 120), stability: randRange(80, 100) });
    }
  }, randRange(800, 2000));

  connectTimers.set(serviceId, t);
}

function scheduleAutoRetry(serviceId: string) {
  clearRecoveryTimer(serviceId);
  const t = setTimeout(() => {
    recoveryTimers.delete(serviceId);
    const s = useStore.getState();
    const service = s.library.find((sv) => sv.id === serviceId);
    if (!service || !s.isRunning || !service.enabled) return;
    if (service.status === 'error') beginConnect(serviceId);
  }, randRange(4000, 8000));
  recoveryTimers.set(serviceId, t);
}

export function stopService(serviceId: string) {
  clearConnectTimer(serviceId);
  clearRecoveryTimer(serviceId);
  const state = useStore.getState();
  state.setServiceStatus(serviceId, 'inactive');
  state.setRouteStatus(serviceId, 'idle', { latencyMs: 0, stability: 100, usesBridge: false });
}

export function retryService(serviceId: string) {
  const state = useStore.getState();
  if (!state.isRunning) return;
  beginConnect(serviceId);
}

export function startSimulation() {
  const state = useStore.getState();
  state.library.filter((s) => s.enabled).forEach((s) => beginConnect(s.id));
  restartTick();
}

export function stopSimulation() {
  connectTimers.forEach((t) => clearTimeout(t));
  connectTimers.clear();
  recoveryTimers.forEach((t) => clearTimeout(t));
  recoveryTimers.clear();
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  const state = useStore.getState();
  state.library.forEach((s) => {
    state.setServiceStatus(s.id, 'inactive');
    state.setRouteStatus(s.id, 'idle', { latencyMs: 0, stability: 100, usesBridge: false });
  });
}

export function restartTick() {
  if (tickInterval) clearInterval(tickInterval);
  const interval = useStore.getState().appSettings.advancedNetwork.tickIntervalMs;
  tickInterval = setInterval(tick, interval);
}

export function updateTickInterval() {
  if (tickInterval) restartTick();
}

function tick() {
  const state = useStore.getState();
  if (!state.isRunning) return;
  const chance = state.appSettings.advancedNetwork.degradationChance / 100;

  state.library.forEach((service) => {
    if (!service.enabled) return;
    const route = state.routes[service.id];
    if (!route) return;

    if (service.status === 'connected') {
      const latency = clamp(route.latencyMs + randRange(-10, 10), 15, 300);
      const stability = clamp(route.stability + randRange(-5, 3), 0, 100);
      state.setRouteStatus(service.id, 'active', { latencyMs: latency, stability });
      if (Math.random() < chance) {
        degradeService(service.id);
      }
    } else if (service.status === 'degraded') {
      const latency = clamp(route.latencyMs + randRange(-5, 20), 40, 400);
      const stability = clamp(route.stability + randRange(-8, 4), 0, 100);
      state.setRouteStatus(service.id, 'degraded', { latencyMs: latency, stability });
      const roll = Math.random();
      if (roll < chance * 0.5) {
        loseRoute(service.id);
      } else if (roll > 0.55) {
        recoverService(service.id);
      }
    }
  });
}

function degradeService(serviceId: string) {
  const state = useStore.getState();
  const service = state.library.find((s) => s.id === serviceId);
  if (!service) return;
  state.setServiceStatus(serviceId, 'degraded');
  state.setRouteStatus(serviceId, 'degraded');
  const isOverload = Math.random() < 0.5;
  state.pushNotification({
    type: isOverload ? 'server_overload' : 'quality_degraded',
    relatedServiceId: serviceId,
    severity: 'warning',
    message: isOverload
      ? `${service.name}: the region server is overloaded, connection quality has dropped.`
      : `${service.name}: connection quality has degraded.`,
    actions: [{ label: 'Go to service', actionType: 'go_to_service' }],
  });
}

function recoverService(serviceId: string) {
  const state = useStore.getState();
  const service = state.library.find((s) => s.id === serviceId);
  if (!service || service.status !== 'degraded') return;
  state.setServiceStatus(serviceId, 'connected');
  state.setRouteStatus(serviceId, 'active', { stability: randRange(85, 100) });
}

function loseRoute(serviceId: string) {
  const state = useStore.getState();
  const service = state.library.find((s) => s.id === serviceId);
  if (!service) return;
  state.setServiceStatus(serviceId, 'error');
  state.setRouteStatus(serviceId, 'unavailable');
  state.pushNotification({
    type: 'route_unavailable',
    relatedServiceId: serviceId,
    severity: 'critical',
    message: `${service.name}: route unavailable.`,
    actions: [
      { label: 'Connect bridge', actionType: 'connect_bridge' },
      { label: 'Go to service', actionType: 'go_to_service' },
    ],
  });
  attemptRestoreMainRoute(serviceId);
}

function attemptRestoreMainRoute(serviceId: string) {
  clearRecoveryTimer(serviceId);
  const t = setTimeout(() => {
    recoveryTimers.delete(serviceId);
    const state = useStore.getState();
    const service = state.library.find((s) => s.id === serviceId);
    if (!service || !state.isRunning || service.status !== 'error') return;

    const restored = Math.random() < 0.35;
    if (restored) {
      beginConnect(serviceId);
      return;
    }
    const auto = state.appSettings.advancedNetwork.autoBridge;
    if (auto) {
      connectBridgeFor(serviceId, true);
    } else {
      state.pushNotification({
        type: 'bridge_suggested',
        relatedServiceId: serviceId,
        severity: 'warning',
        message: `${service.name}: the primary route is unavailable. Connect the emergency bridge?`,
        actions: [{ label: 'Connect bridge', actionType: 'connect_bridge' }],
      });
    }
  }, randRange(2500, 4000));
  recoveryTimers.set(serviceId, t);
}

export function connectBridgeFor(serviceId: string, isAuto = false) {
  const state = useStore.getState();
  const service = state.library.find((s) => s.id === serviceId);
  if (!service) return;
  const bridgeId = state.ensureBridge(serviceId, isAuto);
  state.setBridgeStatus(bridgeId, 'connecting');

  setTimeout(() => {
    const s2 = useStore.getState();
    const svc = s2.library.find((x) => x.id === serviceId);
    if (!svc) return;
    s2.setBridgeStatus(bridgeId, 'connected');
    s2.setRouteStatus(serviceId, 'active', {
      usesBridge: true,
      stability: randRange(70, 95),
      latencyMs: randRange(60, 180),
    });
    s2.setServiceStatus(serviceId, 'connected');
    s2.pushNotification({
      type: 'bridge_connected',
      relatedServiceId: serviceId,
      severity: 'info',
      message: `${svc.name}: connection restored via the emergency bridge.`,
      actions: [],
    });
  }, randRange(1200, 2200));
}
