/**
 * Effect Phase model — aligned with C# Ludots:
 * EffectPhaseId.cs / EffectPhaseExecutor.cs / EffectLifetimeKind.cs /
 * EffectPhaseSideEffectTransaction.cs / EffectApplicationSystem.cs / EffectLifetimeSystem.cs
 *
 * Fixed order: OnPropose → (ResponseChain) → OnCalculate → OnResolve → OnHit
 *              → OnApply → OnPeriod → OnExpire → OnRemove
 * ResponseChain is a response window between OnPropose and OnCalculate, NOT a phase id.
 */

export const PHASE_IDS = [
  'on_propose',
  'on_calculate',
  'on_resolve',
  'on_hit',
  'on_apply',
  'on_period',
  'on_expire',
  'on_remove',
];

export const PHASE_META = {
  on_propose: { label: 'OnPropose', cn: '提议', desc: 'Effect Request 入队后的提议阶段，可被 ResponseChain 拒绝/取消/改写/重定向。' },
  on_calculate: { label: 'OnCalculate', cn: '计算', desc: 'ResponseChain 结束后计算最终数值（Magnitude / Duration / Period）。' },
  on_resolve: { label: 'OnResolve', cn: '解析', desc: '解析最终目标集合与命中判定前置条件。' },
  on_hit: { label: 'OnHit', cn: '命中', desc: '命中结算；未命中则不进入 OnApply。' },
  on_apply: { label: 'OnApply', cn: '应用', desc: '写入状态贡献；Instant 在本阶段完成后同帧销毁，After/Infinite 创建持久实例。' },
  on_period: { label: 'OnPeriod', cn: '周期', desc: '仅 Durable（after / infinite）可用，按 period 周期执行。' },
  on_expire: { label: 'OnExpire', cn: '到期', desc: '仅自然到期路径执行；取消/强制移除会跳过本阶段。' },
  on_remove: { label: 'OnRemove', cn: '移除', desc: '自然到期与强制移除都会执行；实体销毁清理持久 Effect 时也执行本阶段。' },
};

/** Instant Effect 不允许的阶段 */
export const INSTANT_FORBIDDEN_PHASES = ['on_period', 'on_expire'];

export const LIFETIME_KINDS = [
  { value: 'instant', label: 'instant · 瞬时（Apply 后同帧销毁）' },
  { value: 'after', label: 'after · 定时（Durable，需 duration）' },
  { value: 'infinite', label: 'infinite · 无限（Durable）' },
];

export const isDurableKind = (kind) => kind === 'after' || kind === 'infinite';

export const MAIN_MODES = [
  { value: 'none', label: 'none · 无主操作' },
  { value: 'builtin', label: 'builtin · 内置操作' },
  { value: 'action_graph', label: 'action_graph · 调用 Action Graph' },
];

/** builtin 主操作目录（复用既有语义，销毁只发请求） */
export const BUILTIN_OPERATIONS = [
  { value: 'modify_attribute', label: '修改属性 modify_attribute' },
  { value: 'set_attribute', label: '覆盖属性 set_attribute' },
  { value: 'add_tag', label: '添加标签 add_tag' },
  { value: 'remove_tag', label: '移除标签 remove_tag' },
  { value: 'apply_effect', label: '施加效果请求 apply_effect' },
  { value: 'remove_effect', label: '移除效果请求 remove_effect' },
  { value: 'emit_event', label: '发出事件 emit_event' },
  { value: 'set_blackboard', label: '写黑板 set_blackboard' },
  { value: 'execute_data_graph', label: '执行数据图 execute_data_graph' },
  { value: 'entity_lifecycle_request', label: '实体生命周期请求 entity_lifecycle_request' },
];

export const ATTRIBUTE_OPERATIONS = [
  { value: 'add', label: 'add' },
  { value: 'multiply', label: 'multiply' },
  { value: 'override', label: 'override' },
];

/** Ability 侧的监听阶段（能力激活管线） */
export const ABILITY_LISTENER_PHASES = [
  'on_activation_requested', 'on_activated', 'on_completed', 'on_failed', 'on_cancelled',
];

export const LISTENER_SCOPES = [
  { value: 'target', label: 'target' },
  { value: 'source', label: 'source' },
  { value: 'global', label: 'global' },
];

/** HookResponse 只能入队请求，禁止在分发过程中直接做 ECS 结构变化 */
export const LISTENER_RESPONSE_TYPES = [
  { value: 'apply_effect', label: '入队 apply_effect' },
  { value: 'remove_effect', label: '入队 remove_effect' },
  { value: 'emit_event', label: '入队 emit_event' },
  { value: 'activate_ability', label: '入队 activate_ability' },
  { value: 'entity_lifecycle_request', label: '入队 entity_lifecycle_request' },
];

export const RESPONSE_CHAIN_ACTIONS = [
  { value: 'reject', label: 'reject · 拒绝该 Request' },
  { value: 'cancel', label: 'cancel · 取消（跳过 OnExpire，仍走 OnRemove）' },
  { value: 'modify', label: 'modify · 修改数值/参数' },
  { value: 'redirect', label: 'redirect · 重定向目标' },
  { value: 'replace', label: 'replace · 替换为其它 Effect' },
  { value: 'append', label: 'append · 追加附带 Effect' },
];

export const ENTITY_LIFECYCLE_REQUESTS = [
  { value: 'create', label: 'create · 创建实体请求' },
  { value: 'destroy', label: 'destroy · 销毁实体请求' },
];

/** 实体销毁状态机（模拟用） */
export const DESTROY_STATES = [
  'Alive', 'DestroyRequested', 'PendingDestroy', 'Cleanup', 'StructuralCommit', 'Destroyed',
];

/** 事务时间线阶段 */
export const TRANSACTION_STAGES = [
  { key: 'begin', label: 'Begin Transaction' },
  { key: 'snapshot', label: 'Snapshot / Checkpoints' },
  { key: 'execute_phases', label: 'Execute Phases' },
  { key: 'stage_side_effects', label: 'Stage Side Effects / Structural Commands' },
  { key: 'validate', label: 'Validate' },
  { key: 'prepare', label: 'Prepare' },
  { key: 'playback_structural', label: 'Playback Structural Commands' },
  { key: 'write_state', label: 'Write State' },
  { key: 'commit_external', label: 'Commit External Queues / Events' },
  { key: 'finalize_destroys', label: 'Finalize Destroys' },
  { key: 'end', label: 'End Transaction' },
];

export const ROLLBACK_STAGES = [
  { key: 'rollback_external', label: 'Rollback External Writes' },
  { key: 'rollback_state', label: 'Rollback World / State Writes' },
  { key: 'discard_structural', label: 'Discard Structural Commands' },
  { key: 'restore_snapshot', label: 'Restore Snapshot / Checkpoints' },
];

export function createPhase(phaseId) {
  return {
    phase_id: phaseId,
    enabled: phaseId === 'on_apply',
    pre_action_graph_ids: [],
    main: { mode: 'none' },
    post_action_graph_ids: [],
    listeners: [],
  };
}

export function createDefaultPhases() {
  return PHASE_IDS.map(createPhase);
}

export function createDefaultResponseChain() {
  return {
    enabled: false,
    max_depth: 3,
    max_responses: 8,
    root_budget: 16,
    dedupe_by_correlation: true,
    entries: [],
  };
}

/** 读取（或补齐）某 phase 的绑定 */
export function getPhase(phases, phaseId) {
  return (phases || []).find(p => p.phase_id === phaseId) || createPhase(phaseId);
}

/** 按固定顺序归一化 phases，兼容缺失阶段的旧记录 */
export function normalizePhases(phases) {
  return PHASE_IDS.map(id => getPhase(phases, id));
}