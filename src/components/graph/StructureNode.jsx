import React from 'react';
import { Handle, Position } from '@xyflow/react';

const portStyle = {
  position: 'relative',
  width: 12,
  height: 12,
  minWidth: 12,
  minHeight: 12,
  borderRadius: '9999px',
  background: '#4a4a4a',
  border: '1px solid #666',
  transform: 'none',
  top: 'auto',
  left: 'auto',
  right: 'auto'
};

export default function StructureNode({ node, selected }) {
  if (!node) return null;

  return (
    <div
      className={`px-3 py-2 rounded-md shadow-lg border transition-all min-w-[140px] cursor-move ${
        selected ? 'border-[#D97706] bg-[#2d2d2d]' : 'border-[#2A2E37] bg-[#0D0F14]'
      }`}
    >
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#2A2E37]">
        <span className="text-xs font-bold text-white truncate max-w-[100px]">{node.data?.label}</span>
        <div className="w-2 h-2 rounded-full bg-[#D97706]" />
      </div>

      <div className="text-[10px] text-gray-400 font-mono mb-2">{node.data?.nodeId}</div>

      <div className="flex justify-between items-center mt-1">
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          title="Incoming Relations"
          className="hover:!bg-[#D97706]"
          style={portStyle}
        />
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          title="Outgoing Relations"
          className="hover:!bg-[#D97706]"
          style={portStyle}
        />
      </div>
    </div>
  );
}