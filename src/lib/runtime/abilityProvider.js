/**
 * Ability Provider：真实实现。
 * 输入 Ability 领域记录，输出按 ability_id 寻址的只读视图，供 runtime 解析面板按钮。
 */
export function createAbilityProvider(abilities = [], itemPresenter = null) {
  const byId = new Map();
  for (const a of abilities) {
    if (!a?.ability_id) continue;
    byId.set(a.ability_id, {
      ability_id: a.ability_id, catalogTags: a.catalogTags || [], input: a.input || null,
      displayName: a.presentation?.displayName || a.ability_id, iconGlyph: a.presentation?.iconGlyph || '',
      accentColor: a.presentation?.accentColor || '', hintText: a.presentation?.hintText || '', raw: a,
    });
  }
  const present = (ability, profileId) => {
    if (!ability) return null;
    const display = itemPresenter?.resolve(ability.raw, 'ability', profileId);
    return display ? { ...ability, displayName: display.title, iconGlyph: display.iconGlyph, accentColor: display.accentColor, hintText: display.tooltip || display.body, badges: display.badges, stats: display.stats } : ability;
  };
  return {
    get: (id, profileId) => present(byId.get(id), profileId),
    has: id => byId.has(id),
    /** 一个实体授予的全部技能（保持 ability_ids 顺序），未登记的 id 以 null 占位由调用方报错 */
    listForEntity: (entity, profileId) => (entity?.ability_ids || []).map(id => ({ ability_id: id, ability: present(byId.get(id), profileId) })),
    size: byId.size,
  };
}