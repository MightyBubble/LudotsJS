import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { SelectField, TextField, BoolField } from './ui';
import ValueSourceEditor from './ValueSourceEditor';
import TargetResolverEditor from './TargetResolverEditor';
import RefListSelector from './RefListSelector';

export const OPERATION_TYPES = [
  { value: 'modify_attribute', label: '修改属性 (modify_attribute)' },
  { value: 'add_tag', label: '添加标签 (add_tag)' },
  { value: 'remove_tag', label: '移除标签 (remove_tag)' },
  { value: 'apply_effect', label: '施加效果 (apply_effect)' },
  { value: 'remove_effect', label: '移除效果 (remove_effect)' },
  { value: 'emit_event', label: '发出事件 (emit_event)' },
  { value: 'create_entity', label: '创建实体 (create_entity)' },
  { value: 'destroy_entity', label: '销毁实体 (destroy_entity)' },
  { value: 'execute_data_graph', label: '执行数据图 (execute_data_graph)' },
];

const ATTR_OPS = [
  { value: 'add', label: '加法 add' },
  { value: 'multiply', label: '乘法 multiply' },
  { value: 'override', label: '覆盖 override' },
];

export default function OperationsEditor({ operations = [], onChange, refs = {} }) {
  const { attributes = [], tags = [], effects = [], events = [], prototypes = [], entityQueries = [], constants = [], dataGraphs = [], requirements = [] } = refs;

  const update = (idx, patch) => onChange(operations.map((op, i) => i === idx ? { ...op, ...patch } : op));
  const move = (idx, dir) => {
    const next = [...operations];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next.map((op, i) => ({ ...op, order: i })));
  };

  const add = () => onChange([...operations, {
    operation_id: `op_${Date.now()}`,
    operation_type: 'modify_attribute',
    enabled: true,
    order: operations.length,
    target: { kind: 'self' },
    requirements: [],
  }]);

  const renderParams = (op, idx) => {
    const set = (patch) => update(idx, patch);
    switch (op.operation_type) {
      case 'modify_attribute':
        return (
          <>
            <SelectField label="属性" value={op.attribute_id} options={attributes.map(a => ({ value: a.attribute_id, label: a.name }))} onChange={(v) => set({ attribute_id: v })} />
            <TextField label="属性键" value={op.attribute_key} onChange={(v) => set({ attribute_key: v })} />
            <SelectField label="运算" value={op.attribute_operation || 'add'} options={ATTR_OPS} onChange={(v) => set({ attribute_operation: v })} />
            <ValueSourceEditor label="数值来源" value={op.magnitude || {}} onChange={(v) => set({ magnitude: v })} attributes={attributes} constants={constants} dataGraphs={dataGraphs} />
          </>
        );
      case 'add_tag':
      case 'remove_tag':
        return <SelectField label="标签" value={op.tag_path} options={tags.map(t => ({ value: t.full_path, label: t.full_path }))} onChange={(v) => set({ tag_path: v })} />;
      case 'apply_effect':
      case 'remove_effect':
        return <SelectField label="效果" value={op.effect_id} options={effects.map(e => ({ value: e.effect_id, label: e.name }))} onChange={(v) => set({ effect_id: v })} />;
      case 'emit_event':
        return (
          <>
            <SelectField label="事件" value={op.event_id} options={events.map(e => ({ value: e.event_id, label: e.name }))} onChange={(v) => set({ event_id: v })} />
            <TextField label="参数映射" value={op.payload_mapping_text} onChange={(v) => set({ payload_mapping_text: v })} placeholder="param=黑板键, param2=常量" />
          </>
        );
      case 'create_entity':
        return <SelectField label="实体原型" value={op.prototype_id} options={prototypes.map(p => ({ value: p.prototype_id, label: p.name }))} onChange={(v) => set({ prototype_id: v })} />;
      case 'destroy_entity':
        return <p className="text-[11px] text-gray-500">销毁由上方 Target 解析出的实体。</p>;
      case 'execute_data_graph':
        return (
          <>
            <SelectField label="数据图" value={op.data_graph_id} options={dataGraphs.map(g => ({ value: g.graph_id, label: `${g.name} · ${g.return_type || 'number'}` }))} onChange={(v) => set({ data_graph_id: v })} />
            <TextField label="输出映射" value={op.output_mappings_text} onChange={(v) => set({ output_mappings_text: v })} placeholder="result=黑板键" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {operations.length === 0 && <p className="text-[11px] text-gray-600">暂无 Operation</p>}
      {operations.map((op, idx) => (
        <div key={op.operation_id || idx} className="border border-[#2A2E37] rounded bg-[#15171C]">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[#2A2E37]">
            <span className="text-[10px] text-gray-500 font-mono">#{idx + 1}</span>
            <span className="text-[11px] text-[#E2D8B3] flex-1 truncate">{OPERATION_TYPES.find(t => t.value === op.operation_type)?.label}</span>
            <button onClick={() => move(idx, -1)} className="text-gray-500 hover:text-white"><ChevronUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => move(idx, 1)} className="text-gray-500 hover:text-white"><ChevronDown className="w-3.5 h-3.5" /></button>
            <button onClick={() => onChange(operations.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-2 space-y-2">
            <BoolField label="启用" value={op.enabled !== false} onChange={(v) => update(idx, { enabled: v })} />
            <SelectField label="类型" value={op.operation_type} options={OPERATION_TYPES} onChange={(v) => update(idx, { operation_type: v })} />
            <TargetResolverEditor label="作用目标" value={op.target || { kind: 'self' }} onChange={(v) => update(idx, { target: v })} entityQueries={entityQueries} />
            {renderParams(op, idx)}
            <RefListSelector
              label="前置需求"
              value={op.requirements || []}
              options={requirements.map(r => ({ value: r.requirement_id, label: r.name }))}
              onChange={(v) => update(idx, { requirements: v })}
            />
          </div>
        </div>
      ))}
      <Button onClick={add} size="sm" variant="outline" className="w-full h-7 text-xs bg-[#0D0F14] border-[#2A2E37] text-gray-300 hover:bg-[#2A2E37]">
        <Plus className="w-3 h-3 mr-1" />添加 Operation
      </Button>
    </div>
  );
}