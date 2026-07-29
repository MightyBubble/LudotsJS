import React from 'react';
import { X } from 'lucide-react';
import NodePort from './NodePort';

/**
 * 虚幻蓝图风格的黑板变量 Get / Set 节点：无标题栏的紧凑胶囊
 */
export default function BlackboardVarNode({ node, selected, connectedInputPorts, onDelete }) {
  const isSet = node.type === 'blackboard_set';
  const accent = isSet ? '#16825d' : '#0e639c';
  const inputs = node.inputs || [];
  const outputs = node.outputs || [];

  return (
    <div
      className="group relative select-none cursor-move flex items-center gap-2 pl-3 pr-3 py-1.5"
      style={{
        borderRadius: '999px',
        background: 'linear-gradient(180deg, #22262E 0%, #171A20 100%)',
        border: selected ? `1.5px solid ${accent}` : '1px solid #2A2E37',
        boxShadow: selected
          ? `0 0 0 2px ${accent}40, 0 4px 10px rgba(0,0,0,0.55)`
          : '0 3px 10px rgba(0,0,0,0.5)',
        minWidth: '120px'
      }}
    >
      {inputs.map(input => (
        <NodePort
          key={input.id}
          nodeId={node.id}
          port={input}
          type="input"
          hideLabel
          connected={connectedInputPorts?.has(`${node.id}-${input.id}`)}
        />
      ))}

      {isSet && (
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: accent === '#16825d' ? '#5FD3A6' : '#7BB8E8' }}
        >
          Set
        </span>
      )}

      <span className="font-mono text-xs text-[#E2D8B3] whitespace-nowrap flex-1">
        {node.data?.key || '未设置'}
      </span>

      {outputs.map(output => (
        <NodePort key={output.id} nodeId={node.id} port={output} type="output" hideLabel />
      ))}

      <button
        className="delete-button absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#2A2E37] text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(node.id);
        }}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}