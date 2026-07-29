// 内置模板固化 —— 标准库图 JSON 落库为 GraphDef 实体（幂等：缺名才建）。
// 落库后图库只有一种图：实体。代码里的 BUILTIN_TEMPLATES / TEMPLATES_4X 退化为
// 冷启动种子（空库第一次打开图实验室时自动补齐），不再是并行的"第二来源"。
import { BUILTIN_TEMPLATES } from './library.js';
import { TEMPLATES_4X } from '../world4x/templates4x.js';

export async function ensureBuiltinGraphDefs(base44, rows) {
  const have = new Set((rows || []).map((r) => r.name));
  const want = [
    ...BUILTIN_TEMPLATES.map((b) => ({ name: b.graph.name, kind: b.kind || b.graph.kind || 'script', data: b.graph })),
    ...TEMPLATES_4X.map((g) => ({ name: g.name, kind: g.kind || 'script', data: g })),
  ].filter((w) => w.name && !have.has(w.name));
  if (!want.length) return rows || [];
  const created = await base44.entities.GraphDef.bulkCreate(want);
  return [...(rows || []), ...(Array.isArray(created) ? created : want)];
}