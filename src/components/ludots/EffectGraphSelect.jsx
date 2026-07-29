import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field } from './ui';

const NONE = '__none__';

export default function EffectGraphSelect({ label, value, onChange, graphs = [] }) {
  const options = value && !graphs.some(graph => graph.action_id === value)
    ? [{ action_id: value, name: '未找到引用' }, ...graphs] : graphs;
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Select value={value || NONE} onValueChange={(next) => onChange(next === NONE ? '' : next)}>
          <SelectTrigger className="h-8 flex-1 bg-[#0D0F14] border-[#2A2E37] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#15171C] border-[#2A2E37]">
            <SelectItem value={NONE} className="text-xs">未配置</SelectItem>
            {options.map(graph => <SelectItem key={graph.action_id} value={graph.action_id} className="text-xs">{graph.name || graph.action_id} · {graph.action_id}</SelectItem>)}
          </SelectContent>
        </Select>
        <Link to="/UnifiedGraphEditor?type=action" title="打开 ActionGraph 编辑器" className="h-8 w-8 border border-[#2A2E37] rounded flex items-center justify-center text-gray-400 hover:text-[#E2D8B3]"><ExternalLink className="w-3.5 h-3.5" /></Link>
      </div>
    </Field>
  );
}