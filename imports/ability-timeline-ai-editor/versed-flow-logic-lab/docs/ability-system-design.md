# 指令与技能系统 · 完整设计文档

> 施法实验室（AbilityLab）的引擎设计。目标：用**最少的通用概念**声明式覆盖
> LOL / WAR3 / SC2 / 开放世界等各类游戏的指令与施法手感，加内容不改引擎。

---

## 0. 两条统一原则

### 0.1 一切手感差异 = 参数绑定时机

智能施法、点击确认、跟随鼠标、失效重取、连射续轮、持续激光——不是七个功能，
而是同一个问题在不同粒度上的答案：**施法参数（目标/地点/方向）何时定格、是否允许重新定格**。

两条轴张成完整空间：

| 轴 | 取值 | 语义 |
|---|---|---|
| **commit 边沿**（施法前） | `press` / `release` / `click` | ③确认层的 `castMode` |
| **rebind 频率**（施法后） | `commit` / `round` / `tick` / `onInvalid` | 每参数各自声明 |

任意组合都是合法手感，包括还没有游戏做过的组合（如 WAR3 式确认 + 逐帧追踪激光）。

### 0.2 每层是纯函数或纯状态机，只读上一层输出和黑板

层与层不越权。多数引擎的痛苦来自把确认逻辑揉进绑定表、或引导逻辑里偷读鼠标——
每加一种手感要改三处。这里加手感 = 改一条声明。

---

## 1. 分层流水线（每层只回答一个问题）

```
① 设备层    物理事件 → InputTag          「哪个键？」
② 绑定层    InputTag → 意图动词           「想做什么？」
②′路由层    意图 × 上下文 → 指令语义       「此情此景意味着什么？」
③ 确认层    意图 → 已确认施法请求          「何时定格？」
④ 决议层    请求 + 黑板 → 具体参数         「对谁/哪里？」
⑤ 裁决层    参数 + 标签门禁 → 立即/缓冲/排队/丢弃 「现在能做吗？」
⑥ 执行层    订单 → 阶段/时间线/引导状态机   「怎么展开？」
⑦ 效果层    时间线触发 → 纯粹结果           「发生了什么？」
⑧ 事件层    一切可观测（日志/FX/飘字/统计）  「谁需要知道？」
```

### ① 设备层（`KEYBOARD_MAP`）

物理输入 → `InputTag`。每种设备一张映射表（键盘/屏幕按钮/摇杆各自维护），
上层只认 InputTag，天然跨设备。鼠标右键映射为 `Input.Smart`，Esc 映射为 `Input.Cancel`。

### ② 绑定层（`ACTION_BINDINGS`）

InputTag → 动作动词：`order`（施放某技能）/ `stop` / `cancel` / `smart` / `attackmove` / `patrol` / `plan`。
**release 不进绑定表**：引擎在激活时记录"激活该施法的 InputTag"，
松开时按技能自身数据（hold / channel / castMode）路由——抬起语义是技能属性，不是按键属性。

### ②′ 上下文路由层（`contextRouting.js`）

同一输入在不同上下文触发不同指令（RTS 右键、开放世界 F 键）。声明式规则表，自上而下首条命中即生效：

```js
'Input.Smart': [
  { when: { target: 'enemy' },                                        do: { type: 'attack' } },
  { when: { target: 'ally', selfTags: ['Role.Healer'], targetHpBelow: 1.0 }, do: { type: 'ability', ability: 'heal' } },
  { when: { target: 'ally' },                                         do: { type: 'follow' } },
  { when: { target: 'ground' },                                       do: { type: 'move' } },
]
```

条件词汇：`target`（关系：enemy/ally/ground）、`selfTags`、`targetTags`、`targetHpBelow`。
自身与目标状态全部经**标签**表达（Role.Healer 是单位标签），与门禁/冷却共用同一套标签系统。
路由只产出"指令语义"；参数决议仍走④，所以路由出的治疗也享受接近施法/射程/队列全套逻辑。

### ③ 确认层（Arming）

极小状态机，挂在 controller 上（`controller.pending`）：

```
Idle ──press──▶ Armed（画指示器，参数每帧预览）──commit边沿──▶ 提交⑤
                  │
                  └── cancel 边沿（Esc / 右键 / 切换技能 / 切换控制 / 停止）──▶ 取消
```

`castMode`（per 技能数据 + 运行时偏好三选）：

| 模式 | commit 边沿 | 原型 |
|---|---|---|
| `instant` | 按下 | LOL 无指示器智能施法 |
| `onRelease` | 抬起 | LOL 带指示器智能施法 |
| `confirm` | 下一次左键点击 | WAR3 / 传统 LOL |

约定：
- **引导/按住型技能锁定 instant**——它们的抬起语义已被"提前结束/停止连射"占用。
- Shift+技能键直接排队，绕过确认（排队本身就是显式确认）。
- confirm 模式点击敌人 = 显式指定该对象为目标（走 forceTarget，阵营需匹配）；点击地面 = 点击点定格为瞄准点。
- Armed 态不占用引擎：commit 前不进缓冲、不进队列、不触发门禁。

### ④ 决议层（黑板快照驱动）

**统一视野**：每单位半径 sight 的感知，敌我皆写入黑板快照 `bb.perceived`
（位置/血量/阵营/目击时间，不存活引用）；脱离视野转入记忆 `bb.memory`（TTL 后作废）。
**指挥意图**（aim/悬停/选中/按住的键）每 tick 快照进受控单位 `bb.control`——
决议与执行的一切意图读取只看黑板，引擎从不直接读 controller；AI 单位向黑板写意图即可复用全套逻辑。

**候选决议优先级**（unit 模式）：悬停施法 > per 技能绑定（Alt+键）> 全局选中 > 自动取目标。
自动取目标从 `感知快照 ∩ acquireRange` 里取，规则是一张**选目标 graph**（`targetSelector.js`，节点词汇仅两类、注册表可扩展）：`filters` 硬条件门（requireTag / forbidTag / hpBelow / hpAbove，不满足直接出局）+ `considerations` utility 曲线（input 归一化 → curve 公式 → × weight，加权平均取最高分）。`acquire.pick`（nearest / lowest_hp）只是默认曲线的糖；悬停施法时评分换 aimDistance（意图胜过 utility），硬过滤照常生效。
**目标阵营是技能数据**（`targetFilter: 'enemy' | 'ally'`）：治疗的候选管线与攻击完全同构，只是过滤器不同。

**三种距离**（互不相同）：`cast.range` 施放距离（超出→接近/取消）、
`acquire.range` 候选纳入范围、效果内 `range/radius` 作用距离。

**目标模式**：`unit`（取候选对象，可降级点施）/ `point`(瞄准点) / `direction`(瞄准方向)。
首个效果的 `needs` 元数据决定能否降级：`'unit'` 必须有对象，取不到 = 放不出来。

### ⑤ 裁决层（门禁 → 立即 / 缓冲 / 排队 / 丢弃）

- **门禁 = 标签过滤器**：`blockedBy: ['Cooldown.x', …]`。
  **冷却就是限时标签**（激活时授予 `Cooldown.<id>`），无独立冷却系统；
  “施法中”的互斥不由门禁承担，由轨道占用承担（见 ⑤′）。
- **输入缓冲**：门禁挡下的请求进缓冲（槽位数/有效窗口可调），解锁时重新构建指令
  （参数在缓冲弹出瞬间重新决议——绑定时机原则的体现）。
- **指令队列**（RTS）：Shift 排队；`queueMode: 'replace' | 'interleave'`（SC2 式插队首保留原队列）。
  施法中队列暂停；队首冷却中原地等待。
- 确认层 commit 与直接按键走同一入口 `dispatchOrder`——路径不同，裁决一致。
- **打断策略**（`onInterrupt`，per 技能）：施法中来了同轨新指令怎么办——`none` 不可打断（默认，新指令排在施法后）/ `drop` 打断丢弃 / `restart` 打断后重新入队从头再放 / `resume` 挂起进度快照，新指令完成后从中断处续跑（不重付冷却）。容量裁决先于打断：入队注定失败时不白白打断当前施法。

### ⑤′ 轨道（Track）：互斥槽是数据

引擎只认轨道 ID，不认语义。**同轨互斥、异轨并行**（边走边打）：move 占 `legs`，射击类占 `arms`，全身技能占 `['legs','arms']`（`cast.tracks` 声明）。新指令与当前施法占用不相交即并行执行——射击中下达移动：施法照常、移动只产生位移，朝向由施法独占（strafe）；施法中队列不必整体暂停，队首与施法占用相交才等待。接近/追忆阶段临时追加 `legs`，进入出手阶段释放。跨轨约束不进引擎，走标签门禁。**顺序性属于计划（队列），并行性属于轨道。**

### ⑥ 执行层（Timeline + 引导原型）

技能 = `stages[]`，每段有 `duration` / `grantedTags` / `timeline`（相对时刻触发效果）/
`comboWindow`（窗口内再按续下一段）。周期时间线用生成器（`pulses(count, interval, effect)`），不手写重复条目。

**三种引导原型**（`cast.channel`）——终止条件/效果节奏/重决议粒度各不相同：

| 原型 | 节奏 | 目标重决议 | 松开 |
|---|---|---|---|
| `burst` | 固定周期，参数激活时冻结 | 无 | 可配 hold 提前结束 |
| `repeat` | 每轮一次完整决议（微型 order） | **round** | 打完本轮停止 |
| `beam` | 逐 tick 连续作用 | **tick / onInvalid** | 立即断 |

**rebind 统一声明**（取代旧 steer/reacquire 布尔）：

```js
rebind: {
  direction: 'tick',      // 引导中逐帧朝瞄准点（跟随鼠标；激光变扫射光线）
  target:    'onInvalid', // 自动来源目标失效 → 从黑板重决议
}
```

**执行期目标生命周期**：可见 → 施放；脱离视野 → 追最后目击点（记忆快照）；
到达仍不见 → 记忆作废 → 失效重取（rebind） / 降级点施（needs 允许） / 丢弃。
**追踪吸附**（`track`）是效果层补正：无对象参数时吸附施法瞬间快照的悬停对象。

**受迫打断**（`interrupt`，tag 语义）：打断者（眩晕等效果）只打标签（`applyTag` 效果授予 `State.Stunned`），永不直接碰别人的施法状态；引擎每 tick 检查执行中技能的 `interrupt.by` 过滤器，命中即按 `policy` 挂起（与 `onInterrupt` 共用 drop / restart / resume 词汇，续跑指令插回队首）。冻结标签（`FREEZE_TAGS`）冻结整个执行槽：不施法、不走队列、不弹缓冲（缓冲窗口照常流逝）。

### ⑦ 效果层（注册表）

`registerEffect(type, handler, needs)`——加效果类型 = 注册，不改执行器（OCP）。
内置：`swing` / `projectile`（追踪/直线）/ `pulse` / `search`（SC2 式：点/方向参数附近搜对象再链 `then`）/
`damage` / `heal` / `applyTag`（授予限时标签——硬控/沉默等控制效果统一以标签表达）。效果只改血量等世界数据；**死亡是引擎级状态转移**（每阶段后统一扫描 → 打 `State.Dead`、清理队列/缓冲/施法），层次不越权。

### ⑧ 事件层（`events.js`）

引擎只 `emit(state, type, payload)`；四个适配器订阅：LOG（日志文案）、FX（场景特效）、
NOTICE（世界内飘字，拒绝反馈必须出现在战场上）、STATS（计数）。事件流本身可回放。

---

## 2. 自主层：指令从哪来（姿态 / 持续指令 / 计划模式）

八层流水线回答“一个指令怎么执行”；自主层回答“指令从哪来”。**AI 与玩家共用同一 order 管道**：自主仲裁产出的是标准 attack / ability 指令进队列——不直接操纵执行、不写冷却、不绕过门禁，引擎对意图来源一无所知。

### 姿态（Stance）：分层薄状态机（`stances.js`）

三个工具各归其位：FSM 管姿态（处于什么模式）、autocast 仲裁管产意图（做什么）、order 管道管执行。顶层状态只声明四件事，不含行为代码：

| 字段 | 语义 |
|---|---|
| `autocast` | 自主施法候选 `[{ ability, trigger: 'seen'（视野接战）/ 'damaged'（还击） }]`，按序仲裁 |
| `chase` | 是否追击（false = 射程外不接战、目标脱离射程即脱战） |
| `leash` | 缰绳半径（警戒）：接战瞬间记录锚点，追击距锚点超出即脱战归位，归位途中不再接战 |
| `transitions` | 事件驱动转移（`damaged` 读 `bb.lastHit` 查表）；玩家显式 setStance = 最高优先级转移 |

触发源全是黑板键：`seen` 读 `bb.perceived`（走该技能自己的选目标 graph）；`damaged` 读 `bb.lastHit`（受击传感器写入，还击窗口 `RETALIATE_WINDOW` 内且攻击者仍在视野）。普攻 = autocast 技能（`DEFAULT_ATTACK`）；接战射程 = 候选技能自带的 `cast.range`——数值永远在技能数据里，姿态只声明“用哪个技能”。自主意图每次出手前**重过该技能的硬过滤门**（如治疗的 hpBelow：队友被奶满即意图过期、让位下一候选）；玩家显式指令不受此限。

引擎只内置五种通用姿态原语（静默 / 原地防守 / 还击 / 警戒 / 侵略）；「圣骑士」这类复合职业是**内容层配置**——有序 autocast 候选 + chase/leash 拼装而成，由姿态编辑器作者创建、存库随游戏走，引擎对它一无所知。

### 持续指令：A-move / 巡逻 / 跟随

不占引擎新机制，都是队列里的普通指令 + 每 tick 重决议：

- **A-move**（攻击移动）：移动 + 沿途接战，清场后继续行进，到达才完成。A-move 本身就是接战意图，不看姿态；接战技能由指令声明（缺省兜底 `DEFAULT_ATTACK`）。
- **巡逻**：循环持续指令，路点间往返、永不自行完成；连点扩展路线（队尾仍是巡逻时追加路点）。**接战性格由姿态声明**——静默巡逻只走路，侵略沿途接战，chase=false 射程外不接战，超出缰绳放弃追击回路线。
- **跟随**：贴近目标快照（可感知或有记忆），彻底失联才完成。

### 计划模式（`Input.Plan`，按住 Z）

RA2 式路径点计划：按住期间受控单位的指令**只入队、冻结执行**（布置计划），松开统一按序执行——与 Shift 排队同一套队列管道。入队位置仍由 per 技能 `queueMode` 裁决：interleave 插队首，普通指令降级排队尾（计划里没有“替换”）。

---

## 3. 横切机制

- **标签系统**（`tags.js`）：持久（unitTags）+ 临时（施法阶段授予）+ 限时（冷却）三类统一为
  `effectiveTags(u, time)`；门禁、路由条件、目标过滤共用 `matchesFilter`。状态判定不问 alive，问标签。
- **传感器 → 黑板契约**（`sensors.js` 是词汇表）：每 tick 传感器先行写入——视野写 `bb.perceived`（敌我皆感知，阵营过滤在使用侧按 `targetFilter` 声明）、记忆写 `bb.memory`（最后目击点，TTL 作废；亲眼所见失效立即作废）、受击写 `bb.lastHit`、指挥写 `bb.control`。决策与执行只读黑板键，从不引用活对象或回读 controller。
- **弹道**：携带 casterId/阵营，命中找回真实施法者（已死则回退最小上下文）。
- **自检**（`selftest.js`）：引擎是纯函数+确定性 tick，固定 dt 步进断言。32 条用例覆盖
  命中/门禁缓冲/感知记忆/repeat/beam/死亡/队列/连击/确认层三模式/上下文路由/
  utility 选目标/硬过滤/受迫打断（drop·resume）/applyTag 硬控/姿态五原语/事件转移/警戒归位/
  巡逻/计划模式/A-move/内容层姿态注入/分轨并行。

## 4. 加内容的成本（验收标准）

| 想加什么 | 改哪里 |
|---|---|
| 新技能 | `ABILITY_DEFS` 加一条数据 |
| 新效果类型 | `registerEffect` 注册一个 handler |
| 新手感（确认/重绑组合） | 技能数据里改 `castMode` / `rebind` |
| 新上下文行为 | 路由表加一条 `when/do` 规则 |
| 新设备 | 一张 `物理事件 → InputTag` 映射表 |
| 新单位职业 | `unitTags` 加标签（路由/门禁自动生效） |
| 新姿态 / 新职业性格 | 姿态机加一条状态声明（autocast / chase / leash / transitions），引擎零改动 |
| 新选目标规则 | selector 加 filters / considerations，或注册新曲线节点 |
| 新硬控 | 效果打标签 + 被打断技能的 `interrupt.by` 声明该标签 |

任何一行需要改引擎代码，即视为分层泄漏。