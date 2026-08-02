import React from 'react';
import { X } from 'lucide-react';
import NodePort from './NodePort';
import BlackboardVarNode from './BlackboardVarNode';
import { Input } from '@/components/ui/input';
import { getNodeConfig, getNodeLabel } from './nodeConfigs';
import RuntimeNodeFields from './RuntimeNodeFields';
import { useI18n } from '@/i18n/I18nProvider';

const nodeAccentColors = {
  number: '#5b9bd5',
  add: '#9b6bb3',
  subtract: '#9b6bb3',
  multiply: '#9b6bb3',
  divide: '#9b6bb3',
  power: '#9b6bb3',
  sum: '#e67e22',
  product: '#e67e22',
  max: '#e67e22',
  min: '#e67e22',
  clamp: '#e67e22',
  vector2: '#70ad47',
  vector3: '#70ad47',
  vector4: '#70ad47',
  vector_add: '#70ad47',
  vector_subtract: '#70ad47',
  vector_multiply: '#70ad47',
  vector_dot: '#70ad47',
  vector_cross: '#70ad47',
  vector_normalize: '#70ad47',
  vector_length: '#70ad47',
  quaternion: '#c97fff',
  color: '#ffc000',
  blackboard_get: '#0e639c',
  blackboard_set: '#16825d',
  output_number: '#7eb36b',
  output_vector2: '#7eb36b',
  output_vector3: '#7eb36b',
  output_vector4: '#7eb36b',
  output_quaternion: '#7eb36b',
  output_color: '#7eb36b'
};

const nodeLabels = {
  number: '数值',
  add: '加法',
  subtract: '减法',
  multiply: '乘法',
  divide: '除法',
  power: '幂运算',
  sum: '求和',
  product: '求积',
  max: '最大值',
  min: '最小值',
  clamp: '钳制',
  vector2: '二维向量',
  vector3: '三维向量',
  vector4: '四维向量',
  vector_add: '向量加法',
  vector_subtract: '向量减法',
  vector_multiply: '向量乘法',
  vector_dot: '点积',
  vector_cross: '叉积',
  vector_normalize: '归一化',
  vector_length: '向量长度',
  quaternion: '四元数',
  color: '颜色',
  blackboard_get: 'Get',
  blackboard_set: 'Set',
  output_number: '输出-数值',
  output_vector2: '输出-二维向量',
  output_vector3: '输出-三维向量',
  output_vector4: '输出-四维向量',
  output_quaternion: '输出-四元数',
  output_color: '输出-颜色'
};

export default function Node({ 
  node,
  selected = false,
  connectedInputPorts,
  connectedValues, // Added new prop
  onUpdatePosition,
  onUpdateData,
  onDelete,
  onSelect,
  onStartConnection,
  onEndConnection,
  nodeFieldOptions,
}) {
  const accentColor = nodeAccentColors[node?.type] || nodeAccentColors.number;
  const isLocked = node?.locked || (node?.id && node.id.startsWith('output-'));
  const nodeConfig = getNodeConfig(node?.type);
  const { locale } = useI18n();
  const localized = nodeConfig?.getLocalizedText?.(locale);

  if (!node) {
    return null;
  }

  const isPortConnected = (portId) => {
    return connectedInputPorts && connectedInputPorts.has(`${node.id}-${portId}`);
  };

  const getConnectedValue = (portId) => {
    // node.connectedValues is expected to be an object where keys are portIds and values are the computed values
    const conn = (connectedValues || {})[portId];
    return conn;
  };

  const renderInputWithPort = (portId, placeholder, value) => {
    const isConnected = isPortConnected(portId);
    const inputPort = node.inputs?.find(i => i.id === portId);
    const connectedVal = getConnectedValue(portId); // Use connectedValues prop

    if (!inputPort) return null;
    
    // Display connected value if port is connected, otherwise display local node data value.
    const displayValue = isConnected ? (connectedVal ?? '') : (value ?? '');
    
    return (
      <div className="flex items-center gap-2 mb-1.5">
        <NodePort
          nodeId={node.id}
          port={inputPort}
          type="input"
          connected={isConnected}
        />
        <Input
          type="number"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => onUpdateData(node.id, { [portId]: parseFloat(e.target.value) || 0 })}
          disabled={isConnected} // Disable input if connected
          className={`nodrag h-6 text-xs border-[#434343] flex-1 px-2 ${
            isConnected 
              ? 'bg-[#2d2d30]/50 text-white/60 cursor-not-allowed' 
              : 'bg-[#2d2d30] text-white/90'
          }`}
        />
      </div>
    );
  };

  const renderInlineInputs = () => {
    if (!node.data) {
      node.data = {};
    }

    if (node.id && node.id.startsWith('output-')) {
      return (
        <div className="space-y-1.5">
          {(node.inputs || []).map(input => (
            <NodePort
              key={input.id}
              nodeId={node.id}
              port={input}
              type="input"
              connected={isPortConnected(input.id)}
            />
          ))}
        </div>
      );
    }

    if (node.type === 'number') {
      return (
        <Input
          type="number"
          value={node.data.value ?? 0}
          onChange={(e) => onUpdateData(node.id, { value: parseFloat(e.target.value) || 0 })}
          className="nodrag h-7 text-xs bg-[#2d2d30] border-[#434343] text-white/90 px-2"
        />
      );
    }

    if (['add', 'subtract', 'multiply', 'divide'].includes(node.type)) {
      return (
        <div className="space-y-0">
          {renderInputWithPort('a', 'A', node.data.a ?? 0)}
          {renderInputWithPort('b', 'B', node.data.b ?? (node.type === 'divide' ? 1 : 0))}
        </div>
      );
    }

    if (node.type === 'power') {
      return (
        <div className="space-y-0">
          {renderInputWithPort('base', '底数', node.data.base ?? 2)}
          {renderInputWithPort('exponent', '指数', node.data.exponent ?? 2)}
        </div>
      );
    }

    if (node.type === 'clamp') {
      return (
        <div className="space-y-0">
          {renderInputWithPort('value', '值', node.data.value ?? 0)}
          {renderInputWithPort('min', '最小值', node.data.min ?? 0)}
          {renderInputWithPort('max', '最大值', node.data.max ?? 100)}
        </div>
      );
    }

    if (node.type === 'vector2') {
      return (
        <div className="space-y-0">
          {renderInputWithPort('x', 'X', node.data.x ?? 0)}
          {renderInputWithPort('y', 'Y', node.data.y ?? 0)}
        </div>
      );
    }

    if (node.type === 'vector3') {
      return (
        <div className="space-y-0">
          {renderInputWithPort('x', 'X', node.data.x ?? 0)}
          {renderInputWithPort('y', 'Y', node.data.y ?? 0)}
          {renderInputWithPort('z', 'Z', node.data.z ?? 0)}
        </div>
      );
    }

    if (node.type === 'vector4' || node.type === 'quaternion') {
      return (
        <div className="space-y-0">
          {renderInputWithPort('x', 'X', node.data.x ?? 0)}
          {renderInputWithPort('y', 'Y', node.data.y ?? 0)}
          {renderInputWithPort('z', 'Z', node.data.z ?? 0)}
          {renderInputWithPort('w', 'W', node.data.w ?? (node.type === 'quaternion' ? 1 : 0))}
        </div>
      );
    }

    if (node.type === 'color') {
      return (
        <div className="space-y-0">
          {renderInputWithPort('r', 'R', node.data.r ?? 1)}
          {renderInputWithPort('g', 'G', node.data.g ?? 1)}
          {renderInputWithPort('b', 'B', node.data.b ?? 1)}
        </div>
      );
    }

    if (node.inputs && node.inputs.length > 0) {
      return (
        <div className="space-y-1.5">
          {node.inputs.map(input => (
            <NodePort
              key={input.id}
              nodeId={node.id}
              port={input}
              type="input"
              connected={isPortConnected(input.id)}
            />
          ))}
        </div>
      );
    }

    return null;
  };

  if (node.type === 'blackboard_get' || node.type === 'blackboard_set') {
    return (
      <BlackboardVarNode
        node={node}
        selected={selected}
        connectedInputPorts={connectedInputPorts}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div
      className="rounded shadow-2xl select-none cursor-move"
      style={{
        width: '220px',
        backgroundColor: '#15171C',
        borderLeft: `3px solid ${accentColor}`,
        border: selected ? `2px solid ${accentColor}` : '1px solid #2A2E37',
        boxShadow: selected ? `0 0 0 2px ${accentColor}40, 0 4px 12px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.5)',
        opacity: isLocked ? 0.9 : 1,
        transition: 'border 0.2s, box-shadow 0.2s'
      }}
    >
      <div 
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ 
          borderColor: '#2A2E37',
          background: 'linear-gradient(180deg, #1F2329 0%, #1A1D24 100%)'
        }}
      >
        <span className="font-medium text-xs text-[#E2D8B3]">
          {node.data?.label || localized?.label || nodeLabels[node.type] || getNodeLabel(node.type)}
        </span>
        {!isLocked && (
          <button
            className="delete-button text-white/30 hover:text-white/80 transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              requestAnimationFrame(() => onDelete(node.id));
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-3 space-y-0">
        {localized && <div className="mb-2 border-b border-[#2A2E37] pb-2"><div className="text-[9px] text-gray-500">{localized.secondary}</div><div className="mt-0.5 text-[9px] leading-4 text-gray-400">{localized.description}</div></div>}
        {node.data?.details?.length > 0 && (
          <div className="mb-2 space-y-0.5 border-b border-[#2A2E37] pb-2">
            {node.data.details.map(detail => <div key={detail} className="font-mono text-[9px] leading-4 text-gray-400">{detail}</div>)}
          </div>
        )}
        <div className="nodrag">
          <RuntimeNodeFields fields={nodeConfig?.configFields} data={node.data || {}} onChange={data => onUpdateData(node.id, data)} locale={locale} optionSets={nodeFieldOptions} />
          {renderInlineInputs()}
        </div>

        {node.outputs && node.outputs.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {node.outputs.map(output => (
              <NodePort
                key={output.id}
                nodeId={node.id}
                port={output}
                type="output"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}