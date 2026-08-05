import { useQueries } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const defs = [
  ['performers', 'Performer', 'performer_id', 'label'],
  ['meshes', 'PresentationMeshAsset', 'asset_id'],
  ['materials', 'PresentationMaterialAsset', 'asset_id'],
  ['vfxAssets', 'PresentationEffectAsset', 'asset_id'],
  ['clips', 'AnimationClipAsset', 'asset_id'],
  ['controllers', 'AnimatorControllerDefinition', 'controller_id'],
  ['profiles', 'AnimationProfileDefinition', 'profile_id'],
  ['tokens', 'PresentationTextToken', 'token_id'],
  ['hostAssets', 'HostAssetBinding', 'asset_id', 'binding_id'],
  ['attributes', 'Attribute', 'attribute_id', 'name'],
  ['tags', 'GameplayTag', 'full_path', 'name'],
  ['effects', 'Effect', 'effect_id'],
  ['abilities', 'Ability', 'ability_id'],
  ['prototypes', 'EntityPrototype', 'prototype_id', 'name'],
  ['collections', 'EntityCollection', 'collection_key', 'label'],
];

export default function usePresentationRefs() {
  const results = useQueries({ queries: defs.map(([, entity]) => ({ queryKey: ['presentation-ref', entity], queryFn: () => base44.entities[entity].list() })) });
  const refs = {};
  defs.forEach(([name,, key, label], i) => {
    refs[name] = (results[i].data || []).map(r => ({ value: r[key], label: label && r[label] ? `${r[label]} · ${r[key]}` : r[key], record: r })).filter(o => o.value);
  });
  refs.logicalAssets = [...refs.meshes, ...refs.materials, ...refs.vfxAssets, ...refs.clips, ...refs.hostAssets]
    .filter((o, i, all) => all.findIndex(x => x.value === o.value) === i);
  refs.eventKeys = [...refs.tags, ...refs.attributes];
  return refs;
}