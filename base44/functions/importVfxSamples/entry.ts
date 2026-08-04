import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

const quarks = [
  ['AcidBoiling', 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/AcidBoiling.json'],
  ['ParticleSystem', 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/ps.json'],
  ['SubEmitter', 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/subEmitter2.json'],
];
const effekseerNames = ['Simple_Ring_Shape1.efk', 'Simple_Ring_Shape2.efk', 'Simple_Track1.efk'];
const releaseUrl = 'https://github.com/effekseer/EffekseerForWebGL/releases/download/170e/EffekseerForWebGL170e.zip';
const upload = async (base44, bytes, name, type) => (await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([bytes], name, { type }) })).file_url;
const rewriteQuarks = (value) => {
  const root = 'https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/packages/quarks.examples/public/';
  (value.images || []).forEach(image => { if (image.url?.startsWith('./')) image.url = root + image.url.slice(2); });
  return value;
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const [assets, effects, bindings] = await Promise.all([
      base44.asServiceRole.entities.Asset.filter({ asset_type: 'particle' }, '-created_date', 5000),
      base44.asServiceRole.entities.PresentationEffectAsset.list('-created_date', 5000),
      base44.asServiceRole.entities.HostAssetBinding.filter({ asset_kind: 'Vfx' }, '-created_date', 5000),
    ]);
    const assetIds = new Set(assets.map(x => x.asset_id)); const effectIds = new Set(effects.map(x => x.asset_id)); const bindingIds = new Set(bindings.map(x => x.binding_id));
    const assetRows = []; const effectRows = []; const hostRows = [];
    for (const [name, source] of quarks) {
      const id = `Vfx.Quarks.Sample.${name}`; if (effectIds.has(id)) continue;
      const response = await fetch(source); if (!response.ok) throw new Error(`Quarks sample failed: ${response.status}`);
      const body = JSON.stringify(rewriteQuarks(await response.json())); const uri = await upload(base44, new TextEncoder().encode(body), `${name}.json`, 'application/json');
      if (!assetIds.has(id)) assetRows.push({ asset_id: id, name: `Quarks · ${name}`, description: 'three.quarks official MIT sample', asset_type: 'particle', source_type: 'uploaded', uri, tags: ['vfx', 'quarks', 'sample'], metadata: { license: 'MIT', official_url: source }, version: 1, is_active: true });
      effectRows.push({ asset_id: id, backend: 'quarks', source_uris: [uri], runtime: {}, config: { source: 'official-sample' }, loop: true, scale: 1 });
      hostRows.push({ binding_id: `Host.Browser.${id}`, asset_kind: 'Vfx', asset_id: id, backend_id: 'browser-quarks', source_uris: [uri], editor_asset_id: id });
    }
    const release = await fetch(releaseUrl); if (!release.ok) throw new Error(`Effekseer release failed: ${release.status}`);
    const zip = await JSZip.loadAsync(await release.arrayBuffer()); const files = Object.values(zip.files);
    const script = files.find(file => !file.dir && /(^|\/)effekseer(\.min)?\.js$/i.test(file.name));
    const wasm = files.find(file => !file.dir && /(^|\/)effekseer(\.wasm)?$/i.test(file.name) && /\.wasm$/i.test(file.name));
    if (!script) throw new Error('Effekseer runtime script not found');
    const scriptUri = await upload(base44, await script.async('uint8array'), 'effekseer-170e.js', 'text/javascript');
    const wasmUri = wasm ? await upload(base44, await wasm.async('uint8array'), 'effekseer-170e.wasm', 'application/wasm') : '';
    for (const name of effekseerNames) {
      const id = `Vfx.Effekseer.Sample.${name.replace(/\.efk$/i, '')}`; if (effectIds.has(id)) continue;
      const file = files.find(item => !item.dir && item.name.split('/').pop() === name); if (!file) continue;
      const uri = await upload(base44, await file.async('uint8array'), name, 'application/octet-stream');
      if (!assetIds.has(id)) assetRows.push({ asset_id: id, name: `Effekseer · ${name.replace(/\.efk$/i, '')}`, description: 'Effekseer official MIT sample', asset_type: 'particle', source_type: 'uploaded', uri, tags: ['vfx', 'effekseer', 'sample'], metadata: { license: 'MIT', official_url: releaseUrl }, version: 1, is_active: true });
      effectRows.push({ asset_id: id, backend: 'effekseer', source_uris: [uri], runtime: { script_uri: scriptUri, wasm_uri: wasmUri }, config: { source: 'official-sample' }, loop: true, scale: 1 });
      hostRows.push({ binding_id: `Host.Browser.${id}`, asset_kind: 'Vfx', asset_id: id, backend_id: 'browser-effekseer', source_uris: [uri], editor_asset_id: id });
    }
    const newHosts = hostRows.filter(row => !bindingIds.has(row.binding_id));
    if (assetRows.length) await base44.asServiceRole.entities.Asset.bulkCreate(assetRows);
    if (effectRows.length) await base44.asServiceRole.entities.PresentationEffectAsset.bulkCreate(effectRows);
    if (newHosts.length) await base44.asServiceRole.entities.HostAssetBinding.bulkCreate(newHosts);
    return Response.json({ assets: assetRows.length, effects: effectRows.length, hostBindings: newHosts.length, quarks: effectRows.filter(x => x.backend === 'quarks').length, effekseer: effectRows.filter(x => x.backend === 'effekseer').length, availableEffekseer: files.filter(x => !x.dir && /\.efk$/i.test(x.name)).map(x => x.name.split('/').pop()).slice(0, 20) });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}