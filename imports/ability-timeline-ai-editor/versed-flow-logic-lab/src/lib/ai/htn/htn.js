// HTN 规划器 —— 任务分解与实现分离（对齐 Fluid HTN：全序前向分解 + 世界状态模拟）。
//
// 领域模型（对照 Fluid HTN）：
//   domain = {
//     goals: [{ id, name, task, priority,            // Goal 层：域入口（战略意图）
//               pre: [{bit,val}],                    //   激活条件（worldstate 位）
//               achieved: [{bit,val}] }],            //   达成判定（满足则 goal 完成，切换下一意图）
//     tasks: { id:
//       compound: { type: 'compound',
//                   conditions: [{bit,val}],         //   任务级前置条件（Fluid：compound 可挂 conditions）
//                   methods: [{ name,
//                               conditions: [{bit,val}],  // method 前置条件：全满足才可被选
//                               subtasks: [taskId] }] },  // 子任务按序展开，全部成功才算成功
//       primitive: { type: 'primitive',
//                    command, params,                //   operator → 指令（实现由模板图承担）
//                    conditions: [{bit,val}],        //   前置条件：规划期校验（对模拟位）
//                    execConditions: [{bit,val}],    //   执行条件：执行中每 tick 校验（Fluid executing conditions）
//                    effects: [{bit,val,type}] } },  //   后效：规划期作用于模拟位
//   }
//
// 效果类型（Fluid HTN EffectType）：
//   plan          —— PlanOnly：仅规划期预测（传感器系统负责执行期写 ws，本原型默认）
//   plan_execute  —— PlanAndExecute：规划期预测 + 该任务执行成功时落到真实 ws
//   permanent     —— Permanent：规划期直接永久落到真实 ws
//
// 分解 = 深度优先全序展开 + worldstate 位模拟：primitive 的后效作用于模拟位（纯整数位运算，
// 不在热路径分配），后续 method/primitive 的前置条件看到"预测的未来"。产物 = 指令队列
// [{name, params, taskId, execConditions, effects}]——HTN 只说"做什么"，实现由模板图承担。
// trace / MTR（Method Traversal Record，方法遍历记录）用于调试与回溯，对齐 Fluid HTN 的调试语义。

// 对任意位组校验前置条件（goap.js 同款纯整数运算）
function satBits(ws, pre, bits) {
  for (let k = 0; k < pre.length; k++) {
    const i = ws.reg.index.get(pre[k].bit);
    const has = i !== undefined && (bits & (1 << i)) !== 0;
    if (has !== (pre[k].val !== false)) return false;
  }
  return true;
}

export function htnGoalAchieved(ws, goal) {
  if (!goal?.achieved?.length) return false;
  const { mask, expect } = ws.goalMask(goal.achieved);
  return (ws.bits & mask) === expect;
}

// Goal 选择：激活条件满足 + 未达成 → priority + goalScore（utility 解算可注入此处切换 GOAL）
export function pickHtnGoal(domain, ws, goalScore = null, ctx = null) {
  let best = null, bestScore = -Infinity;
  for (const g of domain.goals || []) {
    if (g.pre?.length && !ws.satisfies(g.pre)) continue;
    if (htnGoalAchieved(ws, g)) continue;
    const s = (g.priority ?? 1) + (goalScore ? (goalScore(g, ctx) ?? 0) : 0);
    if (s > bestScore) { bestScore = s; best = g; }
  }
  return best;
}

// 分解一个 goal（或指定任务）为原语指令队列。
// opts: { goalId, taskId, goalScore, chooser(method,ws), ctx, maxDepth }
// 返回 { goal, commands, trace, mtr, finalBits } 或 null（无可行分解）。
export function htnPlanGoal(domain, ws, opts = {}) {
  const maxDepth = opts.maxDepth ?? 16;
  const trace = [];
  const mtr = []; // {task, index, method} 成功路径上的方法遍历记录
  const commands = [];

  const goal = opts.goalId
    ? (domain.goals || []).find((g) => g.id === opts.goalId) || null
    : (opts.taskId ? null : pickHtnGoal(domain, ws, opts.goalScore, opts.ctx));
  const startTask = opts.taskId || goal?.task;
  if (!startTask) return null;
  if (goal) trace.push({ kind: 'goal', task: goal.id, name: goal.name, depth: 0 });

  function expand(id, bits, depth, stack) {
    if (depth > maxDepth) throw new Error(`HTN 分解超深: ${id}`);
    if (stack.includes(id)) throw new Error(`HTN 循环任务: ${[...stack, id].join('>')}`);
    const t = domain.tasks[id];
    if (!t) throw new Error(`HTN 未知任务: ${id}`);

    if (t.type === 'primitive') {
      if (t.conditions?.length && !satBits(ws, t.conditions, bits)) {
        trace.push({ kind: 'cond_fail', task: id, depth });
        return { ok: false, bits };
      }
      commands.push({
        name: t.command, params: { ...(t.params || {}), origin: 'htn' },
        taskId: id, execConditions: t.execConditions || null, effects: t.effects || null,
      });
      const nb = t.effects?.length ? ws.applyEffects(t.effects, bits) : bits;
      trace.push({ kind: 'primitive', task: id, command: t.command, effects: t.effects || null, depth });
      return { ok: true, bits: nb };
    }

    // compound：任务级条件先行校验
    if (t.conditions?.length && !satBits(ws, t.conditions, bits)) {
      trace.push({ kind: 'cond_fail', task: id, depth });
      return { ok: false, bits };
    }
    // method 过滤（前置条件对当前模拟位）+ 可选 utility chooser 排序
    let methods = (t.methods || [])
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => !m.conditions?.length || satBits(ws, m.conditions, bits));
    if (opts.chooser) methods = [...methods].sort((a, b) => (opts.chooser(b.m, ws) ?? 0) - (opts.chooser(a.m, ws) ?? 0));

    for (const { m, i } of methods) {
      trace.push({ kind: 'method', task: id, method: m.name, index: i, depth });
      mtr.push({ task: id, index: i, method: m.name });
      const cmdSnap = commands.length, mtrSnap = mtr.length;
      let cur = bits, ok = true;
      for (const sub of m.subtasks || []) {
        const r = expand(sub, cur, depth + 1, [...stack, id]);
        if (!r.ok) { ok = false; break; }
        cur = r.bits;
      }
      if (ok) return { ok: true, bits: cur };
      commands.length = cmdSnap; // 该方法分解失败：回滚指令与 MTR，尝试下一方法
      mtr.length = mtrSnap;
      trace.push({ kind: 'fallback', task: id, method: m.name, depth });
    }
    return { ok: false, bits };
  }

  const r = expand(startTask, ws.bits, 1, []);
  if (!r.ok) return null;
  return { goal, commands, trace, mtr, finalBits: r.bits };
}

// HTN 执行器：选 goal → 分解 → 逐条下达指令；执行条件失效/指令失败 → 整体重分解。
// replanInterval：分解节流（战略重规划是低频事件，避免每 tick 空转/刷屏）。
export function createHtnController({ domain, goalScore = null, chooser = null, onEvent, replanInterval = 8 }) {
  return {
    queue: [], goal: null, current: null, nextPlanAt: 0, lastTrace: null,
    tick(agent, ctx) {
      const now = ctx?.time ?? 0;
      const ws = agent.knowledge.ws;
      // 执行条件（Fluid executing conditions）：当前任务执行中失效 → 立即作废重分解
      if (this.current?.execConditions?.length && !ws.satisfies(this.current.execConditions)) {
        onEvent?.({ type: 'htn_exec_condition_failed', agent: agent.id, task: this.current.taskId });
        this.queue = []; this.current = null;
      }
      if (!this.queue.length) {
        if (now < this.nextPlanAt) return null;
        this.nextPlanAt = now + replanInterval;
        const plan = htnPlanGoal(domain, ws, { goalScore, chooser });
        if (!plan) { onEvent?.({ type: 'htn_no_plan', agent: agent.id }); return null; }
        this.goal = plan.goal; this.queue = plan.commands; this.lastTrace = plan.trace;
        // Permanent 效果：规划期直接永久落地
        for (const c of plan.commands) {
          for (const e of c.effects || []) if (e.type === 'permanent') ws.set(e.bit, e.val !== false);
        }
        onEvent?.({ type: 'htn_planned', agent: agent.id, goal: plan.goal?.id, goalName: plan.goal?.name, trace: plan.trace });
        if (!this.queue.length) return null; // 分解成功但零指令（兜底待机方法）：下周期再规划
      }
      const st = ctx.commands.status();
      if (st === 'idle' || st === 'done' || st === 'failed') {
        if (st === 'failed') { this.queue = []; this.current = null; onEvent?.({ type: 'htn_failed', agent: agent.id }); return null; }
        if (st === 'done' && this.current) {
          // PlanAndExecute 效果：任务执行成功时落地
          for (const e of this.current.effects || []) if (e.type === 'plan_execute') ws.set(e.bit, e.val !== false);
        }
        const cmd = this.queue[0];
        ctx.commands.issue(cmd.name, cmd.params, ctx);
        this.current = cmd;
        this.queue.shift();
      }
      return this.queue.length;
    },
  };
}
