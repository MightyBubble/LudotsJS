export function createEntityAppearanceResolver({ prototypes = [], performers = [], hostBindings = [], assets = [], meshAssets = [] }) {
  const prototypeMap = new Map(prototypes.map(item => [item.prototype_id, item]));
  const performerMap = new Map(performers.map(item => [item.performer_id, item]));
  const assetMap = new Map(assets.map(item => [item.asset_id, item]));
  const meshMap = new Map(meshAssets.map(item => [item.asset_id, item]));
  return (prototypeId) => {
    const prototype = prototypeMap.get(prototypeId);
    const performer = performerMap.get(prototype?.performer_ref);
    if (!performer) return { kind: 'missing', label: '无 asset' };
    const behavior = (performer.behaviors || []).find(item => item.kind === 'AssetBinding' && item.activeByDefault !== false && item.assetBinding?.assetId);
    const logicalId = behavior?.assetBinding?.assetId;
    const host = hostBindings.find(item => item.asset_id === logicalId && item.backend_id === 'browser') || hostBindings.find(item => item.asset_id === logicalId);
    const editorAsset = assetMap.get(host?.editor_asset_id);
    const uri = host?.source_uris?.[0] || editorAsset?.uri || meshMap.get(logicalId)?.source_uris?.[0];
    if (!uri) return { kind: 'missing', label: '无 asset' };
    return { kind: 'model', uri, resourceMap: editorAsset?.metadata?.resource_map || {}, scale: behavior.assetBinding?.localScale };
  };
}