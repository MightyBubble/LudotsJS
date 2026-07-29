// 标签工具 —— 状态去语义化：引擎不问 alive，只问标签条件（数据驱动的目标过滤器）。
// 单位有效标签 = unitTags（持久，如 State.Dead）+ tags（施法阶段授予）+ timedTags（限时，如冷却）。
// 冷却没有独立系统：激活时授予 Cooldown.<id> 限时标签，门禁复用 blockedBy —— 语义不重复。

export const effectiveTags = (u, time) => [
  ...(u.unitTags || []),
  ...(u.tags || []),
  ...(u.timedTags || []).filter((t) => t.until > time).map((t) => t.tag),
];

export const grantTimedTag = (u, tag, until) => {
  u.timedTags = (u.timedTags || []).filter((t) => t.tag !== tag);
  u.timedTags.push({ tag, until });
};

// 默认目标过滤器：不带 State.Dead 即可被选中/作用
export const TARGETABLE = { excludeTags: ['State.Dead'] };

export const matchesFilter = (u, time, filter = TARGETABLE) => {
  if (!u) return false;
  const tags = effectiveTags(u, time);
  if ((filter.excludeTags || []).some((t) => tags.includes(t))) return false;
  return (filter.requireTags || []).every((t) => tags.includes(t));
};