const MODEL_EXTENSIONS = ['glb', 'gltf', 'fbx'];

export const assetExtension = asset => (asset?.uri || asset?.metadata?.source_path || '').split(/[?#]/)[0].split('.').pop()?.toLowerCase() || '';

export const isAnimationSource = asset => asset?.asset_type === 'animation' || (asset?.asset_type === 'model' && MODEL_EXTENSIONS.includes(assetExtension(asset)));

export const sourceBaseForBackend = (asset, backendId) => {
  if (!asset) return '';
  if (backendId === 'browser') return asset.uri || '';
  if (backendId === 'ue5') return asset.metadata?.ue5_asset_path || asset.metadata?.unreal_asset_path || asset.uri || '';
  return asset.metadata?.runtime_uri || asset.metadata?.source_path || asset.uri || '';
};

export const clipNameFromRef = assetRef => {
  const match = String(assetRef || '').match(/#anim:([^#]+)$/);
  return match ? decodeURIComponent(match[1]) : '';
};

export const withClipName = (base, clipName) => clipName ? `${String(base || '').replace(/#anim:[^#]+$/, '')}#anim:${encodeURIComponent(clipName)}` : String(base || '').replace(/#anim:[^#]+$/, '');

export const findLocatorAsset = (locator, assets) => {
  const base = String(locator?.asset_ref || '').replace(/#anim:[^#]+$/, '');
  return assets.find(asset => [asset.uri, asset.metadata?.runtime_uri, asset.metadata?.source_path, asset.metadata?.ue5_asset_path, asset.metadata?.unreal_asset_path].filter(Boolean).includes(base));
};