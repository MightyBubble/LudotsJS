// 姿态行为图 —— 姿态有效配置（autocast × chase × leash）→ GraphVM 可执行图（数据推导图）。
//
// 与 deriveSubFlow（文档图）同一哲学：改配置即改图，无死配置 —— 但这里生成的是
// **引擎每 tick 实执行的实现图**：姿态行为不再有引擎硬编码分支，判定链（索敌→射程门→
// 接战/并行出手/锚点归位）全部以节点连线表达，逐节点可追溯（trace）。
//
// 生成结构（每个叶状态一张，编译缓存于规整机上）：
//   start → 锚点归位 ──returning──→ exit（归位途中抑制接战，与「返回」子状态同语义）
//           └─idle→ 闸门 ─┬ idle:候选接战链（顺序=优先级，首命中即产指令→exit）
//                        └ busyQueue:候选并行链（异轨并行出手，首命中→exit）
//   候选接战链每环：索敌 → found? →（chase=false 加射程门）→ 接战(leash 落锚) → exit
//
// 查找链（stanceBehaviorOf）：显式 behavior/action（GraphDef/模板名）→ 命名约定
// GraphDef 资产 stance.behavior.<叶路径>（stanceBehaviorDefs.js 幂等 seed 落库，可编辑）。
// 无运行时生成兜底：图资产缺失即显式报错 —— 行为真相源永远是图本身；
// buildStanceBehaviorGraph 只是种子/「从配置重新生成」的模板生成器。
import { compileGraph } from '@/lib/ai/graph/graphvm.js';
import '@/lib/ai/graph/nodes.js'; // 注册内置节点库（flow/data/kb…，幂等）
import './labNodes.js'; // 注册实验室节点词汇

export function buildStanceBehaviorGraph(stKey, st) {
  const cands = st.autocast || [];
  const nodes = [
    { id: 's', type: 'flow.start' },
    { id: 'ar', type: 'lab.anchorReturn' },
    { id: 'g', type: 'lab.gates' },
    { id: 'brIdle', type: 'flow.branch' },
    { id: 'brBusy', type: 'flow.branch' },
    { id: 'ok', type: 'flow.exit', props: { status: 'success' } },
  ];
  const links = [
    { from: ['s', 'then'], to: ['ar', 'exec'] },
    { from: ['ar', 'returning'], to: ['ok', 'exec'] },
    { from: ['ar', 'idle'], to: ['brIdle', 'exec'] },
    { from: ['g', 'idle'], to: ['brIdle', 'cond'] },
    { from: ['g', 'busyQueue'], to: ['brBusy', 'cond'] },
    { from: ['brIdle', 'false'], to: ['brBusy', 'exec'] },
    { from: ['brBusy', 'false'], to: ['ok', 'exec'] },
  ];
  if (st.leash) nodes.push({ id: 'leash', type: 'data.const', props: { value: st.leash } });

  // ── 候选接战链（idle 分支）：顺序 = 候选声明顺序 = 优先级；失败出口汇接下一环 ──
  let failOuts = [['brIdle', 'true']];
  cands.forEach((c, i) => {
    const ct = `ct${i}`, brc = `brc${i}`, eng = `eng${i}`;
    nodes.push({ id: ct, type: 'lab.candTarget', props: candProps(c) });
    nodes.push({ id: brc, type: 'flow.branch' });
    for (const f of failOuts) links.push({ from: f, to: [brc, 'exec'] });
    links.push({ from: [ct, 'found'], to: [brc, 'cond'] });
    let enter = [brc, 'true'];
    const nextFails = [[brc, 'false']];
    // chase=false：射程门（仅射程内接战，子状态图无「追击」）
    if (st.chase === false) {
      const rg = `rg${i}`, cmp = `cmp${i}`, brl = `brl${i}`;
      nodes.push({ id: rg, type: 'lab.abilityRange', props: { ability: c.ability } });
      nodes.push({ id: cmp, type: 'data.compare', props: { op: '<=' } });
      nodes.push({ id: brl, type: 'flow.branch' });
      links.push({ from: enter, to: [brl, 'exec'] });
      links.push({ from: [ct, 'dist'], to: [cmp, 'a'] });
      links.push({ from: [rg, 'value'], to: [cmp, 'b'] });
      links.push({ from: [cmp, 'value'], to: [brl, 'cond'] });
      enter = [brl, 'true'];
      nextFails.push([brl, 'false']);
    }
    nodes.push({ id: eng, type: 'lab.engage', props: candProps(c) });
    links.push({ from: enter, to: [eng, 'exec'] });
    links.push({ from: [ct, 'target'], to: [eng, 'target'] });
    if (st.leash) links.push({ from: ['leash', 'value'], to: [eng, 'leash'] });
    links.push({ from: [eng, 'then'], to: ['ok', 'exec'] });
    failOuts = nextFails;
  });
  for (const f of failOuts) links.push({ from: f, to: ['ok', 'exec'] });

  // ── 候选并行链（busyQueue 分支）：异轨并行，原地出手 ──
  let prevP = ['brBusy', 'true'];
  cands.forEach((c, i) => {
    const tp = `tp${i}`, brp = `brp${i}`;
    nodes.push({ id: tp, type: 'lab.tryParallel', props: candProps(c) });
    nodes.push({ id: brp, type: 'flow.branch' });
    links.push({ from: prevP, to: [brp, 'exec'] });
    links.push({ from: [tp, 'casted'], to: [brp, 'cond'] });
    links.push({ from: [brp, 'true'], to: ['ok', 'exec'] });
    prevP = [brp, 'false'];
  });
  links.push({ from: prevP, to: ['ok', 'exec'] });

  return {
    name: `stance.behavior.${stKey}`, kind: 'action',
    inputs: [], outputs: [], nodes, links,
  };
}

const candProps = (c) => ({
  ability: c.ability, trigger: c.trigger || 'seen',
  ...(c.within ? { within: c.within } : {}),
  ...(c.selector ? { selector: c.selector } : {}),
});

// 取叶状态行为图（编译缓存）：显式 behavior/action → 命名约定 GraphDef
// （stance.behavior.<key>，seed 落库的真图资产）。缺失即抛错 —— 无生成兜底。
export function stanceBehaviorOf(st, resolve) {
  if (st._behaviorCompiled) return st._behaviorCompiled;
  const ref = st.behavior || st.action || `stance.behavior.${st.key}`;
  const g = resolve?.(ref);
  const raw = g?.graph || g?.data || g;
  if (!raw?.nodes) throw new Error(`缺少姿态行为图资产「${ref}」—— 行为图是唯一真相，请在 FSM 编辑器生成/挂载后再运行`);
  st._behaviorCompiled = compileGraph(raw, resolve);
  return st._behaviorCompiled;
}