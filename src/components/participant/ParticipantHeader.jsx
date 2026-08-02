import React from 'react';
import { Save, Trash2 } from 'lucide-react';

const input = 'bg-[#0D0F14] border border-[#424a55] rounded px-2 py-1 text-xs text-gray-200 outline-none';
export default function ParticipantHeader({ value, onChange, onSave, onDelete, saving }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  return <div className="border-b border-[#2A2E37] bg-[#15171C] p-3 flex flex-wrap items-end gap-3">
    <label className="text-[10px] text-gray-500">显示名<input className={`${input} block mt-1 w-44`} value={value.label || ''} onChange={(e) => set('label', e.target.value)} /></label>
    <label className="text-[10px] text-gray-500">配置 ID<input className={`${input} block mt-1 w-44`} value={value.config_id} onChange={(e) => set('config_id', e.target.value)} /></label>
    <label className="text-[10px] text-gray-500">Map ID<input className={`${input} block mt-1 w-44`} value={value.map_id} onChange={(e) => set('map_id', e.target.value)} /></label>
    <button onClick={onSave} disabled={saving} className="flex gap-1.5 items-center px-3 py-1.5 rounded bg-[#242a32] border border-[#424a55] text-xs"><Save className="w-3.5 h-3.5" />保存</button>
    {value.id && <button onClick={onDelete} className="flex gap-1.5 items-center px-3 py-1.5 rounded border border-[#424a55] text-xs text-red-300"><Trash2 className="w-3.5 h-3.5" />删除</button>}
  </div>;
}