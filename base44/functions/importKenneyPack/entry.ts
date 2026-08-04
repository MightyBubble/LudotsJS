import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

const packs = {
  'mini-dungeon': { label: 'Mini Dungeon', namespace: 'MiniDungeon', page: 'mini-dungeon', url: 'https://kenney.nl/media/pages/assets/mini-dungeon/6cd72dc849-1785314274/kenney_mini-dungeon.zip', genres: ['arpg'] },
  'fantasy-town': { label: 'Fantasy Town Kit', namespace: 'FantasyTown', page: 'fantasy-town-kit', url: 'https://kenney.nl/media/pages/assets/fantasy-town-kit/efe948d309-1754222374/kenney_fantasy-town-kit_2.0.zip', genres: ['arpg', 'td', 'rts', 'moba', 'city-sim'] },
  'tower-defense': { label: 'Tower Defense Kit', namespace: 'TowerDefense', page: 'tower-defense-kit', url: 'https://kenney.nl/media/pages/assets/tower-defense-kit/a402493eaa-1726471567/kenney_tower-defense-kit.zip', genres: ['td', 'rts', 'moba'] },
  'castle': { label: 'Castle Kit', namespace: 'Castle', page: 'castle-kit', url: 'https://kenney.nl/media/pages/assets/castle-kit/a395102d20-1711543616/kenney_castle-kit.zip', genres: ['arpg', 'td', 'rts', 'moba'] },
  'space': { label: 'Space Kit', namespace: 'Space', page: 'space-kit', url: 'https://kenney.nl/media/pages/assets/space-kit/20874c75ac-1677698978/kenney_space-kit.zip', genres: ['rts', 'moba'] },
  'nature': { label: 'Nature Kit', namespace: 'Nature', page: 'nature-kit', url: 'https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip', genres: ['arpg', 'td', 'rts', 'moba', 'city-sim'] },
  'city-roads': { label: 'City Kit (Roads)', namespace: 'CityRoads', page: 'city-kit-roads', url: 'https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1741864740/kenney_city-kit-roads.zip', genres: ['city-sim'] },
  'city-commercial': { label: 'City Kit (Commercial)', namespace: 'CityCommercial', page: 'city-kit-commercial', url: 'https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip', genres: ['city-sim'] },
  'city-suburban': { label: 'City Kit (Suburban)', namespace: 'CitySuburban', page: 'city-kit-suburban', url: 'https://kenney.nl/media/pages/assets/city-kit-suburban/2c871b7af2-1745479373/kenney_city-kit-suburban_20.zip', genres: ['city-sim'] },
  'city-industrial': { label: 'City Kit (Industrial)', namespace: 'CityIndustrial', page: 'city-kit-industrial', url: 'https://kenney.nl/media/pages/assets/city-kit-industrial/5fcb837741-1750838303/kenney_city-kit-industrial_1.0.zip', genres: ['city-sim', 'rts'] }
};

const cleanName = (path) => path.split('/').pop().replace(/\.glb$/i, '');
const cleanId = (name) => name.replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.|\.$/g, '');
const chunks = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const payload = await req.json();
    const pack = packs[payload.pack];
    if (!pack) return Response.json({ error: 'Unknown pack', available: Object.keys(packs) }, { status: 400 });
    const offset = Math.max(0, Number(payload.offset) || 0);
    const limit = Math.min(150, Math.max(1, Number(payload.limit) || 100));
    const archiveResponse = await fetch(pack.url);
    if (!archiveResponse.ok) throw new Error(`Download failed: ${archiveResponse.status}`);
    const archive = await JSZip.loadAsync(await archiveResponse.arrayBuffer());
    const allFiles = Object.values(archive.files)
      .filter(file => !file.dir && /\.glb$/i.test(file.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const existing = await base44.asServiceRole.entities.Asset.list('-created_date', 5000);
    const existingIds = new Set(existing.map(item => item.asset_id));
    const existingById = new Map(existing.map(item => [item.asset_id, item]));
    const textureFiles = Object.values(archive.files).filter(file => !file.dir && /(^|\/)Textures\/.+\.(png|jpe?g)$/i.test(file.name));
    const resourceMap = {};
    const textureRows = [];
    for (const file of textureFiles) {
      const marker = file.name.search(/Textures\//i);
      const resourcePath = file.name.slice(marker);
      const textureId = `Asset.Kenney.${pack.namespace}.Texture.${cleanId(resourcePath.replace(/\.(png|jpe?g)$/i, ''))}`;
      let textureUri = existingById.get(textureId)?.uri;
      if (!textureUri) {
        const bytes = await file.async('uint8array');
        const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([bytes], `${payload.pack}-${resourcePath.split('/').join('-')}`, { type: /\.png$/i.test(file.name) ? 'image/png' : 'image/jpeg' }) });
        textureUri = upload.file_url;
        textureRows.push({ asset_id: textureId, name: `${pack.label} · ${resourcePath}`, description: `Kenney ${pack.label} CC0 texture`, asset_type: 'image', source_type: 'uploaded', uri: textureUri, preview_uri: textureUri, tags: ['kenney', `kenney:${payload.pack}`, 'texture', ...pack.genres], metadata: { license: 'CC0-1.0', package_slug: payload.pack, package_label: pack.label, source_path: file.name, official_url: `https://kenney.nl/assets/${pack.page}` }, version: 1, is_active: true });
      }
      resourceMap[resourcePath] = textureUri;
    }
    if (textureRows.length) await base44.asServiceRole.entities.Asset.bulkCreate(textureRows);
    const existingModels = existing.filter(item => item.asset_type === 'model' && item.metadata?.package_slug === payload.pack);
    if (existingModels.length && Object.keys(resourceMap).length) await base44.asServiceRole.entities.Asset.bulkUpdate(existingModels.map(item => ({ id: item.id, metadata: { ...item.metadata, resource_map: resourceMap } })));
    const remainingFiles = allFiles.filter(file => !existingIds.has(`Asset.Kenney.${pack.namespace}.${cleanId(cleanName(file.name))}`));
    const selected = remainingFiles.slice(offset, offset + limit);
    const imported = [];
    const failures = [];
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      const sourceName = cleanName(file.name);
      const suffix = cleanId(sourceName);
      const assetId = `Asset.Kenney.${pack.namespace}.${suffix}`;
      const meshId = `Mesh.Kenney.${pack.namespace}.${suffix}`;
      try {
        const bytes = await file.async('uint8array');
        let upload;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([bytes], `${payload.pack}-${sourceName}.glb`, { type: 'model/gltf-binary' }) });
            break;
          } catch (error) {
            if (attempt === 0 && error.message.includes('Rate limit')) await new Promise(resolve => setTimeout(resolve, 10000));
            else throw error;
          }
        }
        imported.push({ assetId, meshId, sourceName, sourcePath: file.name, uri: upload.file_url });
      } catch (error) {
        failures.push({ file: file.name, error: error.message });
      }
    }
    const created = imported.filter(item => !item.skipped);
    const assetRows = created.map(item => ({
      asset_id: item.assetId,
      name: `${pack.label} · ${item.sourceName}`,
      description: `Kenney ${pack.label} CC0 model`,
      asset_type: 'model', source_type: 'uploaded', uri: item.uri,
      tags: ['kenney', `kenney:${payload.pack}`, ...pack.genres],
      metadata: { license: 'CC0-1.0', package_slug: payload.pack, package_label: pack.label, source_path: item.sourcePath, official_url: `https://kenney.nl/assets/${pack.page}`, resource_map: resourceMap },
      import_settings: { preferred_format: 'glb', lazy_load: true }, version: 1, is_active: true
    }));
    const meshRows = created.map(item => ({ asset_id: item.meshId, type: 'Source', source_uris: [item.uri] }));
    const hostRows = created.map(item => ({ binding_id: `Host.Browser.Kenney.${pack.namespace}.${cleanId(item.sourceName)}`, asset_kind: 'Mesh', asset_id: item.meshId, backend_id: 'browser', source_uris: [item.uri], editor_asset_id: item.assetId }));
    for (const batch of chunks(assetRows, 500)) if (batch.length) await base44.asServiceRole.entities.Asset.bulkCreate(batch);
    for (const batch of chunks(meshRows, 500)) if (batch.length) await base44.asServiceRole.entities.PresentationMeshAsset.bulkCreate(batch);
    for (const batch of chunks(hostRows, 500)) if (batch.length) await base44.asServiceRole.entities.HostAssetBinding.bulkCreate(batch);
    const remainingAfter = Math.max(0, remainingFiles.length - created.length);
    return Response.json({ pack: payload.pack, totalModels: allFiles.length, textures: textureFiles.length, texturesCreated: textureRows.length, modelsUpdated: existingModels.length, remainingBefore: remainingFiles.length, processed: selected.length, created: created.length, failures, remainingAfter });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}