import React from 'react';
import { SelectField, TextField } from './ui';
import ValueSourceEditor from './ValueSourceEditor';
import TargetResolverEditor from './TargetResolverEditor';
import { MAIN_MODES, BUILTIN_OPERATIONS, ATTRIBUTE_OPERATIONS, ENTITY_LIFECYCLE_REQUESTS } from './phaseModel';

/** 单个 Phase 的 Main Operation：builtin | action_graph | none */
export default function MainOperationEditor({ value = {}, onChange, refs = {} }) {
  const { attributes = [], tags = [], effects = [], events = [], prototypes = [], entityQueries = [], constants = [], dataGraphs = [], actionGraphs = [] } = refs;
  const builtin = value.builtin || {};
  const setBuiltin = (patch) => onChange({ ...value, builtin: { ...builtin, ...patch } });

  const builtinForm = () => {
    switch (builtin.operation_type) {
      case 'modify_attribute':
      case 'set_attribute':
        return (
          <>
            <SelectField label="属性" value={builtin.attribute_id} options={attributes.map(a => ({ value: a.attribute_id, label: a.name }))} onChange={(v) => setBuiltin({ attribute_id: v })} />
            <TextField label="属性键" value={builtin.attribute_key} onChange={(v) => setBuiltin({ attribute_key: v })} />
            {builtin.operation_type === 'modify_attribute' && (
              <SelectField label="运算" value={builtin.attribute_operation || 'add'} options={ATTRIBUTE_OPERATIONS} onChange={(v) => setBuiltin({ attribute_operation: v })} />
            )}
            <ValueSourceEditor label="数值来源 magnitude" value={builtin.magnitude || {}} onChange={(v) => setBuiltin({ magnitude: v })} attributes={attributes} constants={constants} dataGraphs={dataGraphs} />
          </>
        );
      case 'add_tag':
      case 'remove_tag':
        return <SelectField label="标签" value={builtin.tag_path} options={tags.map(t => ({ value: t.full_path, label: t.full_path }))} onChange={(v) => setBuiltin({ tag_path: v })} />;
      case 'apply_effect':
      case 'remove_effect':
        return <SelectField label="效果" value={builtin.effect_id} options={effects.map(e => ({ value: e.effect_id, label: e.name }))} onChange={(v) => setBuiltin({ effect_id: v })} />;
      case 'emit_event':
        return (
          <>
            <SelectField label="事件" value={builtin.event_id} options={events.map(e => ({ value: e.event_id, label: e.name }))} onChange={(v) => setBuiltin({ event_id: v })} />
            <TextField label="参数映射 payload" value={builtin.payload_mapping_text} onChange={(v) => setBuiltin({ payload_mapping_text: v })} placeholder="param=黑板键" />
          </>
        );
      case 'set_blackboard':
        return (
          <>
            <TextField label="黑板键" value={builtin.blackboard_key} onChange={(v) => setBuiltin({ blackboard_key: v })} />
            <ValueSourceEditor label="写入值" value={builtin.magnitude || {}} onChange={(v) => setBuiltin({ magnitude: v })} attributes={attributes} constants={constants} dataGraphs={dataGraphs} />
          </>
        );
      case 'execute_data_graph':
        return (
          <>
            <SelectField label="数据图" value={builtin.data_graph_id} options={dataGraphs.map(g => ({ value: g.graph_id, label: g.name }))} onChange={(v) => setBuiltin({ data_graph_id: v })} />
            <TextField label="输出映射" value={builtin.output_mappings_text} onChange={(v) => setBuiltin({ output_mappings_text: v })} placeholder="result=黑板键" />
          </>
        );
      case 'entity_lifecycle_request':
        return (
          <>
            <SelectField label="请求类型" value={builtin.lifecycle_request} options={ENTITY_LIFECYCLE_REQUESTS} onChange={(v) => setBuiltin({ lifecycle_request: v })} />
            {builtin.lifecycle_request === 'create' && (
              <SelectField label="实体原型" value={builtin.prototype_id} options={prototypes.map(p => ({ value: p.prototype_id, label: p.name }))} onChange={(v) => setBuiltin({ prototype_id: v })} />
            )}
            <p className="text-[10px] text-gray-600">DestroyEntity 只生成 Entity Lifecycle Request：Alive → DestroyRequested → PendingDestroy → Cleanup → Structural Commit → Destroyed。</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <SelectField label="Main 模式" value={value.mode || 'none'} options={MAIN_MODES} onChange={(v) => onChange({ ...value, mode: v })} />
      {value.mode === 'builtin' && (
        <>
          <SelectField label="内置操作" value={builtin.operation_type} options={BUILTIN_OPERATIONS} onChange={(v) => setBuiltin({ operation_type: v })} />
          <TargetResolverEditor label="作用目标" value={builtin.target || { kind: 'self' }} onChange={(v) => setBuiltin({ target: v })} entityQueries={entityQueries} />
          {builtinForm()}
        </>
      )}
      {value.mode === 'action_graph' && (
        <>
          <SelectField
            label="Action Graph"
            value={value.action_graph_id}
            options={actionGraphs.map(g => ({ value: g.action_id, label: g.name }))}
            onChange={(v) => onChange({ ...value, action_graph_id: v })}
            hint="与图编辑器中的动作图完全等价，不新增第二套图系统"
          />
          <TextField label="参数映射" value={value.parameter_mappings_text} onChange={(v) => onChange({ ...value, parameter_mappings_text: v })} placeholder="graphParam=黑板键, target=target" />
        </>
      )}
      {(!value.mode || value.mode === 'none') && <p className="text-[10px] text-gray-600">该 Phase 无主操作，仅执行 Pre / Post 与 Listeners。</p>}
    </div>
  );
}