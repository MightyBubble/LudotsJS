const TOP_LEVEL_FIELDS = ['ability_id','exec','onActivateEffects','blockTags','catalogTags','interactionContextProfile','activationPrecondition','toggleSpec','targeting','presentation','input','useRequirement','showRequirement'];

export function toAbilityContract(record) {
  return Object.fromEntries(TOP_LEVEL_FIELDS.filter(key => record[key] !== undefined).map(key => [key, record[key]]));
}

export function getAbilityDisplayName(record) {
  return record.presentation?.displayName || record.presentation?.displayNameToken || record.ability_id || 'Ability';
}