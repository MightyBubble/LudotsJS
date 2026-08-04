import { createPerformerRuntime } from '@/lib/runtime/performerRuntime';

export function createEntityAppearanceResolver({ prototypes = [], performers = [], hostBindings = [], assets = [], meshAssets = [] }) {
  const prototypeMap = new Map(prototypes.map(item => [item.prototype_id, item]));
  const assetMap = new Map(assets.map(item => [item.asset_id, item]));
  const meshMap = new Map(meshAssets.map(item => [item.asset_id, item]));
  const runtime = createPerformerRuntime(performers);
  const resolveAsset = (logicalId) => {
    const host = hostBindings.find(item => item.asset_id === logicalId && item.backend_id === 'browser') || hostBindings.find(item => item.asset_id === logicalId);
    const editorAsset = assetMap.get(host?.editor_asset_id);
    const uri = host?.source_uris?.[0] || editorAsset?.uri || meshMap.get(logicalId)?.source_uris?.[0];
    return uri ? { uri, resourceMap: editorAsset?.metadata?.resource_map || {} } : null;
  };
  const resolveNode = (node) => ({
    definitionId: node.definitionId,
    behaviors: (node.behaviors || []).map(behavior => {
      if (behavior.kind !== 'AssetBinding' || !behavior.assetBinding?.assetId) return behavior;
      return { ...behavior, resolvedAsset: resolveAsset(behavior.assetBinding.assetId) };
    }),
    children: (node.children || []).map(resolveNode),
  });
  return (prototypeId) => {
    const definitionId = prototypeMap.get(prototypeId)?.performer_ref;
    if (!definitionId) return { kind: 'missing', label: '无 asset' };
    return { kind: 'performer', tree: resolveNode(runtime.instantiate(definitionId).snapshot()) };
  };
}