import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

const packs = {
  'kenney-blocky': { label: 'Kenney Blocky Characters', namespace: 'Kenney.Blocky', source: 'https://kenney.nl/media/pages/assets/blocky-characters/8369c0cf30-1749547469/kenney_blocky-characters_20.zip', page: 'https://kenney.nl/assets/blocky-characters', kind: 'model', include: /\.(glb|gltf)$/i },
  'kenney-protagonists': { label: 'Kenney Animated Characters Protagonists', namespace: 'Kenney.Protagonists', source: 'https://kenney.nl/media/pages/assets/animated-characters-protagonists/608191acc4-1774773108/kenney_animated-characters-protagonists.zip', page: 'https://kenney.nl/assets/animated-characters-protagonists', kind: 'model', include: /\.(glb|gltf)$/i },
  'kenney-survivors': { label: 'Kenney Animated Characters Survivors', namespace: 'Kenney.Survivors', source: 'https://kenney.nl/media/pages/assets/animated-characters-survivors/27b16052a7-1774772958/kenney_animated-characters-survivors.zip', page: 'https://kenney.nl/assets/animated-characters-survivors', kind: 'model', include: /\.(glb|gltf)$/i },
  'kaykit-adventurers': { label: 'KayKit Adventurers', namespace: 'KayKit.Adventurers', source: 'https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/archive/refs/heads/main.zip', page: 'https://kaylousberg.itch.io/kaykit-adventurers', kind: 'model', include: /\/Characters\/gltf\/.*\.(glb|gltf)$/i },
  'quaternius-base': { label: 'Quaternius Universal Base Characters', namespace: 'Quaternius.BaseCharacters', itchSlug: 'universal-base-characters', page: 'https://quaternius.com/packs/universalbasecharacters.html', kind: 'model', include: /\.(glb|gltf)$/i },
  'quaternius-animations': { label: 'Quaternius Universal Animation Library 2', namespace: 'Quaternius.AnimationLibrary2', itchSlug: 'universal-animation-library-2', page: 'https://quaternius.com/packs/universalanimationlibrary2.html', kind: 'animation', include: /\.(glb|gltf)$/i },
};

const cleanId = (value) => value.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.|\.$/g, '');
const basename = (path) => path.split('/').pop();
const dirname = (path) => path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '';
const mimeType = (path) => /\.png$/i.test(path) ? 'image/png' : /\.jpe?g$/i.test(path) ? 'image/jpeg' : /\.gltf$/i.test(path) ? 'model/gltf+json' : /\.glb$/i.test(path) ? 'model/gltf-binary' : 'application/octet-stream';
const modelReferences = async (file) => {
  let document;
  if (/\.gltf$/i.test(file.name)) document = JSON.parse(await file.async('text'));
  if (/\.glb$/i.test(file.name)) {
    const bytes = await file.async('uint8array');
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(0, true) === 0x46546c67 && view.getUint32(16, true) === 0x4e4f534a) {
      const length = view.getUint32(12, true);
      document = JSON.parse(new TextDecoder().decode(bytes.slice(20, 20 + length)).replace(/\0/g, '').trim());
    }
  }
  return [...(document?.buffers || []).map(item => item.uri), ...(document?.images || []).map(item => item.uri)].filter(uri => uri && !uri.startsWith('data:'));
};
const chunks = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

async function getItchArchive(slug) {
  const purchase = await fetch(`https://quaternius.itch.io/${slug}/purchase`);
  const purchaseHtml = await purchase.text();
  const csrf = purchaseHtml.match(/meta name="csrf_token" value="([^"]+)"/)?.[1];
  const cookie = purchase.headers.get('set-cookie')?.split(';')[0] || '';
  if (!csrf) throw new Error(`Unable to open ${slug} download page`);
  const tokenResponse = await fetch(`https://quaternius.itch.io/${slug}/download_url`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
    body: new URLSearchParams({ csrf_token: csrf }).toString(),
  });
  const tokenData = await tokenResponse.json();
  const downloadPage = await fetch(tokenData.url, { headers: { cookie } });
  const downloadHtml = await downloadPage.text();
  const uploadId = downloadHtml.match(/data-upload_id="(\d+)"/)?.[1];
  const pageCsrf = downloadHtml.match(/meta name="csrf_token" value="([^"]+)"/)?.[1];
  if (!uploadId || !pageCsrf) throw new Error(`Unable to find ${slug} standard archive`);
  const fileResponse = await fetch(`https://quaternius.itch.io/${slug}/file/${uploadId}?source=game_download`, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', cookie },
    body: new URLSearchParams({ csrf_token: pageCsrf }).toString(),
  });
  const fileData = await fileResponse.json();
  if (!fileData.url) throw new Error(`Unable to generate ${slug} archive URL`);
  return fetch(fileData.url);
}

async function uploadFile(base44, bytes, name) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([bytes], name, { type: mimeType(name) }) });
    } catch (error) {
      if (attempt === 2 || !error.message.includes('Rate limit')) throw error;
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const payload = await req.json();
    const pack = packs[payload.pack];
    if (!pack) return Response.json({ error: 'Unknown pack', available: Object.keys(packs) }, { status: 400 });
    const limit = Math.min(50, Math.max(1, Number(payload.limit) || 20));
    const archiveResponse = pack.itchSlug ? await getItchArchive(pack.itchSlug) : await fetch(pack.source);
    if (!archiveResponse.ok) throw new Error(`Archive download failed: ${archiveResponse.status}`);
    const archive = await JSZip.loadAsync(await archiveResponse.arrayBuffer());
    const allFiles = Object.values(archive.files).filter(file => !file.dir);
    const candidates = allFiles.filter(file => pack.include.test(file.name) && !/\/(Unity|Unreal|Godot)\//i.test(file.name)).sort((a, b) => a.name.localeCompare(b.name));
    const [assets, meshes, bindings, clips] = await Promise.all([
      base44.asServiceRole.entities.Asset.list('-created_date', 5000),
      base44.asServiceRole.entities.PresentationMeshAsset.list('-created_date', 5000),
      base44.asServiceRole.entities.HostAssetBinding.list('-created_date', 5000),
      base44.asServiceRole.entities.AnimationClipAsset.list('-created_date', 5000),
    ]);
    const assetIds = new Set(assets.map(item => item.asset_id));
    const meshIds = new Set(meshes.map(item => item.asset_id));
    const bindingIds = new Set(bindings.map(item => item.binding_id));
    const clipIds = new Set(clips.map(item => item.asset_id));
    const remaining = candidates.filter(file => !assetIds.has(`Asset.CC0.${pack.namespace}.${cleanId(file.name)}`));
    const repairable = candidates.filter(file => {
      const existing = assets.find(item => item.asset_id === `Asset.CC0.${pack.namespace}.${cleanId(file.name)}`);
      return existing && !Object.keys(existing.metadata?.resource_map || {}).length;
    });
    const selected = (payload.repairExisting ? repairable : remaining).slice(0, limit);
    const createdAssets = [];
    const updatedAssets = [];
    const createdMeshes = [];
    const createdBindings = [];
    const createdClips = [];
    const failures = [];

    for (const file of selected) {
      try {
        const sourceKey = cleanId(file.name);
        const assetId = `Asset.CC0.${pack.namespace}.${sourceKey}`;
        const existingAsset = assets.find(item => item.asset_id === assetId);
        const resourceMap = {};
        const references = await modelReferences(file);
        if (references.length) {
          for (const reference of [...new Set(references)]) {
            const decoded = decodeURIComponent(reference);
            const dependencyPath = `${dirname(file.name)}${decoded}`.replace(/\/\.\//g, '/');
            const dependency = archive.file(dependencyPath) || allFiles.find(item => item.name.endsWith(decoded));
            if (!dependency) continue;
            const dependencyId = `Asset.CC0.${pack.namespace}.Resource.${cleanId(dependency.name)}`;
            let dependencyUri = assets.find(item => item.asset_id === dependencyId)?.uri;
            if (!dependencyUri) {
              const upload = await uploadFile(base44, await dependency.async('uint8array'), `${payload.pack}-${basename(dependency.name)}`);
              dependencyUri = upload.file_url;
              createdAssets.push({ asset_id: dependencyId, name: basename(dependency.name), description: `${pack.label} CC0 resource`, asset_type: /\.(png|jpe?g)$/i.test(dependency.name) ? 'image' : 'data', source_type: 'uploaded', uri: dependencyUri, preview_uri: /\.(png|jpe?g)$/i.test(dependency.name) ? dependencyUri : undefined, tags: ['cc0', payload.pack, 'character-resource'], metadata: { license: 'CC0-1.0', package_slug: payload.pack, package_label: pack.label, source_path: dependency.name, official_url: pack.page }, version: 1, is_active: true });
            }
            resourceMap[decoded] = dependencyUri;
          }
        }
        const upload = existingAsset ? { file_url: existingAsset.uri } : await uploadFile(base44, await file.async('uint8array'), `${payload.pack}-${basename(file.name)}`);
        const label = basename(file.name).replace(/\.[^.]+$/, '');
        if (existingAsset) updatedAssets.push({ id: existingAsset.id, metadata: { ...(existingAsset.metadata || {}), resource_map: resourceMap } });
        else createdAssets.push({ asset_id: assetId, name: `${pack.label} · ${label}`, description: `${pack.label} CC0 ${pack.kind}`, asset_type: pack.kind, source_type: 'uploaded', uri: upload.file_url, tags: ['cc0', payload.pack, 'humanoid', pack.kind === 'animation' ? 'animation' : 'rigged'], metadata: { license: 'CC0-1.0', package_slug: payload.pack, package_label: pack.label, source_path: file.name, official_url: pack.page, resource_map: resourceMap }, import_settings: { preferred_format: file.name.split('.').pop().toLowerCase(), lazy_load: true }, version: 1, is_active: true });
        if (pack.kind === 'model') {
          const meshId = `Mesh.CC0.${pack.namespace}.${sourceKey}`;
          const bindingId = `Host.Browser.CC0.${pack.namespace}.${sourceKey}`;
          if (!meshIds.has(meshId)) createdMeshes.push({ asset_id: meshId, type: 'Source', source_uris: [upload.file_url] });
          if (!bindingIds.has(bindingId)) createdBindings.push({ binding_id: bindingId, asset_kind: 'SkinnedMesh', asset_id: meshId, backend_id: 'browser', source_uris: [upload.file_url], editor_asset_id: assetId });
        } else {
          const clipId = `Animation.CC0.${pack.namespace}.${sourceKey}`;
          if (!clipIds.has(clipId)) createdClips.push({ asset_id: clipId, asset_kind: 'Clip', locators: [{ backend_id: 'browser', asset_ref: assetId }], blend_inputs: [] });
        }
      } catch (error) {
        failures.push({ file: file.name, error: error.message });
      }
    }
    for (const batch of chunks(createdAssets, 500)) if (batch.length) await base44.asServiceRole.entities.Asset.bulkCreate(batch);
    for (const batch of chunks(updatedAssets, 500)) if (batch.length) await base44.asServiceRole.entities.Asset.bulkUpdate(batch);
    for (const batch of chunks(createdMeshes, 500)) if (batch.length) await base44.asServiceRole.entities.PresentationMeshAsset.bulkCreate(batch);
    for (const batch of chunks(createdBindings, 500)) if (batch.length) await base44.asServiceRole.entities.HostAssetBinding.bulkCreate(batch);
    for (const batch of chunks(createdClips, 500)) if (batch.length) await base44.asServiceRole.entities.AnimationClipAsset.bulkCreate(batch);
    return Response.json({ pack: payload.pack, total: candidates.length, processed: selected.length, assetsCreated: createdAssets.length, assetsRepaired: updatedAssets.length, modelsCreated: createdMeshes.length, animationsCreated: createdClips.length, failures, remaining: Math.max(0, remaining.length - selected.length) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}