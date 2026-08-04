import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getEmitters, updateEmitter, validateQuarksDocument } from '@/lib/quarks/quarksDocument';

export default function useQuarksEditor(asset, effect) {
  const queryClient = useQueryClient();
  const [document, setDocument] = useState(null); const [selectedUuid, setSelectedUuid] = useState('');
  const [dirty, setDirty] = useState(false); const [status, setStatus] = useState('loading'); const [error, setError] = useState('');
  const uri = effect?.source_uris?.[0] || asset?.uri;
  useEffect(() => {
    let active = true; setStatus('loading'); setError('');
    fetch(uri).then(response => { if (!response.ok) throw new Error(`加载失败：${response.status}`); return response.json(); }).then(value => {
      const invalid = validateQuarksDocument(value); if (invalid) throw new Error(invalid);
      if (!active) return; const emitters = getEmitters(value); setDocument(value); setSelectedUuid(emitters[0]?.uuid || ''); setDirty(false); setStatus('ready');
    }).catch(reason => { if (active) { setError(reason.message); setStatus('error'); } });
    return () => { active = false; };
  }, [uri]);
  const emitters = useMemo(() => getEmitters(document), [document]);
  const selected = emitters.find(item => item.uuid === selectedUuid) || emitters[0];
  const changeDocument = next => { setDocument(next); setDirty(true); };
  const patchSystem = patch => changeDocument(updateEmitter(document, selected.uuid, ps => ({ ...ps, ...patch })));
  const save = async () => {
    const invalid = validateQuarksDocument(document); if (invalid) return setError(invalid);
    setStatus('saving'); setError('');
    const file = new File([JSON.stringify(document)], `${asset.asset_id}.json`, { type: 'application/json' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const payload = { asset_id: asset.asset_id, backend: 'quarks', source_uris: [file_url], config: effect?.config || {}, loop: selected?.ps?.looping ?? true, scale: effect?.scale || 1 };
    await base44.entities.Asset.update(asset.id, { uri: file_url, tags: [...new Set([...(asset.tags || []).filter(tag => tag !== 'effekseer'), 'quarks'])] });
    if (effect?.id) await base44.entities.PresentationEffectAsset.update(effect.id, payload); else await base44.entities.PresentationEffectAsset.create(payload);
    const bindings = await base44.entities.HostAssetBinding.filter({ asset_id: asset.asset_id });
    const binding = { binding_id: `Host.Browser.${asset.asset_id}`, asset_kind: 'Vfx', asset_id: asset.asset_id, backend_id: 'browser-quarks', source_uris: [file_url], editor_asset_id: asset.asset_id };
    if (bindings[0]) await base44.entities.HostAssetBinding.update(bindings[0].id, binding); else await base44.entities.HostAssetBinding.create(binding);
    await Promise.all(['assets', 'presentation-effects', 'presentation_effect_assets'].map(queryKey => queryClient.invalidateQueries({ queryKey: [queryKey] })));
    setDirty(false); setStatus('ready');
  };
  return { document, emitters, selected, selectedUuid, setSelectedUuid, changeDocument, patchSystem, dirty, status, error, setError, save };
}