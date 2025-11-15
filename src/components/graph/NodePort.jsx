import React, { useRef } from 'react';

const portColors = {
  number: '#5b9bd5',
  vector: '#70ad47',
  color: '#ffc000',
  any: '#808080'
};

export default function NodePort({ 
  nodeId,
  port, 
  type,
  onStartConnection,
  onEndConnection 
}) {
  const portRef = useRef(null);
  const isInput = type === 'input';
  const color = portColors[port.type] || portColors.any;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (portRef.current) {
      onStartConnection(nodeId, port.id, type, portRef.current);
    }
  };

  const handleMouseUp = (e) => {
    e.stopPropagation();
    onEndConnection(nodeId, port.id, type);
  };

  return (
    <div 
      className={`flex items-center text-xs text-white/80 relative ${isInput ? 'flex-row' : 'flex-row-reverse text-right'}`}
      style={{ 
        position: 'relative',
        paddingLeft: isInput ? '0' : '8px',
        paddingRight: isInput ? '8px' : '0'
      }}
    >
      <div
        ref={portRef}
        data-node-id={nodeId}
        data-port-id={port.id}
        data-port-type={type}
        className="node-port w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform flex-shrink-0"
        style={{ 
          backgroundColor: color,
          border: '2px solid #2a2a2a',
          position: 'absolute',
          left: isInput ? '-6px' : 'auto',
          right: isInput ? 'auto' : '-6px',
          zIndex: 20
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      <span className="font-medium leading-none" style={{ 
        marginLeft: isInput ? '10px' : '0',
        marginRight: isInput ? '0' : '10px'
      }}>
        {port.label}
      </span>
    </div>
  );
}