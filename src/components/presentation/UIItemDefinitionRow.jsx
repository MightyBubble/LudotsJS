import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';
import ItemTextTokenFields from './ItemTextTokenFields';

export default function UIItemDefinitionRow({ item, index, targets, tokens, onChange, onRemove }) {
  const patch = data => onChange({ ...item, ...data });
  return <div className="rounded border border-[#424a55] bg-[#0D0F14] p-3 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-semibold text-gray-300">Item {index + 1}</span>
      <Button type="button" size="icon" variant="ghost" onClick={onRemove} className="h-7 w-7 text-red-400" aria-label={`删除 Item ${index + 1}`}><Trash2 /></Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <ReferenceSelect label="目标" value={item.target_id} options={targets} onChange={target_id => patch({ target_id })} hint="选择 Entity Prototype、Ability 或通配规则" />
      <TextField label="图标 Glyph" value={item.icon_glyph} onChange={icon_glyph => patch({ icon_glyph })} placeholder="例如 ⚔" />
      <TextField label="强调色" value={item.accent_color} onChange={accent_color => patch({ accent_color })} placeholder="#D6B15F" />
    </div>
    <ItemTextTokenFields value={item.text} tokens={tokens} onChange={text => patch({ text })} />
  </div>;
}