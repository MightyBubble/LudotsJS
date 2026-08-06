import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FilePlus2, Link2, Save, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Section } from '@/components/ludots/ui';
import ModelPreview from '@/components/asset/ModelPreview';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import { getSourceFileName } from '@/lib/assets/sourceFileName';

const CLIP_KINDS = ['Clip', 'BlendTree', 'Montage', 'PoseAsset'];
const BLEND_INPUTS = ['Zero', 'Scalar0', 'Scalar1', 'NormalizedTime', 'Weight01'];

function cleanMetadata(row) {
  const {
    id: _id,
    created_date: _created_date,
    updated_date: _updated_date,
    created_by: _created_by,
    created_by_id: _created_by_id,
    ...payload
  } = row;
  return payload;
}

function splitUris(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeBlendInputs(value) {
  if (value && !Array.isArray(value) && typeof value === 'object') {
    return {
      x: BLEND_INPUTS.includes(value.x) ? value.x : 'Scalar0',
      y: BLEND_INPUTS.includes(value.y) ? value.y : 'Scalar1',
    };
  }
  return { x: 'Scalar0', y: 'Scalar1' };
}

function locatorsFromBindings(bindings, currentLocators = []) {
  const variantByBackend = new Map(
    (currentLocators || [])
      .filter(locator => locator?.backend_id)
      .map(locator => [locator.backend_id, locator.variant || '']),
  );
  return bindings
    .filter(binding => binding.backend_id && binding.source_uris?.[0])
    .map(binding => ({
      backend_id: binding.backend_id,
      asset_ref: binding.source_uris[0],
      variant: variantByBackend.get(binding.backend_id) || '',
    }));
}

function nextBindingId(assetId, bindings) {
  const base = `Host.Browser.${assetId || 'AnimationClip'}`;
  if (!bindings.some(binding => binding.binding_id === base)) return base;
  let index = 2;
  while (bindings.some(binding => binding.binding_id === `${base}.${index}`)) index += 1;
  return `${base}.${index}`;
}

function FieldLabel({ children }) {
  return <label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{children}</label>;
}

function TextInput({ value, onChange, disabled = false, placeholder }) {
  return (
    <Input
      value={value ?? ''}
      disabled={disabled}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]"
    />
  );
}

function OptionSelect({ value, options, onChange, disabled = false }) {
  return (
    <Select value={value || options[0]} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-[#2A2E37] bg-[#15171C] text-[#e5e5e5]">
        {options.map(option => (
          <SelectItem key={option} value={option}>{option}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function HostBindingRow({ initialRow, assets, onCancel, onSave, onDelete, busy }) {
  const [row, setRow] = useState(initialRow);
  const linked = assets.find(asset => asset.asset_id === row.editor_asset_id);
  const canSave = row.binding_id && row.asset_id && row.backend_id && row.source_uris?.length > 0;

  useEffect(() => setRow(initialRow), [initialRow]);

  const patch = updates => setRow(current => ({ ...current, ...updates }));

  return (
    <div className="flex flex-col gap-3 border border-[#2A2E37] bg-[#0D0F14] p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Field label="Binding ID">
          <TextInput value={row.binding_id} onChange={binding_id => patch({ binding_id })} />
        </Field>
        <Field label="Asset Kind">
          <TextInput value="AnimationClip" disabled onChange={() => {}} />
        </Field>
        <Field label="Asset ID">
          <TextInput value={row.asset_id} disabled onChange={() => {}} />
        </Field>
        <Field label="Backend ID">
          <TextInput value={row.backend_id} onChange={backend_id => patch({ backend_id })} placeholder="browser" />
        </Field>
      </div>
      <Field label="Source URIs">
        <Input
          value={(row.source_uris || []).join(', ')}
          onChange={event => patch({ source_uris: splitUris(event.target.value) })}
          className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]"
        />
      </Field>
      <ReferenceSelect
        label="Editor Asset"
        value={row.editor_asset_id}
        options={assets.map(asset => ({ value: asset.asset_id, label: getSourceFileName(asset) }))}
        onChange={editor_asset_id => patch({ editor_asset_id })}
      />
      {linked?.asset_type === 'audio' && linked.uri && <audio controls src={linked.uri} className="h-8 w-full" />}
      {linked?.asset_type === 'model' && <ModelPreview uri={linked.uri} />}
      {linked?.asset_type === 'image' && linked.uri && <img src={linked.uri} alt={linked.name} className="max-h-48 border border-[#2A2E37]" />}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="outline" onClick={onCancel} className="h-8 border-[#424a55] bg-[#15171C]">
            Cancel
          </Button>
        )}
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)} className="h-8 text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
        <Button size="sm" disabled={!canSave || busy} onClick={() => onSave(row)} className="h-8 bg-[#242a32]">
          <Save className="h-3.5 w-3.5" />
          Save Binding
        </Button>
      </div>
    </div>
  );
}

export default function AnimationClipAssetDetails({ draft, patch }) {
  const queryClient = useQueryClient();
  const blendInputs = normalizeBlendInputs(draft.blend_inputs);
  const [newBinding, setNewBinding] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.Asset.list(),
  });

  const { data: allBindings = [] } = useQuery({
    queryKey: ['clip-host-bindings', draft.asset_id],
    queryFn: () => draft.asset_id
      ? base44.entities.HostAssetBinding.filter({ asset_id: draft.asset_id })
      : Promise.resolve([]),
    enabled: !!draft.asset_id,
  });

  const bindings = useMemo(
    () => allBindings.filter(binding => binding.asset_kind === 'AnimationClip'),
    [allBindings],
  );

  const syncLocators = nextBindings => {
    patch({ locators: locatorsFromBindings(nextBindings, draft.locators) });
  };

  const invalidateBindings = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['clip-host-bindings', draft.asset_id] }),
      queryClient.invalidateQueries({ queryKey: ['host_asset_bindings'] }),
      queryClient.invalidateQueries({ queryKey: ['presentation-ref', 'HostAssetBinding'] }),
    ]);
  };

  const saveBinding = async (row) => {
    setError('');
    setBusyId(row.id || 'new');
    const payload = {
      ...cleanMetadata(row),
      asset_kind: 'AnimationClip',
      asset_id: draft.asset_id,
      source_uris: row.source_uris || [],
    };
    try {
      if (row.id) await base44.entities.HostAssetBinding.update(row.id, payload);
      else await base44.entities.HostAssetBinding.create(payload);
      const nextBindings = row.id
        ? bindings.map(binding => binding.id === row.id ? { ...binding, ...payload } : binding)
        : [...bindings, payload];
      syncLocators(nextBindings);
      setNewBinding(null);
      await invalidateBindings();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save host binding');
    } finally {
      setBusyId('');
    }
  };

  const deleteBinding = async (row) => {
    if (!row.id) return;
    setError('');
    setBusyId(row.id);
    try {
      await base44.entities.HostAssetBinding.delete(row.id);
      syncLocators(bindings.filter(binding => binding.id !== row.id));
      await invalidateBindings();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete host binding');
    } finally {
      setBusyId('');
    }
  };

  const startNewBinding = () => {
    setNewBinding({
      binding_id: nextBindingId(draft.asset_id, bindings),
      asset_kind: 'AnimationClip',
      asset_id: draft.asset_id,
      backend_id: 'browser',
      source_uris: [],
      editor_asset_id: '',
    });
  };

  return (
    <div className="flex max-w-5xl flex-col gap-3">
      <Section title="animation_clips.json">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px]">
          <Field label="Clip ID">
            <TextInput value={draft.asset_id} onChange={asset_id => patch({ asset_id })} />
          </Field>
          <Field label="Asset Kind">
            <OptionSelect value={draft.asset_kind || 'Clip'} options={CLIP_KINDS} onChange={asset_kind => patch({ asset_kind })} />
          </Field>
        </div>
        {(draft.asset_kind === 'BlendTree' || draft.asset_kind === 'PoseAsset') && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Field label="Blend Input X">
              <OptionSelect value={blendInputs.x} options={BLEND_INPUTS} onChange={x => patch({ blend_inputs: { ...blendInputs, x } })} />
            </Field>
            <Field label="Blend Input Y">
              <OptionSelect value={blendInputs.y} options={BLEND_INPUTS} onChange={y => patch({ blend_inputs: { ...blendInputs, y } })} />
            </Field>
          </div>
        )}
      </Section>

      <Section
        title="host_assets.json"
        right={
          <Button size="sm" onClick={startNewBinding} disabled={!draft.asset_id || !!newBinding} className="h-7 bg-[#242a32]">
            <FilePlus2 className="h-3.5 w-3.5" />
            Binding
          </Button>
        }
      >
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link2 className="h-3.5 w-3.5" />
          <span>{bindings.length} AnimationClip binding row{bindings.length === 1 ? '' : 's'}</span>
        </div>
        {error && <div className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
        <div className="flex flex-col gap-3">
          {newBinding && (
            <HostBindingRow
              initialRow={newBinding}
              assets={assets}
              onCancel={() => setNewBinding(null)}
              onSave={saveBinding}
              busy={busyId === 'new'}
            />
          )}
          {bindings.length === 0 && !newBinding && (
            <div className="border border-dashed border-[#424a55] bg-[#0D0F14] p-4 text-center text-xs text-gray-500">
              No AnimationClip host binding yet.
            </div>
          )}
          {bindings.map(binding => (
            <HostBindingRow
              key={binding.id || binding.binding_id}
              initialRow={binding}
              assets={assets}
              onSave={saveBinding}
              onDelete={deleteBinding}
              busy={busyId === binding.id}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

