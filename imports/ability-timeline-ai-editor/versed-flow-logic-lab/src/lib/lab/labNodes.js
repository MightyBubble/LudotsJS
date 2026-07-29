// 实验室决策原语节点 —— 姿态行为图的 GraphVM 词汇（category '实验室'）。
//
// 主客观分离在图层的落点：
//   · 图节点只能经 ctx.lab（引擎门面）与 ctx.bb/mem/ws/beliefs 触碰世界；
//   · 这些节点是"决策级原语"：索敌（候选 selector 硬门+utility 评分）、闸门（施法/队列占用）、
//     锚点归位、接战（产出标准 order 进队列——执行仍在引擎 order 管道，图不直接操纵执行）。
//   · 一切判定在图内以节点连线表达：chase/leash/触发器/候选顺序都是图的结构与参数。
//
// 无 ctx.lab（GraphLab 通用演示上下文）时安全降级：found=false / casted=false / idle。
import { defineNode } from '@/lib/ai/graph/graphvm.js';

const any = (key, dflt) => ({ key, type: 'any', default: dflt });
const num = (key, dflt = 0) => ({ key, type: 'number', default: dflt });
const bool = (key, dflt = false) => ({ key, type: 'bool', default: dflt });
const pure = { execIn: false, execOut: [] };

// 候选声明 props（ability/trigger/within/selector）—— candTarget / tryParallel 共用
const CAND_SCHEMA = {
  ability: { type: 'string', default: 'atk' },
  trigger: { type: 'select', options: ['seen', 'damaged'], default: 'seen' },
  within: { type: 'number', default: 0 },
  selector: { type: 'any', default: null },
};
const candOf = (api) => {
  const c = { ability: api.prop('ability', 'atk'), trigger: api.prop('trigger', 'seen') };
  const w = api.prop('within', 0);
  if (w > 0) c.within = w;
  const sel = api.prop('selector', null);
  if (sel) c.selector = sel;
  return c;
};

// 执行闸门（pure）：idle=无施法且队列空（可自主接战）；busyQueue=无施法但队列非空（可异轨并行出手）
defineNode('lab.gates', {
  label: '执行闸门', category: '实验室', color: '#787880', ...pure,
  dataOut: [bool('idle'), bool('busyQueue')],
  eval: (p, api) => {
    const g = api.ctx?.lab?.gates?.() || { idle: false, busyQueue: false };
    api.set('idle', g.idle);
    api.set('busyQueue', g.busyQueue);
  },
});

// 锚点归位（exec 二出口）：警戒缰绳脱战后的「返回」子状态——移动由引擎执行，归位途中抑制接战
defineNode('lab.anchorReturn', {
  label: '锚点归位', category: '实验室', color: '#787880',
  execOut: ['idle', 'returning'],
  eval: (p, api) => api.ctx?.lab?.anchorReturn?.(api.dt) || 'idle',
});

// 候选索敌（pure）：'seen' 走选目标 graph（acquire 范围 ∩ 硬门 ∩ utility 评分）；
// 'damaged' 读受击黑板（还击窗口 + 攻击者在感知内 + 候选硬门）。输出 found/target/dist 三件套。
defineNode('lab.candTarget', {
  label: '候选索敌', category: '实验室', color: '#0ea5e9', ...pure,
  dataOut: [bool('found'), any('target'), num('dist', -1)],
  propsSchema: CAND_SCHEMA,
  eval: (p, api) => {
    const r = api.ctx?.lab?.candTarget?.(candOf(api)) || { found: false, target: null, dist: -1 };
    api.set('found', r.found);
    api.set('target', r.target);
    api.set('dist', r.dist);
  },
});

// 技能射程（pure）：cast.range 投影（未声明回退普攻射程）
defineNode('lab.abilityRange', {
  label: '技能射程', category: '实验室', color: '#64748b', ...pure,
  dataOut: [num('value', 0)],
  propsSchema: { ability: { type: 'string', default: 'atk' } },
  eval: (p, api) => api.set('value', api.ctx?.lab?.range?.(api.prop('ability', 'atk')) ?? 0),
});

// 接战（exec）：产出标准 attack 指令进队列（auto 来源标记），leash>0 时落锚；emit autocast_engaged。
// 图只产意图：追击/脱战/缰绳退战由 order 管道按姿态有效配置执行。
defineNode('lab.engage', {
  label: '接战（产指令）', category: '实验室', color: '#10b981',
  dataIn: [any('target'), num('leash', 0)],
  propsSchema: {
    ability: { type: 'string', default: 'atk' },
    trigger: { type: 'select', options: ['seen', 'damaged'], default: 'seen' },
    selector: { type: 'any', default: null },
  },
  eval: (p, api) => {
    const t = api.get('target');
    if (t) api.ctx?.lab?.engage?.(candOf(api), t, api.get('leash') || 0);
    return 'then';
  },
});

// 锚点信息（pure）：警戒锚点是否存在与距离 —— 供转移条件蓝图（超出缰绳/到达锚点）读取
defineNode('lab.anchor', {
  label: '锚点信息', category: '实验室', color: '#64748b', ...pure,
  dataOut: [bool('has'), num('dist', 0)],
  eval: (p, api) => {
    const a = api.ctx?.lab?.anchor?.() || { has: false, dist: 0 };
    api.set('has', a.has);
    api.set('dist', a.dist);
  },
});

// 当前姿态缰绳（pure）：当前状态有效配置的 leash（0 = 未声明）
defineNode('lab.stanceLeash', {
  label: '姿态缰绳', category: '实验室', color: '#64748b', ...pure,
  dataOut: [num('value', 0)],
  eval: (p, api) => api.set('value', api.ctx?.lab?.stanceLeash?.() ?? 0),
});

// 异轨并行出手（exec）：计划执行中候选技能轨道与队首不相交且目标在射程内 → 原地施法（不追击不动计划）
defineNode('lab.tryParallel', {
  label: '并行出手尝试', category: '实验室', color: '#10b981',
  dataOut: [bool('casted')],
  propsSchema: CAND_SCHEMA,
  eval: (p, api) => {
    api.set('casted', !!api.ctx?.lab?.tryParallel?.(candOf(api)));
    return 'then';
  },
});