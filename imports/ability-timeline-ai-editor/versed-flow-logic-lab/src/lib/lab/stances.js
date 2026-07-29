// 姿态（Stance）—— 真·层级状态机（HFSM）资产：JSON 配置驱动，状态可嵌套、转移冒泡继承、
// 行为 = 叶状态内挂载的 GraphVM 图（缺省由配置推导生成，见 stanceBehavior.js）。
//
// 三个工具各归其位：HFSM 管姿态（处于什么模式）、行为图管产意图（做什么）、order 管道管执行。
//
// 状态声明四件事（均可在复合态上声明、由后代继承；不含行为代码）：
//   autocast    — 哪些自主施法候选合法：[{ ability, trigger: 'seen'（视野接战）| 'damaged'（还击）}]
//   chase       — 是否追击（false = 射程外不接战、目标脱离射程即脱战）
//   leash       — 缰绳半径（警戒）：追击距锚点超出即脱战归位；缺省 = 无限追击（侵略性）
//   transitions — 事件驱动的转移：[{ on: 事件, to: 状态 }]（子状态未命中上抛父级；玩家显式
//                 setStance = 最高优先级转移）
// 层级（第三种方言）：state.states = { 子状态 } + state.initial = 初始子状态；
//   behavior    — 叶状态行为图（GraphDef/模板名显式引用；缺省 = 命名约定资产
//                 stance.behavior.<叶路径>，缺失即显式报错，无运行时生成兜底）
//
// 巡逻/计划模式不是姿态：巡逻=持续循环指令（点间往返+沿途接战，接战性格仍由姿态决定），
// 计划模式=队列层（按住 Z 强制入队+冻结执行，松开按序执行）—— 与 shift 排队同一套管道。
// 本文件不含任何内容数据：默认姿态机/职业示例是编辑器种子模板（stancePresets.js），
// 引擎只消费库中 StateMachine 资产。
import { normalizeHfsm, hfsmLeafOf, hfsmEvent, hfsmPath, resolveStateKey } from '@/lib/ai/fsm/hfsm.js';

// 事件驱动转移（冒泡）：当前叶 → 祖先逐级查转移表，首条命中即转移（目标复合态自动下沉初始叶）；
// 无命中返回 null。机级 transitions（扩展方言）已在规整期折叠进 from 状态、经冒泡被后代继承。
export function stanceEvent(machine, current, event) {
  const hit = hfsmEvent(machine, current, event);
  return hit ? hit.to : null;
}

// ── 资产方言适配（姿态机 = 正式 StateMachine 资产）──
// 三种写法都合法，统一规整为 HFSM 扁平路径 map（引擎消费的内部形状）：
//   A. 经典方言（内置默认 / 姿态编辑器保存）：state.{autocast, chase, leash, transitions:[{on,to}]}
//   B. 扩展方言（与统一 FSM 资产同构）：state.utility:{autocast,chase,leash} 块
//      + machine.transitions:[{from,to,event:'damaged',within}]（damaged ⇔ 统一知识层 mem 'attacked' 记录）
//   C. 层级方言：state.states + state.initial（+ behavior/behaviorInputs 行为图覆盖）
export const normalizeStanceMachine = normalizeHfsm;

// 引擎取机：state.stanceMachine（库中资产/测试注入）经适配器规整；源未变则复用上次结果（0GC）。
// 无兜底：姿态机配置是唯一真相 —— 未注入即显式报错，绝不静默换用内置默认。
export function stanceMachineOf(state) {
  const src = state.stanceMachine;
  if (!src?.states) throw new Error('缺少姿态机配置（state.stanceMachine 未注入）—— 姿态机资产是唯一真相，运行前必须先载入');
  if (state._normStance && state._normStanceSrc === src) return state._normStance;
  const norm = normalizeHfsm(src);
  state._normStanceSrc = src;
  state._normStance = norm;
  return norm;
}

export { hfsmLeafOf, hfsmPath, resolveStateKey };

// 从 StateMachine 实体行中找出姿态机资产：认 data.flavor==='stance' 标记（改名安全），
// 兼容旧命名约定 name==='StanceMachine'。返回 { row, data }（data 已解析）或 null。
export function findStanceMachineRow(rows) {
  for (const r of rows || []) {
    let d = r.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch { d = null; } }
    if (d?.states && (d.flavor === 'stance' || r.name === 'StanceMachine')) return { row: r, data: d };
  }
  return null;
}