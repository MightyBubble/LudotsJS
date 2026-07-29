// 图自动布局 —— 为没有坐标的模板图（内置/实体老数据）计算蓝图式排版。
// 规则：exec 链从左到右分层（BFS），数据节点挂在其消费者上方；孤立节点排底部网格。
// 已带坐标的图原样返回（用户排版优先）。
export function autoLayoutGraph(g, force = false) {
  if (!g?.nodes?.length) return g;
  if (!force && g.nodes.some((n) => n.x !== undefined || n.y !== undefined)) return g;

  const links = g.links || [];
  const execOut = new Map(); // nid -> [nid]
  const hasExecIn = new Set();
  const inExec = new Set();
  for (const l of links) {
    if (l.to?.[1] === 'exec') {
      (execOut.get(l.from[0]) || execOut.set(l.from[0], []).get(l.from[0])).push(l.to[0]);
      hasExecIn.add(l.to[0]);
      inExec.add(l.from[0]); inExec.add(l.to[0]);
    }
  }
  // 分层 BFS（允许数据节点借 exec 起始点；环用 visited 截断）
  const layer = new Map();
  const queue = g.nodes.filter((n) => inExec.has(n.id) && !hasExecIn.has(n.id)).map((n) => n.id);
  if (!queue.length && inExec.size) queue.push([...inExec][0]);
  for (const id of queue) layer.set(id, 0);
  let q = [...queue];
  while (q.length) {
    const cur = q.shift();
    const cl = layer.get(cur) ?? 0;
    for (const nxt of execOut.get(cur) || []) {
      if (!layer.has(nxt) || layer.get(nxt) < cl + 1) {
        layer.set(nxt, cl + 1);
        q.push(nxt);
      }
    }
  }
  // 每层纵向编号
  const perLayer = new Map();
  const pos = new Map();
  for (const n of g.nodes) {
    if (!layer.has(n.id)) continue;
    const ly = layer.get(n.id);
    const idx = perLayer.get(ly) || 0;
    perLayer.set(ly, idx + 1);
    pos.set(n.id, { x: 60 + ly * 260, y: 90 + idx * 120 });
  }
  // 数据节点：挂到首个消费者的正上方（逐个堆叠）
  const dataConsumer = new Map(); // nid -> consumerNid
  for (const l of links) {
    if (l.to?.[1] !== 'exec' && pos.has(l.to[0]) && !pos.has(l.from[0]) && !dataConsumer.has(l.from[0])) {
      dataConsumer.set(l.from[0], l.to[0]);
    }
  }
  const stackCount = new Map();
  for (const n of g.nodes) {
    if (pos.has(n.id)) continue;
    const cons = dataConsumer.get(n.id);
    if (cons) {
      const k = stackCount.get(cons) || 0;
      stackCount.set(cons, k + 1);
      pos.set(n.id, { x: pos.get(cons).x, y: Math.max(30, pos.get(cons).y - 90 * (k + 1)) });
    }
  }
  // 剩余孤立节点：底部网格
  let iso = 0;
  for (const n of g.nodes) {
    if (!pos.has(n.id)) pos.set(n.id, { x: 60 + (iso % 6) * 220, y: 480 + Math.floor(iso / 6) * 120 });
    if (!pos.has(n.id)) iso++;
    else iso++;
  }
  for (const n of g.nodes) { const p = pos.get(n.id); n.x = p.x; n.y = p.y; }
  return g;
}
