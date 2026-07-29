// 外交层 —— 关系值 + 条约 FSM + Utility 提案评估（Freeciv 方案 + 远交近攻曲线）。
// 关系值 rel[a][b] ∈ [-100, 100]（mem 事件驱动增减：受击 -15、贸易 +8、毁约 -50）；
// 条约 FSM：war ⇄ peace ⇄ alliance，转移由提案 + 接受裁决（utility 评分）完成；
// 提案本身由 UtilitySet 打分（距离/相对实力/关系值/背叛记录的曲线）——
// 远交近攻不是规则，是曲线形状的涌现。

export const TREATY = { WAR: 'war', PEACE: 'peace', ALLIANCE: 'alliance' };

export function createDiplomacy(factions) {
  const n = factions.length;
  const idx = Object.fromEntries(factions.map((f, i) => [f, i]));
  const rel = Array.from({ length: n }, () => new Float32Array(n));
  const treaty = Array.from({ length: n }, () => new Array(n).fill(TREATY.PEACE));
  return {
    factions, idx, rel, treaty,
    get(a, b) { return rel[idx[a]][idx[b]]; },
    add(a, b, delta) {
      const i = idx[a], j = idx[b];
      rel[i][j] = Math.max(-100, Math.min(100, rel[i][j] + delta));
      rel[j][i] = Math.max(-100, Math.min(100, rel[j][i] + delta));
    },
    treatyOf(a, b) { return a === b ? TREATY.ALLIANCE : treaty[idx[a]][idx[b]]; },
    setTreaty(a, b, t) { treaty[idx[a]][idx[b]] = t; treaty[idx[b]][idx[a]] = t; },
    atWar(a, b) { return this.treatyOf(a, b) === TREATY.WAR; },
    allied(a, b) { return this.treatyOf(a, b) === TREATY.ALLIANCE; },
    snapshot() {
      return factions.map((a) => ({
        faction: a,
        others: factions.filter((b) => b !== a).map((b) => ({ faction: b, rel: Math.round(this.get(a, b)), treaty: this.treatyOf(a, b) })),
      }));
    },
  };
}

// 条约 FSM 转移表：事件 × 当前状态 → 新状态（null = 不变）
const TRANSITIONS = {
  declare_war: { peace: TREATY.WAR, alliance: TREATY.WAR },
  accept_alliance: { peace: TREATY.ALLIANCE },
  make_peace: { war: TREATY.PEACE },
  betray: { alliance: TREATY.WAR },
};

export function treatyEvent(dip, a, b, event) {
  const cur = dip.treatyOf(a, b);
  const next = TRANSITIONS[event]?.[cur];
  if (!next) return false;
  dip.setTreaty(a, b, next);
  if (event === 'betray') dip.add(a, b, -50);
  if (event === 'declare_war') dip.add(a, b, -30);
  if (event === 'accept_alliance') dip.add(a, b, 15);
  if (event === 'make_peace') dip.add(a, b, 20);
  return true;
}
