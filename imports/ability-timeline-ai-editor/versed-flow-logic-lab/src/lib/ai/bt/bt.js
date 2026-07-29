// BT 运行时 —— 叶子节点 = 模板图（action/condition），与 FSM 复用同一套模板库。
// 树 JSON：{ type: 'selector'|'sequence'|'parallel'|'inverter'|'action'|'condition',
//            children: [], template: '模板id', name }
// action 叶子可以是异步图（latent）——running 状态跨 tick 保持；
// condition 叶子必须同步完成（running 视为 failure）。

import { obtainRun, releaseRun, startRun, tickRun } from '../graph/graphvm.js';

export const BT = { SUCCESS: 'success', FAILURE: 'failure', RUNNING: 'running' };

export function createBtInstance(tree, templates) {
  return { tree, templates, mem: new Map(), activeLeaf: null, activeNode: null, lastStatus: null };
}

function nodeMem(inst, node) {
  let m = inst.mem.get(node);
  if (!m) { m = { i: 0 }; inst.mem.set(node, m); }
  return m;
}

function resetSubtree(inst, node) {
  inst.mem.delete(node);
  for (const c of node.children || []) resetSubtree(inst, c);
}

function tickLeaf(inst, node, ctx, dt) {
  const t = inst.templates[node.template];
  if (!t) { ctx.log?.(`BT 未知模板: ${node.template}`); return BT.FAILURE; }
  // 复用进行中的 run（同一叶子跨 tick）
  if (inst.activeLeaf && inst.activeNode === node) {
    const st = tickRun(inst.activeLeaf, ctx, dt);
    if (st === BT.RUNNING) return BT.RUNNING;
    const out = inst.activeLeaf.output;
    releaseRun(inst.activeLeaf);
    inst.activeLeaf = null; inst.activeNode = null;
    if (node.type === 'condition') return out ? BT.SUCCESS : BT.FAILURE;
    return st === BT.SUCCESS ? BT.SUCCESS : BT.FAILURE;
  }
  const r = obtainRun(t.compiled);
  startRun(r, node.params || {});
  const st = tickRun(r, ctx, dt);
  if (st === BT.RUNNING) {
    if (node.type === 'condition') { releaseRun(r); return BT.FAILURE; }
    inst.activeLeaf = r; inst.activeNode = node;
    return BT.RUNNING;
  }
  const out = r.output;
  releaseRun(r);
  if (node.type === 'condition') return out ? BT.SUCCESS : BT.FAILURE;
  return st === BT.SUCCESS ? BT.SUCCESS : BT.FAILURE;
}

function tickNode(inst, node, ctx, dt) {
  switch (node.type) {
    case 'selector': {
      const m = nodeMem(inst, node);
      for (; m.i < (node.children || []).length; m.i++) {
        const st = tickNode(inst, node.children[m.i], ctx, dt);
        if (st === BT.RUNNING) return BT.RUNNING;
        if (st === BT.SUCCESS) { m.i = 0; return BT.SUCCESS; }
      }
      m.i = 0;
      return BT.FAILURE;
    }
    case 'sequence': {
      const m = nodeMem(inst, node);
      for (; m.i < (node.children || []).length; m.i++) {
        const st = tickNode(inst, node.children[m.i], ctx, dt);
        if (st === BT.RUNNING) return BT.RUNNING;
        if (st === BT.FAILURE) { m.i = 0; return BT.FAILURE; }
      }
      m.i = 0;
      return BT.SUCCESS;
    }
    case 'inverter': {
      const st = tickNode(inst, node.children[0], ctx, dt);
      if (st === BT.RUNNING) return BT.RUNNING;
      return st === BT.SUCCESS ? BT.FAILURE : BT.SUCCESS;
    }
    case 'action':
    case 'condition':
      return tickLeaf(inst, node, ctx, dt);
    default:
      ctx.log?.(`BT 未知节点类型: ${node.type}`);
      return BT.FAILURE;
  }
}

export function tickBt(inst, ctx, dt) {
  // 新 tick 若有跨 tick 的 action，直接从它恢复（其祖先的索引记忆仍有效）
  const st = tickNode(inst, inst.tree, ctx, dt);
  inst.lastStatus = st;
  if (st !== BT.RUNNING) { inst.mem.clear(); inst.activeNode = null; }
  return st;
}
