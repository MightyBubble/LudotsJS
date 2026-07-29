// 传感器注册表（数据）—— 感知契约的唯一词汇表：
//   传感器只写黑板键，决策（姿态仲裁/选目标/指令执行）只读黑板键，双方零直接耦合。
// 每 tick 传感器阶段先行（engine.runSensors），之后引擎不再触碰世界真值。
import { MEMORY_TTL, RETALIATE_WINDOW } from './abilityDefs';

export const SENSORS = [
  { key: 'vision', label: '视野传感器', writes: 'bb.perceived', source: '半径 entity.sight 内的活动单位', decay: '出视野即清除（降级进记忆）' },
  { key: 'memory', label: '记忆传感器', writes: 'bb.memory', source: '视野快照的降级副本（最后目击）', decay: `TTL ${MEMORY_TTL}s；亲眼见到失效立即作废` },
  { key: 'hit', label: '受击传感器', writes: 'bb.lastHit', source: '效果层 applyDamage（攻击者 + 时刻）', decay: `还击窗口 ${RETALIATE_WINDOW}s（候选 within 可覆盖）` },
  { key: 'control', label: '指挥传感器', writes: 'bb.control', source: '控制器意图（瞄准/悬停/选中/按住）', decay: '每 tick 重写；仅受控单位持有' },
];