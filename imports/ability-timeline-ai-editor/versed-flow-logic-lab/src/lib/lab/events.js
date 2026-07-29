// 领域事件总线 —— 引擎只 emit(state, type, payload)，不认识日志文案、fx 词汇、飘字、统计口径。
// 四个适配器在此订阅：LOG（事件→日志）、FX（事件→场景特效）、NOTICE（事件→世界内飘字）、STATS（事件→计数）。
// 好处：领域纯净；events 数组本身就是可回放的事件流。
import { ABILITY_DEFS } from './abilityDefs';

const L = (id) => ABILITY_DEFS[id]?.label || id;

const describeCmd = (cmd) => {
  if (cmd.type === 'move') return `移动 (${cmd.x.toFixed(1)}, ${cmd.z.toFixed(1)})`;
  if (cmd.type === 'attack') return `攻击 ${cmd.targetId}${cmd.auto ? '（autocast）' : ''}`;
  if (cmd.type === 'attackmove') return `A-move (${cmd.x.toFixed(1)}, ${cmd.z.toFixed(1)})`;
  if (cmd.type === 'patrol') return `巡逻（${cmd.points.length} 点循环）`;
  if (cmd.type === 'follow') return `跟随 ${cmd.targetId}`;
  const P = cmd.params || {};
  const suffix = P.targetId ? ` → ${P.targetId}${P.origin === 'auto' ? '（自动）' : ''}`
    : P.kind === 'point' ? ` @ (${P.x.toFixed(1)}, ${P.z.toFixed(1)})`
      : P.kind === 'direction' ? '（方向快照）' : '';
  return `施放 ${L(cmd.id)}${suffix}`;
};

const SRC_LABEL = { instant: '立即', 'from-buffer': '从缓冲触发', 'from-queue': '从队列执行', resumed: '打断后恢复' };

// event type → (payload) => [logType, text] | null（null = 不记日志）
const LOG = {
  command_replaced: (p) => ['cmd', `${p.unitId} ${describeCmd(p.cmd)}（替换队列）`],
  command_inserted: (p) => ['cmd', `${p.unitId} ${describeCmd(p.cmd)}（插入队首，保留原队列）`],
  command_queued: (p) => ['queue', `${p.unitId} 预约 ${describeCmd(p.cmd)}（队列 ${p.queueLen}）`],
  queue_full: (p) => ['drop', `${p.unitId} 队列已满，忽略 ${describeCmd(p.cmd)}`],
  stopped: (p) => ['end', `${p.unitId} 停止：清空队列与缓冲`],
  ability_cancelled: (p) => ['end', `${p.unitId} ${L(p.abilityId)} 施法被取消`],
  ability_interrupted: (p) => ['end', `${p.unitId} ${L(p.abilityId)} 被新指令打断（${{ drop: '丢弃', restart: '稍后重来', resume: '稍后续跑' }[p.policy]}）`],
  forced_interrupt: (p) => ['end', `${p.unitId} ${L(p.abilityId)} 被 ${p.tag} 强制打断（${{ drop: '丢弃', restart: '稍后重来', resume: '稍后续跑' }[p.policy]}）`],
  stance_changed: (p) => ['cmd', `${p.unitId} 姿态 → ${p.stance}（${p.source === 'transition' ? '事件转移' : '手动切换'}）`],
  autocast_engaged: (p) => ['cmd', `${p.unitId} [${p.stance}] autocast ${L(p.ability)} → ${p.targetId}（${p.trigger === 'damaged' ? '还击' : '视野接战'}）`],
  attackmove_armed: () => ['cmd', 'A-move 就绪：点击地面下达攻击移动'],
  patrol_armed: () => ['cmd', '巡逻就绪：点击地面设巡逻点（Shift+点击追加路点）'],
  patrol_point_added: (p) => ['queue', `巡逻路线追加路点（共 ${p.count} 点）`],
  plan_started: () => ['cmd', '计划模式：按住 Z 布置指令（只入队不执行）'],
  plan_executed: (p) => ['cmd', `计划执行：${p.count} 条指令按序运行`],
  guard_returned: (p) => ['end', `${p.unitId} 警戒归位（回到锚点）`],
  attackmove_arrived: (p) => ['end', `${p.unitId} A-move 到达 (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`],
  tag_applied: (p) => ['hit', `${L(p.abilityId)} 对 ${p.targetId} 附加 ${p.tag}（${p.duration}s）`],
  control_switched: (p) => ['cmd', `切换控制 → ${p.unitId}（阵营 ${p.team}）`],
  target_selected: (p) => ['cmd', `选中候选目标 ${p.targetId}`],
  cast_armed: (p) => ['cmd', `${L(p.abilityId)} 进入待确认态（${p.mode === 'confirm' ? '等待点击确认' : '抬起施放'}）`],
  cast_committed: (p) => ['cmd', `${L(p.abilityId)} 确认 → 提交施法请求`],
  cast_cancelled: (p) => ['end', `${L(p.abilityId)} 待确认态取消（${p.reason}）`],
  smart_routed: (p) => ['cmd', `智能指令（${{ enemy: '敌方', ally: '友方', ground: '地面' }[p.kind]}）→ ${p.decision === 'ability' ? L(p.ability) : { move: '移动', attack: '攻击', follow: '跟随' }[p.decision]}`],
  heal_applied: (p) => ['hit', `${L(p.abilityId)} 治疗 ${p.targetId}（+${p.amount}）`],
  follow_done: (p) => ['end', `跟随结束（${p.targetId} 已失联）`],
  skill_bound: (p) => ['cmd', p.targetId
    ? `${p.unitId} ${L(p.abilityId)} 候选目标绑定 → ${p.targetId}`
    : `${p.unitId} ${L(p.abilityId)} 候选目标解绑（无悬停/选中敌人）`],
  needs_unit_drop: (p) => ['drop', `${L(p.abilityId)} payload 必须要求对象，黑板内无候选，取消`],
  point_fallback: (p) => ['cmd', `${L(p.abilityId)} 无对象候选 → 降级为点施`],
  track_snapped: (p) => ['cmd', `${L(p.abilityId)} 追踪吸附 → ${p.targetId}（效果层补正）`],
  out_of_range_drop: (p) => ['drop', `${L(p.abilityId)} 超出射程（偏好：不接近），取消`],
  approach_started: (p) => ['cmd', `${L(p.abilityId)} 超出射程 → 接近${p.ref}中（Approach）`],
  memory_chase: (p) => ['cmd', `${L(p.abilityId)} 目标 ${p.targetId} 脱离视野 → 追往最后目击点（记忆快照）`],
  reacquired: (p) => ['cmd', `${L(p.abilityId)} 目标失效 → 执行期重决议 ${p.targetId}`],
  target_lost: (p) => ['end', `${L(p.abilityId)} 目标丢失，取消`],
  ability_activated: (p) => p.abilityId === 'atk' ? null
    : [p.source === 'from-queue' ? 'instant' : p.source, `${p.unitId} ${L(p.abilityId)} 激活（${SRC_LABEL[p.source] || p.source}）`],
  stage_advanced: (p) => ['instant', `${L(p.abilityId)} 进入${p.stageName}`],
  ability_ended: (p) => p.abilityId === 'atk' ? null : ['end', `${p.unitId} ${L(p.abilityId)} 结束`],
  channel_released: (p) => ['end', `${p.unitId} ${L(p.abilityId)} 松开按键，提前结束（${p.elapsed.toFixed(2)}s）`],
  repeat_released: (p) => ['end', `${p.unitId} ${L(p.abilityId)} 松开：本轮打完后停止`],
  cycle_repeated: (p) => ['instant', `${L(p.abilityId)} 按住续轮${p.targetId ? ` → ${p.targetId}（重新决议）` : ''}`],
  combo_queued: (p) => ['queue', `${L(p.abilityId)} 预约第 ${p.stage} 段`],
  input_buffered: (p) => ['buffer', `${L(p.abilityId)} 进入输入缓冲`],
  buffer_full_drop: (p) => ['drop', `${L(p.abilityId)} 丢弃（缓冲已满）`],
  buffer_expired: (p) => ['drop', `${L(p.abilityId)} 缓冲过期丢弃`],
  search_resolved: (p) => ['cmd', `${L(p.abilityId)} 效果搜索（半径 ${p.radius}·${p.pick === 'lowest_hp' ? '最低血量' : '最近'}）→ ${p.targetId}`],
  swing_missed: (p) => ['end', `${L(p.abilityId)} 挥空`],
  damage_applied: (p) => ['hit', `${L(p.abilityId)} 命中 ${p.targetId}（-${p.amount}）`],
  unit_downed: (p) => ['hit', `${p.unitId} 被击倒`],
  projectile_fired: (p) => ['hit',
    p.kind === 'homing' ? `${L(p.abilityId)} 发射追踪弹道 → ${p.targetId}（追踪）`
      : p.kind === 'straight_at' ? `${L(p.abilityId)} 直线弹道 → ${p.targetId} 当前位置（不追踪）`
        : `${L(p.abilityId)} 朝面向发射直线弹道`],
  projectile_missed: (p) => ['end', `${L(p.abilityId)} 直线弹道射失`],
  move_arrived: (p) => ['end', `${p.unitId} 到达 (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`],
  attack_done: (p) => ['end', `攻击指令完成（${p.targetId} 已失联/倒下）`],
};

// event type → (payload) => fx 对象（场景消费）
let fxId = 0;
const FX = {
  damage_applied: (p) => ({ type: 'hit', x: p.x, z: p.z }),
  tag_applied: (p) => ({ type: 'hit', x: p.x, z: p.z }),
  heal_applied: (p) => ({ type: 'hit', x: p.x, z: p.z }),
  swing_performed: (p) => ({ type: 'swing', x: p.x, z: p.z, dx: p.dx, dz: p.dz, range: p.range }),
  pulse_performed: (p) => ({ type: 'pulse', x: p.x, z: p.z, radius: p.radius }),
  projectile_impact: (p) => ({ type: 'hit', x: p.x, z: p.z }),
};

// event type → 世界内飘字（拒绝/失效反馈必须出现在战场上，不能只在侧栏日志）
let noticeId = 0;
const NOTICE = {
  needs_unit_drop: (p) => ({ unitId: p.unitId, text: `${L(p.abilityId)}：无候选目标` }),
  out_of_range_drop: (p) => ({ unitId: p.unitId, text: `${L(p.abilityId)}：超出射程` }),
  target_lost: (p) => ({ unitId: p.unitId, text: `${L(p.abilityId)}：目标丢失` }),
  buffer_full_drop: (p) => ({ unitId: p.unitId, text: `${L(p.abilityId)}：缓冲已满` }),
  queue_full: (p) => ({ unitId: p.unitId, text: '队列已满' }),
  ability_cancelled: (p) => ({ unitId: p.unitId, text: `${L(p.abilityId)}：已取消` }),
  ability_interrupted: (p) => (p.policy === 'drop' ? { unitId: p.unitId, text: `${L(p.abilityId)}：被打断` } : null),
  forced_interrupt: (p) => ({ unitId: p.unitId, text: `${L(p.abilityId)}：被${p.tag === 'State.Stunned' ? '眩晕' : '硬控'}打断！` }),
};

// event type → stats 计数字段
const STATS = {
  ability_activated: 'executed',
  input_buffered: 'buffered',
  needs_unit_drop: 'dropped',
  out_of_range_drop: 'dropped',
  buffer_full_drop: 'dropped',
  buffer_expired: 'dropped',
  target_lost: 'dropped',
};

export function emit(state, type, payload = {}) {
  const logFmt = LOG[type];
  if (logFmt) {
    const entry = logFmt(payload);
    if (entry) {
      state.events.unshift({ t: state.time, type: entry[0], text: entry[1] });
      if (state.events.length > 60) state.events.pop();
    }
  }
  const fxFmt = FX[type];
  if (fxFmt) state.fx.push({ id: fxId++, ...fxFmt(payload) });
  const n = NOTICE[type]?.(payload);
  if (n && state.notices) state.notices.push({ id: noticeId++, at: state.time, ...n });
  const stat = STATS[type];
  if (stat) state.stats[stat]++;
}