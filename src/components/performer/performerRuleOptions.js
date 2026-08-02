export const EVENT_KIND_OPTIONS = [
  'GameplayEvent', 'TagEffectiveChanged', 'EntitySpawned', 'EntityDestroyed',
  'ProjectileSpawned', 'EffectApplied', 'EffectActivated', 'CastCommitted', 'CastFailed',
  'EntityCollectionMemberAdded', 'EntityCollectionMemberRemoved',
  'AbilityAimBegun', 'AbilityAimSlotAdvanced', 'AbilityAimUpdated', 'AbilityAimEnded',
  'MovePathBegun', 'MovePathUpdated', 'MovePathEnded',
  'WorldOverlayUpdated', 'WorldOverlayEnded', 'WorldHudUpdated', 'WorldHudEnded',
  'WorldSplineUpdated', 'WorldSplineEnded',
].map(value => ({ value, label: value }));

export const INLINE_CONDITION_OPTIONS = [
  'None', 'SourceIsLocalPlayer', 'TargetIsLocalPlayer', 'SourceIsAlive', 'TargetIsAlive',
  'TagGained', 'TagLost', 'OwnerCullVisible', 'SourceHasAttributes',
  'SourceHasVisualTransform', 'EventMagnitudePositive', 'EventMagnitudeNonPositive',
].map(value => ({ value, label: value }));

const ENTITY_EVENTS = new Set(['EntitySpawned', 'EntityDestroyed']);
const EFFECT_EVENTS = new Set(['ProjectileSpawned', 'EffectApplied', 'EffectActivated']);
const ABILITY_EVENTS = new Set(['CastCommitted', 'CastFailed']);
const COLLECTION_EVENTS = new Set(['EntityCollectionMemberAdded', 'EntityCollectionMemberRemoved']);

export function getEventKeyOptions(kind, refs) {
  const wildcard = { value: '*', label: '* · 任意事件键' };
  if (ENTITY_EVENTS.has(kind)) return [wildcard, ...(refs.prototypes || [])];
  if (EFFECT_EVENTS.has(kind)) return [wildcard, ...(refs.effects || [])];
  if (ABILITY_EVENTS.has(kind)) return [wildcard, ...(refs.abilities || [])];
  if (COLLECTION_EVENTS.has(kind)) return [wildcard, ...(refs.collections || [])];
  return [wildcard, ...(refs.tags || [])];
}