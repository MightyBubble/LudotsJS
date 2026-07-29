// Shared behavior library — the "services" in SOA.
//
// Three-layer architecture:
//   Layer 1: Decision (BT/FSM) → BEHAVIORS[action].execute() requests an ABILITY
//   Layer 2: Ability System → processAbilities() executes abilities with tag-based lockout
//   Layer 3: Movement → processCommands() applies velocity-smoothed movement
//
// Conditions are DATA-DRIVEN (config.evaluator → generic evaluator with params).
// Plain math (no THREE dependency) so it runs in any context.

function distance(a, b) {
  const dx = (a.x || 0) - (b.x || 0);
  const dy = (a.y || 0) - (b.y || 0);
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// ── Movement Command Queue (Layer 3) ──
function pushCommand(agent, cmd) {
  if (agent.commandQueue.length > 0 && agent.commandQueue[0].type === cmd.type) {
    agent.commandQueue[0] = cmd;
  } else {
    agent.commandQueue = [cmd];
  }
}

// ── Hysteresis ──
function hysteresis(agent, key, value, enterThreshold, exitThreshold) {
  const h = agent._hysteresis;
  const wasTrue = h[key] || false;
  const result = wasTrue ? value < exitThreshold : value < enterThreshold;
  h[key] = result;
  return result;
}

// ── Value Resolver ──
function getPath(obj, path) {
  if (obj == null) return undefined;
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function resolveValue(agent, spec, blackboard) {
  if (typeof spec === 'number' || typeof spec === 'boolean') return spec;
  if (typeof spec === 'string') {
    if (spec.startsWith('agent.')) return getPath(agent, spec.slice(6));
    if (spec.startsWith('enemy.')) return getPath(agent.enemy, spec.slice(6));
    if (spec.startsWith('bb.')) return getPath(blackboard, spec.slice(3));
    if (spec === 'true') return true;
    if (spec === 'false') return false;
    const num = Number(spec);
    if (!isNaN(num) && spec.trim() !== '') return num;
    return spec;
  }
  return spec;
}

// ═══════════════════════════════════════════════
// LAYER 2: ABILITY SYSTEM
// Abilities are concrete actions with timing, tags, and lockout.
// Each ability has: tag (determines lockout), duration, onTick.
// tag → TAG_LOCKOUT[tag] gives the recovery time after the ability ends.
// ═══════════════════════════════════════════════

export const TAG_LOCKOUT = {
  movement: 0,        // Movement abilities — no lockout, interruptible
  idle: 0,            // Idle — no lockout
  attack_light: 0.3,  // Light attack (ranged) — 0.3s recovery
  attack_heavy: 0.6,  // Heavy attack (melee) — 0.6s recovery
  cast: 0.5,          // Spell casting — 0.5s recovery
};

export const TAG_LABELS = {
  movement: '移动',
  idle: '待机',
  attack_light: '轻击',
  attack_heavy: '重击',
  cast: '施法',
};

export const ABILITIES = {
  patrol: {
    label: '巡逻',
    tag: 'movement',
    description: '向巡逻点移动（持续，可打断）',
    duration: null, // null = continuous, interruptible by new requests
    onTick: (agent, dt) => {
      const wp = agent.waypoints[agent.currentWaypoint];
      if (!wp) return;
      pushCommand(agent, { type: 'move', target: wp, speed: agent.speed });
      if (distance(agent.position, wp) < 0.5) {
        agent.currentWaypoint = (agent.currentWaypoint + 1) % agent.waypoints.length;
      }
    },
  },
  chase: {
    label: '追击',
    tag: 'movement',
    duration: null,
    onTick: (agent, dt) => {
      pushCommand(agent, { type: 'move', target: { ...agent.enemy.position }, speed: agent.speed * 1.3 });
    },
  },
  flee: {
    label: '逃跑',
    tag: 'movement',
    duration: null,
    onTick: (agent, dt) => {
      const dx = agent.position.x - agent.enemy.position.x;
      const dz = agent.position.z - agent.enemy.position.z;
      pushCommand(agent, { type: 'move', target: { x: agent.position.x + dx, z: agent.position.z + dz }, speed: agent.speed });
    },
  },
  idle: {
    label: '待机',
    tag: 'idle',
    duration: null,
    onTick: () => {},
  },
  melee_attack: {
    label: '近战攻击',
    tag: 'attack_heavy',
    description: '0.6s 动作：0.3s 蓄力 → 命中 → 恢复（硬直 0.6s）',
    duration: 0.6,
    onTick: (agent, dt, elapsed) => {
      // Strike frame at 0.3s (mid-swing)
      if (elapsed >= 0.3 && !agent._hitFrame) {
        agent._hitFrame = true;
        if (agent.enemy.alive) {
          agent.enemy.health -= agent.damage;
          if (agent.enemy.health <= 0) {
            agent.enemy.alive = false;
            agent.enemy.health = 0;
          }
        }
      }
    },
    onEnd: (agent) => { agent._hitFrame = false; },
  },
  ranged_attack: {
    label: '远程攻击',
    tag: 'attack_light',
    description: '0.4s 动作：0.2s 瞄准 → 命中 → 恢复（硬直 0.3s）',
    duration: 0.4,
    onTick: (agent, dt, elapsed) => {
      // Release frame at 0.2s
      if (elapsed >= 0.2 && !agent._hitFrame) {
        agent._hitFrame = true;
        if (agent.enemy.alive) {
          agent.enemy.health -= agent.rangedDamage;
          if (agent.enemy.health <= 0) {
            agent.enemy.alive = false;
            agent.enemy.health = 0;
          }
        }
      }
    },
    onEnd: (agent) => { agent._hitFrame = false; },
  },
  heal: {
    label: '治疗',
    tag: 'cast',
    description: '2s 引导恢复生命值（硬直 0.5s）',
    duration: 2.0,
    onTick: (agent, dt) => {
      agent.health = Math.min(agent.maxHealth, agent.health + 15 * dt);
    },
  },
};

export const ABILITY_LIST = Object.entries(ABILITIES).map(([key, a]) => ({
  key,
  label: a.label,
  tag: a.tag,
  description: a.description,
  duration: a.duration,
}));

// Request an ability. Continuous abilities (duration=null) are interrupted.
// Timed abilities queue behind the active one; lockout delays startup.
export function requestAbility(agent, key, params) {
  // Already active — no-op
  if (agent.activeAbility?.key === key) return;
  // Already queued — no-op
  if (agent.abilityQueue.some((a) => a.key === key)) return;

  // Interrupt continuous abilities (movement, idle)
  if (agent.activeAbility) {
    const current = ABILITIES[agent.activeAbility.key];
    if (current?.duration == null) {
      if (current.onEnd) current.onEnd(agent);
      agent.activeAbility = null;
      agent.abilityElapsed = 0;
    }
  }

  agent.abilityQueue.push({ key, params: params || {} });
  if (agent.abilityQueue.length > 3) agent.abilityQueue.shift();
}

// Process the ability queue: tick active ability, handle lockout, start next.
export function processAbilities(agent, dt) {
  // Tick down lockout
  if (agent.lockoutTimer > 0) {
    agent.lockoutTimer -= dt;
  }

  // Tick active ability
  if (agent.activeAbility) {
    agent.abilityElapsed += dt;
    const ability = ABILITIES[agent.activeAbility.key];
    if (ability?.onTick) {
      ability.onTick(agent, dt, agent.abilityElapsed, agent.activeAbility.params);
    }

    // End timed abilities
    if (ability?.duration != null && agent.abilityElapsed >= ability.duration) {
      if (ability.onEnd) ability.onEnd(agent);
      agent.lockoutTimer = TAG_LOCKOUT[ability.tag] || 0;
      agent.lockoutTag = ability.tag;
      agent.activeAbility = null;
      agent.abilityElapsed = 0;
    }
  }

  // Start next from queue if no active ability and not in lockout
  if (!agent.activeAbility && agent.lockoutTimer <= 0 && agent.abilityQueue.length > 0) {
    const next = agent.abilityQueue.shift();
    const ability = ABILITIES[next.key];
    if (ability) {
      agent.activeAbility = next;
      agent.abilityElapsed = 0;
      if (ability.onStart) ability.onStart(agent);
    }
  }
}

// ═══════════════════════════════════════════════
// LAYER 3: MOVEMENT SYSTEM
// ═══════════════════════════════════════════════

export function updateNearestEnemy(agent, enemies) {
  let nearest = null;
  let minDist = Infinity;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const d = distance(agent.position, enemy.position);
    // Only detect enemies within vision range — decoupled from attack/ranged range
    if (d <= agent.visionRange && d < minDist) {
      minDist = d;
      nearest = enemy;
    }
  }
  if (nearest) {
    agent.enemy = nearest;
  } else {
    // No enemy in vision — placeholder preserves last known position, alive=false
    // so has_enemy conditions fail and abilities won't damage a phantom
    const lastPos = agent.enemy?.position || { x: 0, y: 0, z: 0 };
    agent.enemy = { position: { ...lastPos }, health: 0, alive: false };
  }
}

export function processCommands(agent, dt) {
  let target = null;
  let speed = 0;

  if (agent.commandQueue.length > 0) {
    const cmd = agent.commandQueue[0];
    if (cmd.type === 'move') {
      target = cmd.target;
      speed = cmd.speed;
      if (distance(agent.position, target) < 0.3) {
        agent.commandQueue.shift();
      }
    }
  }

  if (target && speed > 0) {
    const dx = (target.x || 0) - (agent.position.x || 0);
    const dz = (target.z || 0) - (agent.position.z || 0);
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.05) {
      const desiredVx = (dx / dist) * speed;
      const desiredVz = (dz / dist) * speed;
      const smooth = 1 - Math.exp(-10 * dt);
      agent.velocity.x += (desiredVx - agent.velocity.x) * smooth;
      agent.velocity.z += (desiredVz - agent.velocity.z) * smooth;
      agent.position.x += agent.velocity.x * dt;
      agent.position.z += agent.velocity.z * dt;
    } else {
      agent.velocity.x *= 0.3;
      agent.velocity.z *= 0.3;
    }
  } else {
    const decay = Math.exp(-8 * dt);
    agent.velocity.x *= decay;
    agent.velocity.z *= decay;
    agent.position.x += agent.velocity.x * dt;
    agent.position.z += agent.velocity.z * dt;
  }
}

export function createAgent() {
  return {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, z: 0 },
    health: 100,
    maxHealth: 100,
    attackRange: 3,
    rangedRange: 8,
    visionRange: 12,
    speed: 3,
    damage: 25,
    rangedDamage: 15,
    // Layer 3: movement command queue
    commandQueue: [],
    // Layer 2: ability system
    abilityQueue: [],
    activeAbility: null,
    abilityElapsed: 0,
    lockoutTimer: 0,
    lockoutTag: null,
    // Shared state
    blackboard: {},
    enemy: { position: { x: 6, y: 0, z: 6 }, health: 100, alive: true },
    waypoints: [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: 8, z: 8 },
      { x: -8, z: 8 },
    ],
    currentWaypoint: 0,
    fsmState: null,
    label: '—',
    _hysteresis: {},
    _lastLabel: '',
    _hitFrame: false,
  };
}

// ═══════════════════════════════════════════════
// LAYER 1: DECISION (BT/FSM actions)
// Actions are thin wrappers that request abilities.
// The BT/FSM executor calls execute(); the actual work happens in the ability system.
// ═══════════════════════════════════════════════
export const BEHAVIORS = {
  patrol: {
    label: '巡逻',
    type: 'action',
    description: '请求巡逻能力',
    execute: (agent) => {
      agent.label = '巡逻';
      requestAbility(agent, 'patrol');
      return 'running';
    },
  },
  chase: {
    label: '追击',
    type: 'action',
    description: '请求追击能力',
    execute: (agent) => {
      agent.label = '追击';
      requestAbility(agent, 'chase');
      return 'running';
    },
  },
  attack: {
    label: '攻击',
    type: 'action',
    description: '请求近战攻击能力',
    execute: (agent) => {
      agent.label = '攻击';
      requestAbility(agent, 'melee_attack');
      return 'running';
    },
  },
  melee_attack: {
    label: '近战攻击',
    type: 'action',
    description: '请求近战攻击（重击 tag，硬直0.6s）',
    execute: (agent) => {
      agent.label = '近战攻击';
      requestAbility(agent, 'melee_attack');
      return 'running';
    },
  },
  ranged_attack: {
    label: '远程攻击',
    type: 'action',
    description: '请求远程攻击（轻击 tag，硬直0.3s）',
    execute: (agent) => {
      agent.label = '远程攻击';
      requestAbility(agent, 'ranged_attack');
      return 'running';
    },
  },
  flee: {
    label: '逃跑',
    type: 'action',
    description: '请求逃跑能力',
    execute: (agent) => {
      agent.label = '逃跑';
      requestAbility(agent, 'flee');
      return 'running';
    },
  },
  idle: {
    label: '待机',
    type: 'action',
    description: '请求待机能力',
    execute: (agent) => {
      agent.label = '待机';
      requestAbility(agent, 'idle');
      return 'success';
    },
  },
  heal: {
    label: '治疗',
    type: 'action',
    description: '请求治疗能力（施法 tag，硬直0.5s）',
    execute: (agent) => {
      agent.label = '治疗';
      requestAbility(agent, 'heal');
      return 'running';
    },
  },
};

export const BEHAVIOR_LIST = Object.entries(BEHAVIORS).map(([key, b]) => ({
  key,
  ...b,
}));

// ═══════════════════════════════════════════════
// CONDITIONS — data-driven, configured via config.params
// ═══════════════════════════════════════════════
export const EVALUATORS = {
  within_distance: {
    label: '距离在范围内',
    description: 'source 与 target 的距离 < threshold（带迟滞防抖）',
    params: [
      { key: 'source', label: '源位置', default: 'agent.position' },
      { key: 'target', label: '目标位置', default: 'enemy.position' },
      { key: 'threshold', label: '距离阈值', default: 'agent.attackRange' },
      { key: 'hysteresis_ratio', label: '迟滞系数', default: 1.3, optional: true },
    ],
    evaluate: (agent, params, blackboard, nodeId) => {
      const source = resolveValue(agent, params.source, blackboard);
      const target = resolveValue(agent, params.target, blackboard);
      const threshold = resolveValue(agent, params.threshold, blackboard);
      if (!source || !target || threshold == null) return false;
      const d = distance(source, target);
      const ratio = Number(resolveValue(agent, params.hysteresis_ratio, blackboard)) || 1.3;
      return hysteresis(agent, `wd_${nodeId}`, d, threshold, threshold * ratio);
    },
  },
  beyond_distance: {
    label: '距离超出范围',
    description: 'source 与 target 的距离 > threshold',
    params: [
      { key: 'source', label: '源位置', default: 'agent.position' },
      { key: 'target', label: '目标位置', default: 'enemy.position' },
      { key: 'threshold', label: '距离阈值', default: 6 },
    ],
    evaluate: (agent, params, blackboard) => {
      const source = resolveValue(agent, params.source, blackboard);
      const target = resolveValue(agent, params.target, blackboard);
      const threshold = resolveValue(agent, params.threshold, blackboard);
      if (!source || !target || threshold == null) return false;
      return distance(source, target) > threshold;
    },
  },
  property_below: {
    label: '属性低于阈值',
    description: '属性值 < threshold（带迟滞：需超过 exit_threshold 才解除）',
    params: [
      { key: 'property', label: '属性路径', default: 'agent.health' },
      { key: 'threshold', label: '进入阈值', default: 30 },
      { key: 'exit_threshold', label: '退出阈值', default: 50, optional: true },
    ],
    evaluate: (agent, params, blackboard, nodeId) => {
      const value = resolveValue(agent, params.property, blackboard);
      const threshold = resolveValue(agent, params.threshold, blackboard);
      const exitThreshold = params.exit_threshold != null
        ? resolveValue(agent, params.exit_threshold, blackboard)
        : threshold * 1.5;
      if (value == null || threshold == null) return false;
      return hysteresis(agent, `pb_${nodeId}`, value, threshold, exitThreshold);
    },
  },
  property_above: {
    label: '属性高于阈值',
    description: '属性值 > threshold',
    params: [
      { key: 'property', label: '属性路径', default: 'agent.health' },
      { key: 'threshold', label: '阈值', default: 50 },
    ],
    evaluate: (agent, params, blackboard) => {
      const value = resolveValue(agent, params.property, blackboard);
      const threshold = resolveValue(agent, params.threshold, blackboard);
      if (value == null || threshold == null) return false;
      return value > threshold;
    },
  },
  property_equals: {
    label: '属性等于值',
    description: '属性值 === value（可用于布尔判断如 enemy.alive === false）',
    params: [
      { key: 'property', label: '属性路径', default: 'enemy.alive' },
      { key: 'value', label: '期望值', default: true },
    ],
    evaluate: (agent, params, blackboard) => {
      const value = resolveValue(agent, params.property, blackboard);
      const target = resolveValue(agent, params.value, blackboard);
      return value === target;
    },
  },
};

export const EVALUATOR_LIST = Object.entries(EVALUATORS).map(([key, e]) => ({
  key,
  label: e.label,
  description: e.description,
  params: e.params,
}));

export function evaluateCondition(agent, config, nodeId) {
  if (!config || !config.evaluator) return false;
  const evaluator = EVALUATORS[config.evaluator];
  if (!evaluator) return false;
  const blackboard = agent.blackboard || {};
  return evaluator.evaluate(agent, config.params || {}, blackboard, nodeId);
}