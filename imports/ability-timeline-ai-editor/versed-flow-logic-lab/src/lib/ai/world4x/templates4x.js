// 4X 模板图 —— 一切 Action/Condition 的"实现"，全部是 GraphVM 图（可追溯到具体节点）。
// 这些图与用户在 Graph 编辑器里创建的图完全同构，可被同名覆盖。

import './nodes4x.js';

// ── 图构建辅助（声明式小 DSL，减少手写 JSON 噪音） ──
const n = (id, type, props) => ({ id, type, ...(props ? { props } : {}) });
const l = (f, fp, t, tp) => ({ from: [f, fp], to: [t, tp] });
// 执行链：start → [节点...] → exit；节点可声明 failed 出口 → exitFail
function chainGraph(name, kind, command, execNodes, dataNodes = [], dataLinks = [], extra = {}) {
  const nodes = [n('start', 'flow.start'), ...execNodes, ...dataNodes, n('ok', 'flow.exit', { status: 'success' }), n('bad', 'flow.exit', { status: 'failure' })];
  const links = [];
  let prev = 'start';
  for (const en of execNodes) {
    links.push(l(prev, prev === 'start' ? 'then' : 'then', en.id, 'exec'));
    if (NODE_EXEC_FAILED.has(en.type)) links.push(l(en.id, 'failed', 'bad', 'exec'));
    prev = en.id;
  }
  links.push(l(prev, 'then', 'ok', 'exec'));
  return { name, kind, command, inputs: extra.inputs || [], outputs: [], nodes, links: [...links, ...dataLinks] };
}
const NODE_EXEC_FAILED = new Set(['wx.foundCity', 'wx.attackTarget', 'wx.sabotage', 'wx.treaty', 'wx.gift', 'wx.fortify']);

export const TEMPLATES_4X = [
  // ── 扩张 ──
  chainGraph('cmd.goto_site', 'action', 'goto_site',
    [n('go', 'wx.gotoXY'), n('mark', 'kb.wsSet', { bit: 'at_site' })],
    [n('site', 'wx.bestCitySite')],
    [l('site', 'x', 'go', 'x'), l('site', 'y', 'go', 'y')]),
  chainGraph('cmd.found_city', 'action', 'found_city', [n('f', 'wx.foundCity')]),
  chainGraph('cmd.goto_own_city', 'action', 'goto_own_city',
    [n('go', 'wx.gotoXY'), n('mark', 'kb.wsSet', { bit: 'at_own_city' })],
    [n('c', 'wx.nearestOwnCity')],
    [l('c', 'x', 'go', 'x'), l('c', 'y', 'go', 'y')]),

  // ── 开发（工人） ──
  ...['farm', 'mine', 'market', 'barracks', 'walls'].map((b) =>
    chainGraph(`cmd.build_${b}`, 'action', `build_${b}`, [n('b', 'wx.buildImprovement', { building: b })])),

  // ── 生产（城市队列，阵营级） ──
  ...['settler', 'worker', 'warrior', 'catapult', 'scout', 'spy', 'diplomat', 'caravan'].map((u) =>
    chainGraph(`cmd.train_${u}`, 'action', `train_${u}`, [n('q', 'wx.enqueue', { item: u })])),

  // ── 侦察 ──
  {
    name: 'cmd.scout_north', kind: 'action', command: 'scout_north',
    inputs: [], outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('sx', 'wx.selfX'), n('one', 'data.const', { value: 1 }),
      n('go', 'wx.gotoXY'),
      n('mark', 'kb.wsSet', { bit: 'north_scouted' }),
      n('ok', 'flow.exit', { status: 'success' }), n('bad', 'flow.exit', { status: 'failure' }),
    ],
    links: [
      l('start', 'then', 'go', 'exec'),
      l('sx', 'value', 'go', 'x'), l('one', 'value', 'go', 'y'),
      l('go', 'then', 'mark', 'exec'),
      l('mark', 'then', 'ok', 'exec'),
    ],
  },

  // ── 隐秘行动（间谍小队 FSM 用） ──
  chainGraph('cmd.sneak_enemy', 'action', 'sneak_enemy',
    [n('go', 'wx.gotoXY'), n('mark', 'kb.wsSet', { bit: 'spy_in_position' })],
    [n('c', 'wx.nearestEnemyCity')],
    [l('c', 'x', 'go', 'x'), l('c', 'y', 'go', 'y')]),
  chainGraph('cmd.sabotage', 'action', 'sabotage', [n('s', 'wx.sabotage'), n('w', 'kb.wsSet', { bit: 'enemy_weak' })]),

  // ── 战争（小队 BT 用） ──
  chainGraph('cmd.besiege', 'action', 'besiege', [n('b', 'wx.besiege')]),
  chainGraph('cmd.attack_adjacent', 'action', 'attack_adjacent', [n('a', 'wx.attackTarget')]),
  chainGraph('cmd.fortify', 'action', 'fortify', [n('f', 'wx.fortify')]),
  chainGraph('cmd.heal', 'action', 'heal', [n('h', 'wx.heal')]),
  chainGraph('cmd.garrison', 'action', 'garrison',
    [n('go', 'wx.gotoXY'), n('f', 'wx.fortify')],
    [n('c', 'wx.nearestOwnCity')],
    [l('c', 'x', 'go', 'x'), l('c', 'y', 'go', 'y')]),

  // ── 外交（阵营级；目标阵营由图输入 faction 传入） ──
  ...[
    ['declare_war', 'declare_war'], ['propose_alliance', 'accept_alliance'], ['make_peace', 'make_peace'],
  ].map(([cmd, ev]) => ({
    name: `cmd.${cmd}`, kind: 'action', command: cmd,
    inputs: [{ key: 'faction', type: 'number', default: 0 }], outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('fi', 'data.input', { key: 'faction' }),
      n('t', 'wx.treaty', { event: ev }),
      n('ok', 'flow.exit', { status: 'success' }), n('bad', 'flow.exit', { status: 'failure' }),
    ],
    links: [
      l('start', 'then', 't', 'exec'),
      l('fi', 'value', 't', 'targetFaction'),
      l('t', 'then', 'ok', 'exec'), l('t', 'failed', 'bad', 'exec'),
    ],
  })),
  {
    name: 'cmd.send_gift', kind: 'action', command: 'send_gift',
    inputs: [{ key: 'faction', type: 'number', default: 0 }], outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('fi', 'data.input', { key: 'faction' }),
      n('g', 'wx.gift', { amount: 20 }),
      n('ok', 'flow.exit', { status: 'success' }), n('bad', 'flow.exit', { status: 'failure' }),
    ],
    links: [
      l('start', 'then', 'g', 'exec'),
      l('fi', 'value', 'g', 'targetFaction'),
      l('g', 'then', 'ok', 'exec'), l('g', 'failed', 'bad', 'exec'),
    ],
  },
  // 建立使馆 = 定点外交设施：外交官到位后关系 +10 并置位
  {
    name: 'cmd.embassy', kind: 'action', command: 'embassy',
    inputs: [{ key: 'faction', type: 'number', default: 0 }],
    outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('fi', 'data.input', { key: 'faction' }),
      n('g', 'wx.gift', { amount: 10 }),
      n('mark', 'kb.wsSet', { bit: 'embassy_qi' }),
      n('ok', 'flow.exit', { status: 'success' }), n('bad', 'flow.exit', { status: 'failure' }),
    ],
    links: [
      l('start', 'then', 'g', 'exec'),
      l('fi', 'value', 'g', 'targetFaction'),
      l('g', 'then', 'mark', 'exec'), l('g', 'failed', 'bad', 'exec'),
      l('mark', 'then', 'ok', 'exec'),
    ],
  },
  // 商队贸易：去最近的非己方城市 → 送礼(=贸易收益) → 回家
  chainGraph('cmd.trade_route', 'action', 'trade_route',
    [n('go', 'wx.gotoXY'), n('g', 'wx.gift', { amount: 15 }), n('back', 'wx.gotoXY')],
    [n('c', 'wx.nearestEnemyCity'), n('home', 'wx.nearestOwnCity')],
    [
      l('c', 'x', 'go', 'x'), l('c', 'y', 'go', 'y'),
      l('home', 'x', 'back', 'x'), l('home', 'y', 'back', 'y'),
    ]),

  // ── 通用 ──
  chainGraph('cmd.wait', 'action', 'wait', [n('d', 'flow.delay')], [], []),

  // ── 条件模板（BT/FSM 复用） ──
  {
    name: 'cond.under_attack', kind: 'condition',
    inputs: [], outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('c', 'kb.memCount', { type: 'attacked', within: 3 }),
      n('gt', 'data.compare', { op: '>' }),
      n('e', 'flow.exit', { status: 'success' }),
    ],
    links: [
      l('start', 'then', 'e', 'exec'),
      l('c', 'value', 'gt', 'a'),
      l('gt', 'value', 'e', 'value'),
    ],
  },
  {
    name: 'cond.enemy_city_adjacent', kind: 'condition',
    inputs: [], outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('c', 'wx.nearestEnemyCity'),
      n('two', 'data.const', { value: 2 }),
      n('lt', 'data.compare', { op: '<=' }),
      n('e', 'flow.exit', { status: 'success' }),
    ],
    links: [
      l('start', 'then', 'e', 'exec'),
      l('c', 'dist', 'lt', 'a'), l('two', 'value', 'lt', 'b'),
      l('lt', 'value', 'e', 'value'),
    ],
  },
  {
    name: 'cond.hp_low', kind: 'condition',
    inputs: [], outputs: [],
    nodes: [
      n('start', 'flow.start'),
      n('hp', 'wx.selfHp'),
      n('lim', 'data.const', { value: 8 }),
      n('lt', 'data.compare', { op: '<' }),
      n('e', 'flow.exit', { status: 'success' }),
    ],
    links: [
      l('start', 'then', 'e', 'exec'),
      l('hp', 'value', 'lt', 'a'), l('lim', 'value', 'lt', 'b'),
      l('lt', 'value', 'e', 'value'),
    ],
  },
];
