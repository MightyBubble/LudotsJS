// GOAP 规划器 —— 动作的规划与实现分离（指令模式）。
// 动作 = { name, pre: [{bit,val}], eff: [{bit,val}], cost(数值或代价函数), impl: 指令名 }
// 规划器只对 WorldState 位做 A*（纯整数位运算，深度 ≤ 8，0 分配热路径除最终路径数组）；
// 规划产物是指令队列 [Command]——实现由模板图承担（GOAP 不知道"怎么做"，只知道"做什么"）。
// 代价可接入 Utility：costFn(action, ctx) —— utility 解算复用于规划器。

export function goapPlan({ actions, ws, goal, maxDepth = 8, ctx = null, costFn = null }) {
  const startBits = ws.bits;
  const { mask: goalMask, expect } = ws.goalMask(goal);
  const satisfied = (b) => (b & goalMask) === expect;
  if (satisfied(startBits)) return [];
  const heuristic = (b) => {
    let diff = (b & goalMask) !== expect ? 0 : 0;
    let x = (b & goalMask) ^ expect, c = 0;
    x &= goalMask;
    while (x) { c += x & 1; x >>= 1; }
    return c + diff;
  };

  // A*：节点 = { bits, g, f, parent, actionIdx }；开集小（深度≤8，分支≤动作数），数组即够
  const open = [{ bits: startBits, g: 0, f: heuristic(startBits), parent: null, actionIdx: -1 }];
  const bestG = new Map([[startBits, 0]]);
  const usable = actions.filter((a) => a.pre !== null);

  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (satisfied(cur.bits)) {
      const path = [];
      for (let n = cur; n && n.actionIdx >= 0; n = n.parent) path.unshift(n.actionIdx);
      return path.map((i) => usable[i]);
    }
    const depth = depthOf(cur);
    if (depth >= maxDepth) continue;
    for (let i = 0; i < usable.length; i++) {
      const a = usable[i];
      // 前件在当前状态成立？
      let ok = true;
      for (const p of a.pre || []) {
        const bi2 = ws.reg.index.get(p.bit);
        const has = bi2 !== undefined && (cur.bits & (1 << bi2)) !== 0;
        if (has !== (p.val !== false)) { ok = false; break; }
      }
      if (!ok) continue;
      const nb = ws.applyEffects(a.eff || [], cur.bits);
      if (nb === cur.bits) continue;
      const cost = costFn ? costFn(a, ctx) : (a.cost ?? 1);
      const g = cur.g + cost;
      if (bestG.has(nb) && bestG.get(nb) <= g) continue;
      bestG.set(nb, g);
      open.push({ bits: nb, g, f: g + heuristic(nb), parent: cur, actionIdx: i });
    }
  }
  return null; // 无规划
}
function depthOf(node) { let d = 0; for (let n = node; n && n.actionIdx >= 0; n = n.parent) d++; return d; }

// GOAP 执行器：持有当前计划，逐条下达指令；失败即重规划。
export function createGoapController({ actions, goal, maxDepth = 8, costFn = null, onEvent }) {
  return {
    plan: null, idx: 0, replans: 0, nextRetry: 0,
    tick(agent, ctx) {
      const ws = agent.knowledge.ws;
      if (this.nextRetry && (ctx?.time ?? 0) < this.nextRetry) return null;
      if (!this.plan || this.idx >= this.plan.length) {
        const acts = typeof actions === 'function' ? actions(agent, ctx) : actions;
        this.plan = goapPlan({ actions: acts, ws, goal: typeof goal === 'function' ? goal(agent, ctx) : goal, maxDepth, ctx, costFn });
        this.idx = 0;
        if (!this.plan) { this.nextRetry = (ctx?.time ?? 0) + 5; onEvent?.({ type: 'no_plan', agent: agent.id }); return null; }
        if (this.plan.length === 0) { this.plan = null; this.nextRetry = (ctx?.time ?? 0) + 5; return null; } // 目标已达成，5 回合后再看
        this.replans++;
        onEvent?.({ type: 'planned', agent: agent.id, plan: this.plan.map((a) => a.name) });
      }
      const a = this.plan[this.idx];
      const st = ctx.commands.status();
      if (st === 'idle' || st === 'done' || st === 'failed') {
        if (st === 'failed') { this.plan = null; this.nextRetry = (ctx?.time ?? 0) + 2; onEvent?.({ type: 'action_failed', agent: agent.id, action: a.name }); return null; }
        this.idx++;
        if (this.idx > this.plan.length) { this.plan = null; return null; }
        const next = this.plan[this.idx - 1];
        ctx.commands.issue(next.impl || next.name, { ...(next.params || {}), origin: 'goap' }, ctx);
        return next;
      }
      return a;
    },
  };
}
