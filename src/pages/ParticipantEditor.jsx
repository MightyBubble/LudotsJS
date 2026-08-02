import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import ParticipantConfigList from '@/components/participant/ParticipantConfigList';
import ParticipantHeader from '@/components/participant/ParticipantHeader';
import ParticipantConfigDetails from '@/components/participant/ParticipantConfigDetails';
import { blankTopology, validateTopology } from '@/components/participant/participantModel';

export default function ParticipantEditor() {
  const scope = useProjectScope();
  const [records, setRecords] = useState([]), [prototypes, setPrototypes] = useState([]);
  const [value, setValue] = useState(null), [saving, setSaving] = useState(false), [error, setError] = useState('');
  useEffect(() => { Promise.all([base44.entities.ParticipantTopology.list('-updated_date', 100), base44.entities.EntityPrototype.list('name', 200)]).then(([r, p]) => { const scoped = r.filter(scope.inScope); setRecords(scoped); setPrototypes(p); setValue(scoped[0] || null); }); }, [scope.projectId]);
  const select = (id) => { setValue(records.find((r) => r.id === id)); setError(''); };
  const create = () => { setValue(blankTopology(scope.newScopeFields())); setError(''); };
  const save = async () => { const message = validateTopology(value); if (message) return setError(message); setSaving(true); setError(''); const saved = value.id ? await base44.entities.ParticipantTopology.update(value.id, value) : await base44.entities.ParticipantTopology.create(value); setRecords((rs) => value.id ? rs.map((r) => r.id === saved.id ? saved : r) : [saved, ...rs]); setValue(saved); setSaving(false); };
  const remove = async () => { if (!window.confirm('删除这份参与者拓扑配置？')) return; await base44.entities.ParticipantTopology.delete(value.id); const next = records.filter((r) => r.id !== value.id); setRecords(next); setValue(next[0] || null); };
  return <div className="flex h-full min-h-0 bg-[#0D0F14] text-gray-200">
    <ParticipantConfigList records={records} activeId={value?.id} onSelect={select} onCreate={create} />
    <main className="flex-1 min-w-0 min-h-0 flex flex-col">
      {value ? <><ParticipantHeader value={value} onChange={setValue} onSave={save} onDelete={remove} saving={saving} />{error && <p className="px-3 py-2 text-xs text-red-300 bg-red-950/30">{error}</p>}<ParticipantConfigDetails value={value} prototypes={prototypes} onChange={setValue} /></> : <div className="m-auto text-xs text-gray-600">新建一份地图参与者配置。</div>}
    </main>
  </div>;
}