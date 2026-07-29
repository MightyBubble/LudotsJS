// 4X 内容层 —— 位词汇 / 主观曲线 / Utility 集 / GOAP 动作库 / HTN 域 / 战术 BT·FSM。
// 全部是数据：改内容不改引擎（引擎 = graphvm/knowledge/belief/utility/goap/htn/bt/fsm）。

// ── WorldState 位词汇（GOAP/HTN 的事实语言，纯 bit） ──
export const WS_BITS = [
  // 经济
  'has_city', 'has_2cities', 'has_3cities', 'farm_built', 'mine_built', 'market_built',
  'barracks_built', 'walls_built', 'trade_route_active',
  // 军备
  'has_army', 'has_siege', 'has_spy', 'has_diplomat', 'has_caravan', 'has_scout', 'army_healthy',
  // 认知（客观事实：侦察完成/敌城被发现——主观判断走 belief）
  'north_scouted', 'enemy_city_known', 'enemy_weak', 'capital_safe',
  // 外交
  'at_war', 'allied_qi', 'embassy_qi', 'embassy_chu',
  // 单位局部（与阵营共享位组；原型规模下可接受）
  'at_site', 'at_own_city', 'spy_in_position',
  // 终局
  'north_conquered',
];

// ── 主观认识（Belief）：黑板客观数据 → 0..1 主观标量的映射曲线 ──
export const BELIEF_DEFS = [
  { key: 'threat', source: 'mem:attacked:20', norm: { type: 'range', min: 0, max: 4 }, curve: { type: 'logistic', slope: -1, xShift: -0.1, yShift: 1 }, smoothing: 0.3 },
  { key: 'opportunity', source: 'ws:enemy_weak', norm: { type: 'bool' }, curve: { type: 'linear', slope: 1, yShift: 0 } },
  { key: 'hostility', source: 'bb:min_relation', norm: { type: 'range', min: 50, max: -100 }, curve: { type: 'logistic', slope: -1, xShift: 0, yShift: 1 }, smoothing: 0.2 },
  { key: 'prosperity', source: 'bb:gold', norm: { type: 'range', min: 0, max: 120 }, curve: { type: 'exponential', exponent: 0.7 } },
  { key: 'military_edge', source: 'bb:army_count', norm: { type: 'range', min: 0, max: 6 }, curve: { type: 'logistic', slope: -1, xShift: -0.15, yShift: 1 }, smoothing: 0.3 },
  { key: 'expansion_room', source: 'bb:city_count', norm: { type: 'range', min: 3, max: 0 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
];

// ── Utility 集（参考项目语义：归一化×响应曲线×乘积×补偿因子×动量） ──
export const UTILITY_SETS = {
  // 战略层：HTN method 选择器 + GOAL 切换
  grand_strategy: {
    name: 'grand_strategy', compensation: true, momentum: 1.15,
    makers: [{
      id: 'strategy', name: '战略抉择',
      decisions: [
        {
          id: 'conquer_north', name: '征服北方', weight: 1.2, noTarget: true,
          considerations: [
            { name: '军事优势', source: 'belief:military_edge', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.1, yShift: 1 } },
            { name: '敌方虚弱', source: 'belief:opportunity', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0.35 } },
            { name: '敌意', source: 'belief:hostility', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0.2 } },
          ],
        },
        {
          id: 'economic_boom', name: '经济繁荣', weight: 1.0, noTarget: true,
          considerations: [
            { name: '扩张空间', source: 'belief:expansion_room', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.2, yShift: 1 } },
            { name: '低威胁', source: 'belief:threat', norm: { type: 'range', min: 1, max: 0 }, curve: { type: 'linear', slope: 1, yShift: 0.1 } },
          ],
        },
        {
          id: 'diplomatic_play', name: '外交纵横', weight: 0.9, noTarget: true,
          considerations: [
            { name: '繁荣', source: 'belief:prosperity', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.1, yShift: 1 } },
            { name: '军事不足', source: 'belief:military_edge', norm: { type: 'range', min: 1, max: 0.3 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
          ],
        },
      ],
    }],
  },

  // 外交层：远交近攻 = 曲线形状的涌现
  diplomacy: {
    name: 'diplomacy', compensation: true, momentum: 1.2,
    makers: [{
      id: 'foreign', name: '外交决策',
      decisions: [
        {
          id: 'propose_alliance', name: '提议结盟', weight: 1.0, targetFilter: 'any',
          considerations: [
            { name: '远（远交）', source: 'dist', norm: { type: 'range', min: 4, max: 18 }, curve: { type: 'logistic', slope: -1, xShift: -0.1, yShift: 1 } },
            { name: '对方强大', source: 'target:power', norm: { type: 'range', min: 10, max: 60 }, curve: { type: 'exponential', exponent: 1.5 } },
            { name: '关系尚可', source: 'target:rel', norm: { type: 'range', min: -30, max: 60 }, curve: { type: 'logistic', slope: -1, xShift: -0.2, yShift: 1 } },
          ],
          command: { name: 'propose_alliance' },
        },
        {
          id: 'declare_war', name: '宣战', weight: 1.1, targetFilter: 'any',
          considerations: [
            { name: '近（近攻）', source: 'dist', norm: { type: 'range', min: 18, max: 5 }, curve: { type: 'logistic', slope: -1, xShift: -0.1, yShift: 1 } },
            { name: '对方虚弱', source: 'target:power', norm: { type: 'range', min: 50, max: 15 }, curve: { type: 'exponential', exponent: 1.3 } },
            { name: '关系恶劣', source: 'target:rel', norm: { type: 'range', min: 40, max: -60 }, curve: { type: 'logistic', slope: -1, xShift: 0, yShift: 1 } },
            { name: '我方优势', source: 'belief:military_edge', norm: { type: 'range', min: 0.2, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
          ],
          command: { name: 'declare_war' },
        },
        {
          id: 'send_gift', name: '赠送礼金', weight: 0.7, targetFilter: 'any',
          considerations: [
            { name: '金库充裕', source: 'belief:prosperity', norm: { type: 'range', min: 0.3, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
            { name: '关系待修复', source: 'target:rel', norm: { type: 'range', min: 20, max: -20 }, curve: { type: 'logistic', slope: -1, xShift: 0, yShift: 1 } },
          ],
          command: { name: 'send_gift' },
        },
        {
          id: 'make_peace', name: '提议议和', weight: 0.8, targetFilter: 'any',
          considerations: [
            { name: '高威胁', source: 'belief:threat', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.2, yShift: 1 } },
            { name: '军事劣势', source: 'belief:military_edge', norm: { type: 'range', min: 0.8, max: 0.1 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
          ],
          command: { name: 'make_peace' },
        },
      ],
    }],
  },

  // 中观层：城市建设优先级
  city_build: {
    name: 'city_build', compensation: true, momentum: 1.1,
    makers: [{
      id: 'build', name: '建造决策',
      decisions: [
        { id: 'build_farm', name: '农场', weight: 1, noTarget: true, command: { name: 'build_farm' }, considerations: [{ name: '缺农场', source: 'ws:farm_built', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }, { name: '扩张空间', source: 'belief:expansion_room', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0.2 } }] },
        { id: 'build_mine', name: '矿场', weight: 1, noTarget: true, command: { name: 'build_mine' }, considerations: [{ name: '缺矿场', source: 'ws:mine_built', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }] },
        { id: 'build_market', name: '市场', weight: 0.9, noTarget: true, command: { name: 'build_market' }, considerations: [{ name: '缺市场', source: 'ws:market_built', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }, { name: '繁荣', source: 'belief:prosperity', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0.2 } }] },
        { id: 'build_barracks', name: '兵营', weight: 0.95, noTarget: true, command: { name: 'build_barracks' }, considerations: [{ name: '缺兵营', source: 'ws:barracks_built', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }, { name: '威胁', source: 'belief:threat', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0.3 } }] },
        { id: 'build_walls', name: '城墙', weight: 0.85, noTarget: true, command: { name: 'build_walls' }, considerations: [{ name: '缺城墙', source: 'ws:walls_built', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }, { name: '高威胁', source: 'belief:threat', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.2, yShift: 1 } }] },
        { id: 'train_settler', name: '训练定居者', weight: 1.05, noTarget: true, command: { name: 'train_settler' }, considerations: [{ name: '扩张空间', source: 'belief:expansion_room', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.15, yShift: 1 } }, { name: '低威胁', source: 'belief:threat', norm: { type: 'range', min: 1, max: 0 }, curve: { type: 'linear', slope: 1, yShift: 0.1 } }] },
        { id: 'train_warrior', name: '训练勇士', weight: 1.0, noTarget: true, command: { name: 'train_warrior' }, considerations: [{ name: '威胁', source: 'belief:threat', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'logistic', slope: -1, xShift: -0.15, yShift: 1 } }, { name: '军事不足', source: 'belief:military_edge', norm: { type: 'range', min: 1, max: 0.3 }, curve: { type: 'linear', slope: 1, yShift: 0.2 } }] },
        { id: 'train_spy', name: '训练间谍', weight: 0.8, noTarget: true, command: { name: 'train_spy' }, considerations: [{ name: '敌意', source: 'belief:hostility', norm: { type: 'range', min: 0.2, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0 } }, { name: '无间谍', source: 'ws:has_spy', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }] },
        { id: 'train_caravan', name: '训练商队', weight: 0.85, noTarget: true, command: { name: 'train_caravan' }, considerations: [{ name: '繁荣', source: 'belief:prosperity', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0.1 } }, { name: '无商队', source: 'ws:has_caravan', norm: { type: 'bool' }, curve: { type: 'linear', slope: -1, yShift: 1 } }] },
      ],
    }],
  },
};

// ── GOAP 动作库（24 个，规划深度 ≤ 8；impl = 指令名 → 模板图实现） ──
export const GOAP_ACTIONS = [
  { name: 'goto_site', impl: 'goto_site', pre: [], eff: [{ bit: 'at_site' }], cost: 2 },
  { name: 'found_city', impl: 'found_city', pre: [{ bit: 'at_site' }], eff: [{ bit: 'has_city' }, { bit: 'has_2cities' }, { bit: 'has_3cities' }, { bit: 'at_site', val: false }], cost: 1 },
  { name: 'goto_own_city', impl: 'goto_own_city', pre: [{ bit: 'has_city' }], eff: [{ bit: 'at_own_city' }], cost: 2 },
  { name: 'build_farm', impl: 'build_farm', pre: [{ bit: 'at_own_city' }, { bit: 'farm_built', val: false }], eff: [{ bit: 'farm_built' }], cost: 3 },
  { name: 'build_mine', impl: 'build_mine', pre: [{ bit: 'at_own_city' }, { bit: 'mine_built', val: false }], eff: [{ bit: 'mine_built' }], cost: 3 },
  { name: 'build_market', impl: 'build_market', pre: [{ bit: 'at_own_city' }, { bit: 'market_built', val: false }], eff: [{ bit: 'market_built' }], cost: 3 },
  { name: 'build_barracks', impl: 'build_barracks', pre: [{ bit: 'at_own_city' }, { bit: 'barracks_built', val: false }], eff: [{ bit: 'barracks_built' }], cost: 3 },
  { name: 'build_walls', impl: 'build_walls', pre: [{ bit: 'at_own_city' }, { bit: 'walls_built', val: false }], eff: [{ bit: 'walls_built' }], cost: 3 },
  { name: 'train_warrior', impl: 'train_warrior', pre: [{ bit: 'has_city' }], eff: [{ bit: 'has_army' }], cost: 2 },
  { name: 'train_catapult', impl: 'train_catapult', pre: [{ bit: 'has_army' }], eff: [{ bit: 'has_siege' }], cost: 3 },
  { name: 'train_spy', impl: 'train_spy', pre: [{ bit: 'has_city' }], eff: [{ bit: 'has_spy' }], cost: 2 },
  { name: 'train_diplomat', impl: 'train_diplomat', pre: [{ bit: 'has_city' }], eff: [{ bit: 'has_diplomat' }], cost: 2 },
  { name: 'train_caravan', impl: 'train_caravan', pre: [{ bit: 'market_built' }], eff: [{ bit: 'has_caravan' }], cost: 2 },
  { name: 'train_scout', impl: 'train_scout', pre: [{ bit: 'has_city' }], eff: [{ bit: 'has_scout' }], cost: 1 },
  { name: 'scout_north', impl: 'scout_north', pre: [{ bit: 'has_scout' }], eff: [{ bit: 'north_scouted' }, { bit: 'enemy_city_known' }], cost: 4 },
  { name: 'sneak_to_enemy', impl: 'sneak_enemy', pre: [{ bit: 'has_spy' }, { bit: 'enemy_city_known' }], eff: [{ bit: 'spy_in_position' }], cost: 4 },
  { name: 'sabotage', impl: 'sabotage', pre: [{ bit: 'spy_in_position' }], eff: [{ bit: 'enemy_weak' }], cost: 2 },
  { name: 'declare_war', impl: 'declare_war', pre: [{ bit: 'enemy_city_known' }, { bit: 'at_war', val: false }], eff: [{ bit: 'at_war' }], cost: 1 },
  { name: 'propose_alliance', impl: 'propose_alliance', pre: [{ bit: 'allied_qi', val: false }], eff: [{ bit: 'allied_qi' }], cost: 1 },
  { name: 'embassy_qi', impl: 'embassy', params: { faction: -1 }, pre: [{ bit: 'has_diplomat' }], eff: [{ bit: 'embassy_qi' }], cost: 3 },
  { name: 'trade_route', impl: 'trade_route', pre: [{ bit: 'has_caravan' }], eff: [{ bit: 'trade_route_active' }], cost: 4 },
  { name: 'besiege_capital', impl: 'besiege', pre: [{ bit: 'at_war' }, { bit: 'has_siege' }, { bit: 'enemy_weak' }], eff: [{ bit: 'north_conquered' }], cost: 6 },
  { name: 'garrison', impl: 'garrison', pre: [{ bit: 'has_army' }], eff: [{ bit: 'capital_safe' }], cost: 1 },
  { name: 'heal', impl: 'heal', pre: [{ bit: 'army_healthy', val: false }], eff: [{ bit: 'army_healthy' }], cost: 2 },
];

// ── HTN 域（战略层 + 中观层，对齐 Fluid HTN：goals + 前置条件 + 后效位模拟） ──
// 三个 goal 与 UTILITY_SETS.grand_strategy 的三个决策一一对应：
// 战略层 utility 解算结果 → goalScore 加分 → GOAL 切换（GOAL 本身可用 utility 算法切换）。
// 所有原语后效类型为 plan（PlanOnly）：规划期预测未来，执行期的 ws 由传感器系统写入。
export const HTN_GRAND = {
  name: 'grand',
  goals: [
    {
      id: 'conquer_north', name: '征服北方', task: 'g_conquer', priority: 1.2,
      pre: [{ bit: 'has_city' }], achieved: [{ bit: 'north_conquered' }],
    },
    {
      id: 'economic_boom', name: '经济繁荣', task: 'g_economy', priority: 1.0,
      pre: [{ bit: 'has_city' }], achieved: [{ bit: 'trade_route_active' }],
    },
    {
      id: 'diplomatic_play', name: '外交纵横', task: 'g_diplomacy', priority: 0.9,
      pre: [{ bit: 'has_city' }], achieved: [{ bit: 'allied_qi' }],
    },
  ],
  tasks: {
    // ── 征服线 ──
    g_conquer: {
      type: 'compound',
      methods: [
        { name: '征服北方（全链路）', conditions: [], subtasks: ['develop_base', 'build_military', 'recon', 'weaken_enemy', 'conquer_north'] },
        { name: '固守发育（兜底）', conditions: [], subtasks: ['develop_base', 'build_military'] },
      ],
    },
    develop_base: {
      type: 'compound',
      methods: [
        { name: '立足三件套', conditions: [{ bit: 'has_scout', val: false }], subtasks: ['p_train_settler', 'p_train_worker', 'p_train_scout'] },
        { name: '已立足', conditions: [], subtasks: [] },
      ],
    },
    build_military: {
      type: 'compound',
      methods: [
        { name: '建军', conditions: [{ bit: 'has_army', val: false }], subtasks: ['p_train_warrior', 'p_train_warrior', 'p_train_catapult'] },
        { name: '补攻城器械', conditions: [{ bit: 'has_siege', val: false }], subtasks: ['p_train_catapult'] },
        { name: '军备已足', conditions: [], subtasks: [] },
      ],
    },
    recon: {
      type: 'compound',
      methods: [
        { name: '侦察北方', conditions: [{ bit: 'north_scouted', val: false }, { bit: 'has_scout' }], subtasks: ['p_scout_north'] },
        { name: '训侦察再探', conditions: [{ bit: 'north_scouted', val: false }], subtasks: ['p_train_scout', 'p_scout_north'] },
        { name: '已侦察', conditions: [], subtasks: [] },
      ],
    },
    weaken_enemy: {
      type: 'compound',
      methods: [
        { name: '间谍渗透破坏', conditions: [{ bit: 'enemy_weak', val: false }, { bit: 'has_spy' }], subtasks: ['p_sneak_enemy', 'p_sabotage'] },
        { name: '训间谍再渗透', conditions: [{ bit: 'enemy_weak', val: false }], subtasks: ['p_train_spy', 'p_sneak_enemy', 'p_sabotage'] },
        { name: '敌已虚弱', conditions: [], subtasks: [] },
      ],
    },
    conquer_north: {
      type: 'compound',
      methods: [
        { name: '直取敌都（已交战）', conditions: [{ bit: 'at_war' }, { bit: 'enemy_weak' }, { bit: 'has_siege' }], subtasks: ['p_besiege'] },
        { name: '先宣后攻', conditions: [{ bit: 'enemy_weak' }, { bit: 'has_siege' }], subtasks: ['p_declare_war', 'p_besiege'] },
        { name: '宣战压制', conditions: [{ bit: 'at_war', val: false }], subtasks: ['p_declare_war'] },
        { name: '待机（军未就）', conditions: [], subtasks: [] },
      ],
    },
    // ── 经济线 ──
    g_economy: {
      type: 'compound',
      methods: [
        { name: '扩张与建设', conditions: [], subtasks: ['develop_base', 'city_growth', 'expand_trade'] },
      ],
    },
    city_growth: {
      type: 'compound',
      methods: [
        { name: '基础设施', conditions: [], subtasks: ['p_build_farm', 'p_build_mine', 'p_build_market'] },
      ],
    },
    expand_trade: {
      type: 'compound',
      methods: [
        { name: '通商', conditions: [{ bit: 'market_built' }], subtasks: ['p_train_caravan', 'p_trade_route'] },
        { name: '暂缓（无市场）', conditions: [], subtasks: [] },
      ],
    },
    // ── 外交线 ──
    g_diplomacy: {
      type: 'compound',
      methods: [
        { name: '远交近攻', conditions: [], subtasks: ['diplo_establish', 'diplo_alliance'] },
      ],
    },
    diplo_establish: {
      type: 'compound',
      methods: [
        { name: '派遣外交官', conditions: [{ bit: 'has_diplomat' }], subtasks: ['p_embassy_qi'] },
        { name: '先训外交官', conditions: [], subtasks: ['p_train_diplomat', 'p_embassy_qi'] },
      ],
    },
    diplo_alliance: {
      type: 'compound',
      methods: [
        { name: '结盟', conditions: [{ bit: 'embassy_qi' }], subtasks: ['p_propose_alliance'] },
        { name: '暂缓（无使馆）', conditions: [], subtasks: [] },
      ],
    },
    // ── 原语（前置条件 + 后效；command → 模板图实现；效果预测打通后续前件） ──
    p_train_settler: { type: 'primitive', command: 'train_settler', conditions: [], effects: [] },
    p_train_worker: { type: 'primitive', command: 'train_worker', conditions: [], effects: [] },
    p_train_scout: { type: 'primitive', command: 'train_scout', conditions: [], effects: [{ bit: 'has_scout', type: 'plan' }] },
    p_train_warrior: { type: 'primitive', command: 'train_warrior', conditions: [], effects: [{ bit: 'has_army', type: 'plan' }] },
    p_train_catapult: { type: 'primitive', command: 'train_catapult', conditions: [{ bit: 'has_army' }], effects: [{ bit: 'has_siege', type: 'plan' }] },
    p_train_spy: { type: 'primitive', command: 'train_spy', conditions: [], effects: [{ bit: 'has_spy', type: 'plan' }] },
    p_train_diplomat: { type: 'primitive', command: 'train_diplomat', conditions: [], effects: [{ bit: 'has_diplomat', type: 'plan' }] },
    p_train_caravan: { type: 'primitive', command: 'train_caravan', conditions: [{ bit: 'market_built' }], effects: [{ bit: 'has_caravan', type: 'plan' }] },
    p_build_farm: { type: 'primitive', command: 'build_farm', conditions: [{ bit: 'farm_built', val: false }], effects: [{ bit: 'farm_built', type: 'plan' }] },
    p_build_mine: { type: 'primitive', command: 'build_mine', conditions: [{ bit: 'mine_built', val: false }], effects: [{ bit: 'mine_built', type: 'plan' }] },
    p_build_market: { type: 'primitive', command: 'build_market', conditions: [{ bit: 'market_built', val: false }], effects: [{ bit: 'market_built', type: 'plan' }] },
    p_scout_north: { type: 'primitive', command: 'scout_north', conditions: [{ bit: 'has_scout' }], effects: [{ bit: 'north_scouted', type: 'plan' }, { bit: 'enemy_city_known', type: 'plan' }] },
    p_sneak_enemy: { type: 'primitive', command: 'sneak_enemy', conditions: [{ bit: 'has_spy' }, { bit: 'enemy_city_known' }], effects: [{ bit: 'spy_in_position', type: 'plan' }] },
    p_sabotage: { type: 'primitive', command: 'sabotage', conditions: [{ bit: 'spy_in_position' }], effects: [{ bit: 'enemy_weak', type: 'plan' }] },
    p_declare_war: { type: 'primitive', command: 'declare_war', params: { faction: 1 }, conditions: [{ bit: 'at_war', val: false }], effects: [{ bit: 'at_war', type: 'plan' }] },
    p_embassy_qi: { type: 'primitive', command: 'embassy', params: { faction: 2 }, conditions: [{ bit: 'has_diplomat' }], effects: [{ bit: 'embassy_qi', type: 'plan' }] },
    p_propose_alliance: { type: 'primitive', command: 'propose_alliance', conditions: [{ bit: 'embassy_qi' }], effects: [{ bit: 'allied_qi', type: 'plan' }] },
    p_trade_route: { type: 'primitive', command: 'trade_route', conditions: [{ bit: 'has_caravan' }], effects: [{ bit: 'trade_route_active', type: 'plan' }] },
    p_besiege: { type: 'primitive', command: 'besiege', conditions: [{ bit: 'at_war' }, { bit: 'has_siege' }, { bit: 'enemy_weak' }], effects: [{ bit: 'north_conquered', type: 'plan' }] },
  },
};

// ── 战术层：攻城小队 BT（OpenRA 方案：毫秒级响应的固定逻辑） ──
export const SIEGE_SQUAD_BT = {
  type: 'selector', name: '攻城小队',
  children: [
    {
      type: 'sequence', name: '残血撤离',
      children: [
        { type: 'condition', template: 'cond.hp_low' },
        { type: 'action', template: 'cmd.garrison' },
      ],
    },
    {
      type: 'sequence', name: '被袭反击',
      children: [
        { type: 'condition', template: 'cond.under_attack' },
        { type: 'action', template: 'cmd.attack_adjacent' },
      ],
    },
    {
      type: 'sequence', name: '破城',
      children: [
        { type: 'condition', template: 'cond.enemy_city_adjacent' },
        { type: 'action', template: 'cmd.besiege' },
      ],
    },
    { type: 'action', template: 'cmd.besiege' }, // 行军+破城一体（besiege 自带接近-攻击循环）
  ],
};

// ── 战术层：间谍 FSM（渗透 → 破坏 → 撤离） ──
export const SPY_FSM = {
  initial: 'infiltrate',
  states: {
    infiltrate: { label: '渗透', action: 'cmd.sneak_enemy' },
    sabotage: { label: '破坏', action: 'cmd.sabotage' },
    exfiltrate: { label: '撤离', action: 'cmd.goto_own_city' },
    done: { label: '完成', action: 'cmd.wait' },
  },
  transitions: [
    { from: 'infiltrate', to: 'sabotage', condition: 'cond.enemy_city_adjacent' },
    { from: 'infiltrate', to: 'exfiltrate' }, // 渗透动作失败/完成但未邻接 → 中止撤离
    { from: 'sabotage', to: 'exfiltrate', event: 'sabotage_done', within: 2 },
    { from: 'sabotage', to: 'exfiltrate' }, // 破坏失败 → 撤离
    { from: 'exfiltrate', to: 'done' }, // 无条件 = 撤离动作完成后转移
    { from: '*', to: 'exfiltrate', condition: 'cond.under_attack' },
  ],
};
