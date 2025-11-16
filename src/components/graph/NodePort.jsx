import React from 'react';
import { getTypeColor, getTypeShape } from './nodeConfigs';

export default function NodePort({ nodeId, port, type, onStartConnection, onEndConnection }) {
  const isInput = type === 'input';
  const portColor = getTypeColor(port.type);
  const portShape = getTypeShape(port.type);

  const handleMouseDown = (e) => {
    if (type === 'output') {
      e.stopPropagation();
      onStartConnection?.(nodeId, port.id);
    }
  };

  const handleMouseUp = (e) => {
    if (type === 'input') {
      e.stopPropagation();
      onEndConnection?.(nodeId, port.id);
    }
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
      className={`flex items-center gap-2 ${isInput ? 'flex-row' : 'flex-row-reverse'} text-white/80`}
      style={{ fontSize: '11px' }}
    >
      <div className="relative" style={{ width: 12, height: 12 }}>
        <svg width="12" height="12" style={{ overflow: 'visible' }}>
          {renderPortShape()}
        </svg>
      </div>
      <span className="text-white/70">{port.label}</span>
    </div>
  );
}