const tokenText = (token, locale) => {
  if (!token) return '';
  const locales = token.locales || {};
  const language = locale || globalThis.navigator?.language || token.default_locale;
  return locales[language] || locales[language?.split('-')[0]] || locales[token.default_locale] || Object.values(locales)[0] || '';
};

export function createTextTokenResolver(tokens = [], locale) {
  const byId = new Map(tokens.map(token => [token.token_id, token]));
  return (tokenId, args = []) => {
    const text = tokenText(byId.get(tokenId), locale);
    return text.replace(/\{(\d+)\}/g, (_, index) => String(args[Number(index)] ?? ''));
  };
}

export const getItemTags = item => item.catalogTags || item.tags || item.gameplay_tags || Object.keys(item.tag_counts || {}).filter(tag => item.tag_counts[tag] > 0);
const getAttribute = (item, attributeId) => {
  const buffer = item.attribute_buffer || item.attributes || {};
  const raw = Array.isArray(buffer) ? buffer.find(value => value.attribute_id === attributeId) : buffer[attributeId];
  if (raw == null) return null;
  if (typeof raw === 'number') return { current: raw, base: raw };
  return { current: Number(raw.current ?? raw.value ?? raw.final ?? 0), base: Number(raw.base ?? raw.base_value ?? raw.current ?? raw.value ?? 0) };
};
const formatValue = (value, mode) => {
  if (mode === 'current_over_base') return `${value.current}/${value.base}`;
  if (mode === 'integer') return String(Math.round(value.current));
  if (mode === 'decimal') return value.current.toFixed(2);
  return String(value.current);
};

export function createUIItemPresenter(profiles = [], tokens = [], locale) {
  const resolveToken = createTextTokenResolver(tokens, locale);
  const byId = new Map(profiles.map(profile => [profile.profile_id, profile]));
  return {
    resolve(item, itemKind, profileId) {
      const profile = byId.get(profileId);
      const targetId = itemKind === 'ability' ? item.ability_id : item.prototype_id;
      if (!profile || profile.item_kind !== itemKind) return null;
      const definition = (profile.items || []).find(entry => entry.target_id === targetId) || (profile.items || []).find(entry => entry.target_id === '*');
      const text = definition?.text || {};
      const display = {
        title: resolveToken(text.title_token_ref) || targetId,
        subtitle: resolveToken(text.subtitle_token_ref),
        body: resolveToken(text.body_token_ref),
        tooltip: resolveToken(text.tooltip_token_ref),
        iconGlyph: definition?.icon_glyph || '', accentColor: definition?.accent_color || '', badges: [], stats: [],
      };
      const tags = getItemTags(item);
      (profile.tag_text_bindings || []).filter(binding => tags.includes(binding.tag_id)).sort((a, b) => (a.priority || 0) - (b.priority || 0)).forEach(binding => {
        const value = resolveToken(binding.text_token_ref);
        if (!value) return;
        if (binding.slot === 'badge') display.badges.push(value);
        else display[binding.slot] = value;
      });
      (profile.attribute_text_bindings || []).sort((a, b) => (a.priority || 0) - (b.priority || 0)).forEach(binding => {
        const value = getAttribute(item, binding.attribute_id);
        if (!value) return;
        const label = resolveToken(binding.label_token_ref);
        const formatted = formatValue(value, binding.display_mode);
        display.stats.push({ attribute_id: binding.attribute_id, label, value: resolveToken(binding.value_token_ref, [formatted, value.current, value.base]) || formatted });
      });
      return display;
    },
  };
}