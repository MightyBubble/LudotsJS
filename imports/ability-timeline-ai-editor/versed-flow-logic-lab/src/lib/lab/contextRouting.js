// 上下文路由层 —— 同一 InputTag，按 [目标关系 × 自身标签 × 目标标签 × 目标状态] 声明式决议出真正的指令。
// 典型场景：RTS 右键（敌=打/地=走/友=跟随/治疗者+残血友军=治疗）、开放世界万能交互键 F。
//
// 规则表自上而下求值，首条 when 全部命中即生效；不写的条件 = 不限制。
// 路由层位于 绑定层(②) 与 确认层(③) 之间：它只产出"指令语义"，参数决议仍走黑板。
//
// ctx = {
//   targetKind:   'enemy' | 'ally' | 'ground'
//   selfTags:     施法者当前有效标签（含 unitTags/临时/限时）
//   targetTags:   目标当前有效标签
//   targetHpRatio: 目标血量比（无目标 = 1）
// }
// CONTEXT_ROUTES = 默认模板：仅作 RouteTable 实体的初次落库种子 / 路由表编辑页预填。
// 引擎只读库中资产（state.routes），不引用本表 —— 无运行时兜底。
export const CONTEXT_ROUTES = {
  'Input.Smart': [
    { when: { target: 'enemy' }, do: { type: 'attack' } },
    { when: { target: 'ally', selfTags: ['Role.Healer'], targetHpBelow: 1.0 }, do: { type: 'ability', ability: 'heal' } },
    { when: { target: 'ally' }, do: { type: 'follow' } },
    { when: { target: 'ground' }, do: { type: 'move' } },
  ],
};

// 纯函数：路由表 × 上下文 → 命中规则下标（-1 = 无匹配）。编辑器模拟器与引擎共用同一求值。
export function matchRouteIndex(routes, ctx) {
  for (let i = 0; i < (routes || []).length; i++) {
    const w = routes[i].when || {};
    if (w.target && w.target !== ctx.targetKind) continue;
    if (w.selfTags?.length && !w.selfTags.every((t) => ctx.selfTags.includes(t))) continue;
    if (w.targetTags?.length && !w.targetTags.every((t) => ctx.targetTags.includes(t))) continue;
    if (w.targetHpBelow != null && !(ctx.targetHpRatio < w.targetHpBelow)) continue;
    return i;
  }
  return -1;
}

export function resolveRoute(routes, ctx) {
  const i = matchRouteIndex(routes, ctx);
  return i >= 0 ? routes[i].do : null;
}

// 静态检查：规则 j 被更靠前且条件更宽（或相同）的规则完全遮蔽 → 永不可达
const subset = (a = [], b = []) => a.every((t) => b.includes(t));
const covers = (a, b) => {
  const aw = a.when || {}, bw = b.when || {};
  const target = aw.target == null || (bw.target != null && aw.target === bw.target);
  const hp = aw.targetHpBelow == null || (bw.targetHpBelow != null && aw.targetHpBelow >= bw.targetHpBelow);
  return target && hp && subset(aw.selfTags, bw.selfTags) && subset(aw.targetTags, bw.targetTags);
};
export function findShadowed(rules) {
  const out = [];
  (rules || []).forEach((r, j) => {
    if (rules.slice(0, j).some((prev) => covers(prev, r))) out.push(j);
  });
  return out;
}