import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import UIItemDefinitionRow from './UIItemDefinitionRow';

export default function UIItemDefinitionsEditor({ kind, value = [], refs, onChange }) {
  const baseTargets = kind === 'ability' ? refs.abilities : refs.prototypes;
  const targets = [{ value: '*', label: '* · 默认规则' }, ...baseTargets];
  const add = () => onChange([...value, { target_id: '', icon_glyph: '', accent_color: '', text: {} }]);
  return <Section title="Item 外观规则" right={<Button type="button" size="sm" onClick={add} className="h-7 bg-[#1E2128]"><Plus />添加规则</Button>}>
    {value.length === 0 && <p className="rounded border border-dashed border-[#424a55] p-4 text-center text-[11px] text-gray-500">尚未配置 Item 外观规则</p>}
    {value.map((item, index) => <UIItemDefinitionRow key={`${item.target_id}-${index}`} item={item} index={index} targets={targets} tokens={refs.tokens} onChange={next => onChange(value.map((row, i) => i === index ? next : row))} onRemove={() => onChange(value.filter((_, i) => i !== index))} />)}
  </Section>;
}