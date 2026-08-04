import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

const packs = {
  'kenney-interface': { provider: 'Kenney', label: 'Interface Sounds', slug: 'interface-sounds', url: 'https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip', page: 'https://kenney.nl/assets/interface-sounds' },
  'kenney-rpg': { provider: 'Kenney', label: 'RPG Audio', slug: 'rpg-audio', url: 'https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip', page: 'https://kenney.nl/assets/rpg-audio' },
  'kenney-impact': { provider: 'Kenney', label: 'Impact Sounds', slug: 'impact-sounds', url: 'https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip', page: 'https://kenney.nl/assets/impact-sounds' },
  'oga-core': { provider: 'OpenGameArt', label: '100 CC0 SFX', slug: '100-cc0-sfx', url: 'https://opengameart.org/sites/default/files/100-CC0-SFX_0.zip', page: 'https://opengameart.org/content/100-cc0-sfx' },
  'oga-rpg': { provider: 'OpenGameArt', label: '80 CC0 RPG SFX', slug: '80-cc0-rpg-sfx', url: 'https://opengameart.org/sites/default/files/80-CC0-RPG-SFX_0.zip', page: 'https://opengameart.org/content/80-cc0-rpg-sfx' },
  'oga-scifi': { provider: 'OpenGameArt', label: '50 CC0 Sci-Fi SFX', slug: '50-cc0-scifi-sfx', url: 'https://opengameart.org/sites/default/files/sci-fi-sfx.zip', page: 'https://opengameart.org/content/50-cc0-sci-fi-sfx' },
};
const clean = (value) => value.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '.').replace(/^\.|\.$/g, '');
const mime = (name) => /\.ogg$/i.test(name) ? 'audio/ogg' : /\.mp3$/i.test(name) ? 'audio/mpeg' : 'audio/wav';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const payload = await req.json(); const pack = packs[payload.pack];
    if (!pack) return Response.json({ error: 'Unknown pack', available: Object.keys(packs) }, { status: 400 });
    const response = await fetch(pack.url); if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    const files = Object.values(zip.files).filter(file => !file.dir && /\.(wav|ogg|mp3)$/i.test(file.name)).sort((a, b) => a.name.localeCompare(b.name));
    const existing = await base44.asServiceRole.entities.Asset.filter({ asset_type: 'audio' }, '-created_date', 5000);
    const existingIds = new Set(existing.map(item => item.asset_id));
    const pending = files.filter(file => !existingIds.has(`Asset.Audio.${clean(pack.provider)}.${clean(pack.slug)}.${clean(file.name)}`));
    const selected = pending.slice(0, Math.min(100, Math.max(1, Number(payload.limit) || 50))); const rows = []; const hosts = [];
    for (const file of selected) {
      const id = `Asset.Audio.${clean(pack.provider)}.${clean(pack.slug)}.${clean(file.name)}`; const bytes = await file.async('uint8array');
      const upload = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([bytes], `${pack.slug}-${file.name.split('/').pop()}`, { type: mime(file.name) }) });
      rows.push({ asset_id: id, name: `${pack.label} · ${file.name.split('/').pop()}`, description: `${pack.provider} ${pack.label} CC0 audio`, asset_type: 'audio', source_type: 'uploaded', uri: upload.file_url, tags: ['audio', 'cc0', pack.provider.toLowerCase(), pack.slug], metadata: { license: 'CC0-1.0', package_slug: pack.slug, package_label: pack.label, source_path: file.name, official_url: pack.page }, version: 1, is_active: true });
      hosts.push({ binding_id: `Host.Browser.${id}`, asset_kind: 'Sound', asset_id: id, backend_id: 'browser', source_uris: [upload.file_url], editor_asset_id: id });
    }
    if (rows.length) await base44.asServiceRole.entities.Asset.bulkCreate(rows);
    if (hosts.length) await base44.asServiceRole.entities.HostAssetBinding.bulkCreate(hosts);
    return Response.json({ pack: payload.pack, total: files.length, created: rows.length, remainingAfter: Math.max(0, pending.length - rows.length) });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}