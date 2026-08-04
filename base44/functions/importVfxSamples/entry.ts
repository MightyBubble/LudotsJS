import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const samples = [
  ['AcidBoiling', 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/AcidBoiling.json'],
  ['ParticleSystem', 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/ps.json'],
  ['SubEmitter', 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/subEmitter2.json'],
];
const upload = async (base44, bytes, name) => (await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([bytes], name, { type: 'application/json' }) })).file_url;
const rewriteUrls = (value) => {
  const root = 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/';
  (value.images || []).forEach(image => { if (image.url?.startsWith('./')) image.url = root + image.url.slice(2); });
  return value;
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const [assets, effects, bindings] = await Promise.all([
      base44.asServiceRole.entities.Asset.filter({ asset_type: 'particle' }, '-created_date', 5000),
      base44.asServiceRole.entities.PresentationEffectAsset.list('-created_date', 5000),
      base44.asServiceRole.entities.HostAssetBinding.filter({ asset_kind: 'Vfx' }, '-created_date', 5000),
    ]);
    const assetIds = new Set(assets.map(item => item.asset_id)); const effectIds = new Set(effects.map(item => item.asset_id)); const bindingIds = new Set(bindings.map(item => item.binding_id));
    const assetRows = []; const effectRows = []; const hostRows = [];
    for (const [name, source] of samples) {
      const id = `Vfx.Quarks.Sample.${name}`; if (effectIds.has(id)) continue;
      const response = await fetch(source); if (!response.ok) throw new Error(`Quarks sample failed: ${response.status}`);
      const body = JSON.stringify(rewriteUrls(await response.json())); const uri = await upload(base44, new TextEncoder().encode(body), `${name}.json`);
      if (!assetIds.has(id)) assetRows.push({ asset_id: id, name: `Quarks · ${name}`, description: 'three.quarks official MIT sample', asset_type: 'particle', source_type: 'uploaded', uri, tags: ['vfx', 'quarks', 'sample'], metadata: { license: 'MIT', official_url: source }, version: 1, is_active: true });
      effectRows.push({ asset_id: id, backend: 'quarks', source_uris: [uri], config: { source: 'official-sample' }, loop: true, scale: 1 });
      hostRows.push({ binding_id: `Host.Browser.${id}`, asset_kind: 'Vfx', asset_id: id, backend_id: 'browser-quarks', source_uris: [uri], editor_asset_id: id });
    }
    const newHosts = hostRows.filter(row => !bindingIds.has(row.binding_id));
    if (assetRows.length) await base44.asServiceRole.entities.Asset.bulkCreate(assetRows);
    if (effectRows.length) await base44.asServiceRole.entities.PresentationEffectAsset.bulkCreate(effectRows);
    if (newHosts.length) await base44.asServiceRole.entities.HostAssetBinding.bulkCreate(newHosts);
    return Response.json({ assets: assetRows.length, effects: effectRows.length, hostBindings: newHosts.length, quarks: effectRows.length });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}