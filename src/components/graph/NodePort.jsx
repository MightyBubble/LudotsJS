import React, { useRef } from 'react';
import { getTypeColor, getTypeShape } from './nodeConfigs';

export default function NodePort({ nodeId, port, type, onStartConnection, onEndConnection }) {
  const portRef = useRef(null);
  const isInput = type === 'input';
  const portColor = getTypeColor(port.type);
  const portShape = getTypeShape(port.type);

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

  const renderPortShape = () => {
    const size = 12;
    const commonProps = {
      className: "node-port transition-all",
      style: { 
        fill: portColor,
        stroke: '#1a1a1a',
        strokeWidth: 2,
        cursor: 'pointer'
      },
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp
    };

    switch (portShape) {
      case 'circle':
        return <circle cx={size/2} cy={size/2} r={size/2 - 1} {...commonProps} />;
      case 'square':
        return <rect x={1} y={1} width={size - 2} height={size - 2} {...commonProps} />;
      case 'diamond':
        return <polygon points={`${size/2},1 ${size-1},${size/2} ${size/2},${size-1} 1,${size/2}`} {...commonProps} />;
      case 'triangle':
        return <polygon points={`${size/2},1 ${size-1},${size-1} 1,${size-1}`} {...commonProps} />;
      default:
        return <circle cx={size/2} cy={size/2} r={size/2 - 1} {...commonProps} />;
    }
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
        style={{ 
          position: 'absolute',
          left: isInput ? '-6px' : 'auto',
          right: isInput ? 'auto' : '-6px',
          zIndex: 20,
          width: 12,
          height: 12
        }}
      >
        <svg width="12" height="12" style={{ overflow: 'visible' }}>
          {renderPortShape()}
        </svg>
      </div>
      <span className="font-medium leading-none" style={{ 
        marginLeft: isInput ? '10px' : '0',
        marginRight: isInput ? '0' : '10px'
      }}>
        {port.label}
      </span>
    </div>
  );
}