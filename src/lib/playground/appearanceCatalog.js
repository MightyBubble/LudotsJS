import { base44 } from '@/api/base44Client';

const unique = (values) => [...new Set(values.filter(Boolean))];

const loadByValues = async (entityName, field, values) => {
  if (!values.length) return [];
  const groups = await Promise.all(values.map(value => base44.entities[entityName].filter({ [field]: value }, '-updated_date', 10)));
  return groups.flat();
};

export async function loadRuntimeAppearanceCatalog() {
  const presenters = await base44.entities.Presenter.list('presenter_id', 500);
  const logicalIds = unique(presenters.flatMap(presenter => (presenter.behaviors || [])
    .filter(behavior => behavior.kind === 'AssetBinding' && behavior.activeByDefault !== false)
    .map(behavior => behavior.assetBinding?.assetId)));
  const [hostBindings, meshAssets] = await Promise.all([
    loadByValues('HostAssetBinding', 'asset_id', logicalIds),
    loadByValues('PresentationMeshAsset', 'asset_id', logicalIds),
  ]);
  const editorAssetIds = unique(hostBindings.map(binding => binding.editor_asset_id));
  const assets = await loadByValues('Asset', 'asset_id', editorAssetIds);
  return { presenters, hostBindings, assets, meshAssets };
}