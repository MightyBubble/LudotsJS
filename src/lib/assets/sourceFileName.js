export function getSourceFileName(asset) {
  const sourcePath = asset?.metadata?.source_path;
  if (sourcePath) return sourcePath.split('/').filter(Boolean).pop();
  const displayName = asset?.name?.split(' · ').pop();
  if (displayName) return displayName;
  return '未命名文件';
}