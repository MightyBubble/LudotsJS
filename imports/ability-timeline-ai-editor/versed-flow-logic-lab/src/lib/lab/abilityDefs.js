// 技能数据定义 —— 纯数据，加技能不需要改任何引擎代码。
//
// Ability / Effect 分离（SC2 风格）：
//   Ability — cast 只声明"施法参数"的获取方式：unit / point / direction
//   Effect  — timeline 触发的命中逻辑链（注册表见 effects.js）
//
// 三种距离（互不相同）：
//   cast.range     — 施放距离（超出时接近/取消）
//   acquire.range  — 候选目标纳入范围（自动取目标，候选必然来自单位黑板）
//   effect 内 range/radius — 效果作用距离
//
// 冷却 = 限时标签：激活时授予 Cooldown.<id>，门禁复用 blockedBy（无独立冷却系统）。
//
// tracks — 轨道占用声明（互斥槽是数据，引擎只认轨道 ID）：
//   同轨互斥、异轨并行（边走边打）。move 占 ['legs']，射击类占 ['arms']，全身技能占 ['legs','arms']。
//   "施法中"由轨道占用承担（blockedBy 不再声明 State.Ability）；跨轨约束走标签门禁。
// queueMode — 'replace' 不按 Shift 下达即清空队列；'interleave' 插入队首、保留原队列（SC2 式穿插）。
//
// castMode — ③确认层的 commit 边沿声明（仅非引导技能可选）：
//   'instant'   按下即施放（LOL 无指示器智能施法）
//   'onRelease' 按下显示指示器，抬起施放（LOL 带指示器智能施法）
//   'confirm'   按下进入目标选择态，下一次点击施放（WAR3 传统模式）
//
// rebind — 参数重绑定策略（统一词汇表，取代旧 steer/reacquire 布尔）：
//   { direction: 'tick' }    引导中方向逐帧重绑（跟随鼠标；旧 steer）
//   { target: 'onInvalid' }  自动来源目标失效时重决议（旧 reacquire）
//   缺省 = 'commit'（下达瞬间定格一次）；'round' 由 channel:'repeat' 结构承担
//
// targetFilter — 目标阵营声明：'enemy'（默认）/ 'ally'（如治疗）。
//
// onInterrupt — 打断策略（施法中来了新指令怎么办，per 技能）：
//   'none'    不可打断（默认）：新指令排在施法结束后
//   'drop'    打断丢弃：施法作废
//   'restart' 打断后重来：施法重新入队（排在新指令后），从头再放
//   'resume'  打断后续跑：挂起进度快照重新入队，新指令完成后从中断处继续（不重付冷却）
//
// interrupt — 受迫打断声明（tag 语义，与主动打断 onInterrupt 共用策略词）：
//   { by: [硬控标签], policy: 'drop' | 'restart' | 'resume' }
//   打断者（眩晕等效果）只打标签，永不直接碰别人的施法状态；
//   引擎每 tick 检查执行中技能的 interrupt.by 过滤器，命中即按 policy 挂起。
//   缺省 = { by: ['State.Stunned'], policy: 'drop' }（引擎 DEFAULT_INTERRUPT）。
//
// acquire.selector — 蓝图式选目标 graph（节点词汇见 targetSelector.js，仅两类）：
//   filters        硬条件门（requireTag / forbidTag / hpBelow / hpAbove），不满足直接出局
//   considerations utility 曲线（input 归一化 × curve formula × weight），加权平均取最高分
//   缺省由 acquire.pick 推导（nearest→distance / lowest_hp→hp 的 inverse 曲线）
//
// command — 技能的指令名（指令模式）：决策层（BT/FSM/Utility/GOAP/HTN/玩家输入）只下达
//   Command(command, params)；实现 = 绑定了同名 command 的 GraphVM 模板图（内置参考实现
//   见 abilityTemplates.js，GraphLab 里建同名图即覆盖）。实验室热路径仍走 stages/timeline
//   （SoA/0GC 不变），模板图承担"可追溯实现"——执行时逐节点留下 trace。

// 周期时间线生成器 —— 去硬编码：count/interval 是数据，不再手写 N 条重复条目
const pulses = (count, interval, effect, lead = 0.4) =>
  Array.from({ length: count }, (_, i) => ({ t: lead + i * interval, effect }));

// cast.channel —— 三种引导原型（终止条件/效果节奏/目标重决议各不相同）：
//   'burst'  固定时长周期触发，参数激活时冻结（可配 hold 提前结束）
//   'repeat' 按住持续施法：松开前每轮重新做一次完整目标决议（微型 order），松开后打完当前轮
//   'beam'   持续激光：逐 tick 连续作用（stage.beam），目标实时追踪可失效重取，松开立即断
export const ABILITY_DEFS = {
  melee: {
    label: '近战斩击', input: 'Q', color: '#0ea5e9', command: 'ability.melee',
    blockedBy: ['Cooldown.melee'],
    cooldown: 1.2,
    interrupt: { by: ['State.Stunned'], policy: 'resume' },
    cast: { tracks: ['legs', 'arms'], targeted: true, range: 2.2, approach: true, targetMode: 'unit', track: true, autoAcquire: true, hoverCast: false, queueMode: 'interleave', castMode: 'instant', onInterrupt: 'resume', rebind: { target: 'onInvalid' } },
    acquire: { range: 4, pick: 'nearest' },
    stages: [{
      duration: 0.7,
      grantedTags: ['State.Ability', 'Ability.Melee'],
      timeline: [{ t: 0.28, effect: { type: 'swing', damage: 30, range: 2.4 } }],
    }],
  },
  ranged: {
    label: '远程射击', input: 'W', color: '#f59e0b', command: 'ability.ranged',
    blockedBy: ['Cooldown.ranged'],
    cooldown: 2.5,
    cast: { tracks: ['arms'], targeted: true, range: 8, approach: true, targetMode: 'unit', track: true, autoAcquire: true, hoverCast: false, queueMode: 'replace', castMode: 'instant', onInterrupt: 'restart', rebind: { target: 'onInvalid' } },
    acquire: { range: 7, pick: 'lowest_hp' },
    stages: [{
      duration: 0.55,
      grantedTags: ['State.Ability', 'Ability.Ranged'],
      timeline: [{ t: 0.2, effect: { type: 'search', radius: 3, pick: 'nearest', then: { type: 'projectile', damage: 18, speed: 13 } } }],
    }],
  },
  channel: {
    label: '引导风暴', input: 'E', color: '#8b5cf6', command: 'ability.channel',
    blockedBy: ['Cooldown.channel'],
    cooldown: 5,
    cast: { tracks: ['legs', 'arms'], targeted: false, hold: true, channel: 'burst', queueMode: 'interleave', onInterrupt: 'drop' },
    stages: [{
      duration: 2.4,
      grantedTags: ['State.Ability', 'State.Channeling'],
      timeline: pulses(4, 0.5, { type: 'pulse', damage: 9, radius: 3.5 }),
    }],
  },
  repeatfire: {
    label: '按住连射', input: 'D', color: '#10b981', command: 'ability.repeatfire',
    blockedBy: ['Cooldown.repeatfire'],
    cooldown: 1.5,
    cast: { tracks: ['arms'], targeted: true, range: 7, approach: false, targetMode: 'unit', track: true, autoAcquire: true, hoverCast: false, channel: 'repeat', queueMode: 'replace', rebind: { direction: 'tick', target: 'onInvalid' } },
    acquire: { range: 6, pick: 'nearest' },
    stages: [{
      duration: 0.35,
      grantedTags: ['State.Ability', 'Ability.RepeatFire'],
      timeline: [{ t: 0.15, effect: { type: 'projectile', damage: 7, speed: 14 } }],
    }],
  },
  beam: {
    label: '持续激光', input: 'F', color: '#ec4899', command: 'ability.beam',
    blockedBy: ['Cooldown.beam'],
    cooldown: 4,
    cast: { tracks: ['arms'], targeted: true, range: 6, approach: true, targetMode: 'unit', track: true, autoAcquire: true, hoverCast: false, hold: true, channel: 'beam', queueMode: 'interleave', rebind: { direction: 'tick', target: 'onInvalid' } },
    acquire: { range: 6, pick: 'nearest' },
    stages: [{
      duration: 3,
      grantedTags: ['State.Ability', 'State.Channeling'],
      beam: { tick: 0.5, damagePerTick: 8, range: 6.5 },
      timeline: [],
    }],
  },
  combo: {
    label: '三连击', input: 'R', color: '#ef4444', command: 'ability.combo',
    blockedBy: ['Cooldown.combo'],
    cooldown: 3.5,
    interrupt: { by: ['State.Stunned'], policy: 'restart' },
    cast: { tracks: ['legs', 'arms'], targeted: true, range: 2.4, approach: false, targetMode: 'direction', track: false, autoAcquire: true, hoverCast: false, queueMode: 'replace', castMode: 'instant', onInterrupt: 'resume', rebind: { target: 'onInvalid' } },
    acquire: { range: 3, pick: 'nearest' },
    stages: [
      {
        name: '一段', duration: 0.5,
        grantedTags: ['State.Ability', 'Ability.Combo.1'],
        timeline: [{ t: 0.2, effect: { type: 'swing', damage: 14, range: 2.4 } }],
        comboWindow: { open: 0.2, close: 0.5 },
      },
      {
        name: '二段', duration: 0.5,
        grantedTags: ['State.Ability', 'Ability.Combo.2'],
        timeline: [{ t: 0.2, effect: { type: 'swing', damage: 18, range: 2.4 } }],
        comboWindow: { open: 0.2, close: 0.5 },
      },
      {
        name: '三段', duration: 0.8,
        grantedTags: ['State.Ability', 'Ability.Combo.3'],
        timeline: [{ t: 0.35, effect: { type: 'swing', damage: 34, range: 2.7 } }],
      },
    ],
  },
  heal: {
    // 无按键绑定：仅由上下文路由触发（Role.Healer 右键残血友军）—— targetFilter 是技能数据
    label: '治疗', input: null, color: '#22c55e', command: 'ability.heal',
    blockedBy: ['Cooldown.heal'],
    cooldown: 3,
    cast: { tracks: ['arms'], targeted: true, range: 5, approach: true, targetMode: 'unit', track: false, autoAcquire: true, hoverCast: false, queueMode: 'replace', targetFilter: 'ally', rebind: {} },
    acquire: {
      range: 6, pick: 'lowest_hp',
      // 显式 selector 示例：满血友军被硬过滤出局，剩余按血量 inverse 曲线取最低
      selector: {
        filters: [{ type: 'hpBelow', ratio: 1 }],
        considerations: [{ input: 'hp', curve: { type: 'inverse' }, weight: 1 }],
      },
    },
    stages: [{
      duration: 0.6,
      grantedTags: ['State.Ability', 'Ability.Heal'],
      timeline: [{ t: 0.25, effect: { type: 'heal', amount: 25 } }],
    }],
  },
  stun: {
    // 硬控示例：效果只打标签（applyTag），受迫打断由被打断者技能的 interrupt.by 过滤器命中该标签触发
    label: '眩晕镖', input: 'T', color: '#eab308', command: 'ability.stun',
    blockedBy: ['Cooldown.stun'],
    cooldown: 4,
    cast: { tracks: ['arms'], targeted: true, range: 7, approach: true, targetMode: 'unit', track: true, autoAcquire: true, hoverCast: false, queueMode: 'replace', castMode: 'instant' },
    acquire: { range: 7, pick: 'nearest' },
    stages: [{
      duration: 0.4,
      grantedTags: ['State.Ability', 'Ability.Stun'],
      timeline: [
        { t: 0.15, effect: { type: 'applyTag', tag: 'State.Stunned', duration: 1.6 } },
        { t: 0.15, effect: { type: 'damage', amount: 5 } },
      ],
    }],
  },
  atk: {
    label: '普攻', input: null, color: '#64748b', command: 'ability.atk',
    blockedBy: ['Cooldown.atk'],
    cooldown: 0.9,
    cast: { tracks: ['arms'], targeted: true, range: 2.2, approach: true, targetMode: 'unit', track: true, autoAcquire: true, queueMode: 'replace' },
    acquire: { range: 5, pick: 'nearest' },
    stages: [{
      duration: 0.6,
      grantedTags: ['State.Ability', 'Ability.Auto'],
      timeline: [{ t: 0.25, effect: { type: 'swing', damage: 22, range: 2.2 } }],
    }],
  },
};

// 输入分层（input 与 action 分离）：
//   设备层 —— 物理输入 → InputTag（每种设备一张映射表：键盘/屏幕按钮/摇杆各自维护）
//   动作层 —— InputTag → 指令语义（只声明 press 触发什么）
// release 不进绑定表：引擎在激活时记录"激活该施法的 InputTag"，
// 松开该 InputTag 时按技能自身 hold 偏好路由（hold 是技能数据，不是绑定语义）。
export const KEYBOARD_MAP = { q: 'Input.Skill1', w: 'Input.Skill2', e: 'Input.Skill3', r: 'Input.Skill4', d: 'Input.Skill5', f: 'Input.Skill6', t: 'Input.Skill7', a: 'Input.AttackMove', p: 'Input.Patrol', z: 'Input.Plan', s: 'Input.Stop', escape: 'Input.Cancel' };
// Input.Smart（鼠标右键 → 设备层映射）走上下文路由表（contextRouting.js），不绑定固定技能
export const ACTION_BINDINGS = {
  'Input.Skill1': { action: 'order', ability: 'melee' },
  'Input.Skill2': { action: 'order', ability: 'ranged' },
  'Input.Skill3': { action: 'order', ability: 'channel' },
  'Input.Skill4': { action: 'order', ability: 'combo' },
  'Input.Skill5': { action: 'order', ability: 'repeatfire' },
  'Input.Skill6': { action: 'order', ability: 'beam' },
  'Input.Skill7': { action: 'order', ability: 'stun' },
  'Input.AttackMove': { action: 'attackmove' },
  'Input.Patrol': { action: 'patrol' },
  'Input.Plan': { action: 'plan' },
  'Input.Stop': { action: 'stop' },
  'Input.Cancel': { action: 'cancel' },
  'Input.Smart': { action: 'smart' },
};

export const ATTACK_RANGE = 1.9;
export const MOVE_SPEED = 4;
export const MAX_QUEUE = 8;
export const MEMORY_TTL = 3; // 记忆快照保留时长（秒）
export const RETALIATE_WINDOW = 4; // damaged 触发的还击记忆窗口（秒）；候选可用 within 覆盖
export const DEFAULT_ATTACK = 'atk'; // 接战指令未声明技能时的兜底（attack / A-move）
export const FREEZE_TAGS = ['State.Stunned']; // 执行槽整体冻结的标签（硬控语义）；亦是受迫打断的缺省触发
export const FOLLOW_GAP = 2; // 跟随保持距离；follow 指令可用 gap 覆盖
export const ARRIVE_EPS = 0.2; // 移动到达判定阈值