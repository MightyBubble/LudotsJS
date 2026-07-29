// 全链路演示集（代码内置数据，不污染 Utility 资产库）—— 实验室"接战抉择"。
// 词汇全部来自实验室知识层：bb:perceivedEnemy / self:health / belief:threat。
// 数值校准（三决策各有稳定赢面，自检已钉死）：
//   · 满血有敌 → 强攻突进（敌情 0-2 × 血量 0-100，乘积+补偿 ≈0.63 > 戒备 0.45）
//   · 无敌     → 戒备普攻兜底（yShift 0.2 基线分）
//   · 残血高威胁 → 回撤治疗（weight 1.5 放大血损×威胁）
import { bakeUtilitySet } from '../ai/utility/utility.js';

export const CHAIN_MAKER = '接战抉择';

export const CHAIN_DEMO_DEF = {
  name: 'lab.chain', momentum: 1.05,
  makers: [{
    id: 'engage', name: CHAIN_MAKER,
    decisions: [
      {
        id: 'melee', name: '强攻突进', weight: 1, noTarget: true, command: { name: 'ability.melee' },
        considerations: [
          { name: '敌情', source: 'bb:perceivedEnemy', norm: { type: 'range', min: 0, max: 2 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
          { name: '自身血量', source: 'self:health', norm: { type: 'range', min: 0, max: 100 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
        ],
      },
      {
        id: 'heal', name: '回撤治疗', weight: 1.5, noTarget: true, command: { name: 'ability.heal' },
        considerations: [
          { name: '自身血损', source: 'self:health', norm: { type: 'range', min: 0, max: 100 }, curve: { type: 'linear', slope: -1, yShift: 1 } },
          { name: '威胁', source: 'belief:threat', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
        ],
      },
      {
        id: 'atk', name: '戒备普攻', weight: 1, noTarget: true, command: { name: 'ability.atk' },
        considerations: [
          { name: '敌情', source: 'bb:perceivedEnemy', norm: { type: 'range', min: 0, max: 4 }, curve: { type: 'linear', slope: 0.5, yShift: 0.2 } },
        ],
      },
    ],
  }],
};

export function createChainDemo() {
  return bakeUtilitySet(CHAIN_DEMO_DEF);
}
