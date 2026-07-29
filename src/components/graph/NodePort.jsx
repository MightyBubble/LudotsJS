import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getTypeColor, getTypeShape } from './nodeConfigs';

export default function NodePort({ nodeId, port, type }) {
  const isInput = type === 'input';
  const portColor = getTypeColor(port.type);
  const portShape = getTypeShape(port.type);

  const renderPortShape = () => {
    const size = 12;
    const commonProps = {
      style: {
        fill: portColor,
        stroke: '#1a1a1a',
        strokeWidth: 2,
        pointerEvents: 'none'
      }
    };

    switch (portShape) {
      case 'circle':
        return <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} {...commonProps} />;
      case 'square':
        return <rect x={1} y={1} width={size - 2} height={size - 2} {...commonProps} />;
      case 'diamond':
        return <polygon points={`${size / 2},1 ${size - 1},${size / 2} ${size / 2},${size - 1} 1,${size / 2}`} {...commonProps} />;
      case 'triangle':
        return <polygon points={`${size / 2},1 ${size - 1},${size - 1} 1,${size - 1}`} {...commonProps} />;
      default:
        return <circle cx={size / 2} cy={size / 2} r={size / 2 - 1} {...commonProps} />;
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
      <Handle
        id={port.id}
        type={isInput ? 'target' : 'source'}
        position={isInput ? Position.Left : Position.Right}
        data-node-id={nodeId}
        data-port-id={port.id}
        data-port-type={type}
        className="node-port"
        style={{
          position: 'absolute',
          top: '50%',
          left: isInput ? '-6px' : 'auto',
          right: isInput ? 'auto' : '-6px',
          transform: 'translateY(-50%)',
          width: 12,
          height: 12,
          minWidth: 12,
          minHeight: 12,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          zIndex: 20
        }}
      >
        <svg width="12" height="12" style={{ overflow: 'visible', display: 'block', pointerEvents: 'none' }}>
          {renderPortShape()}
        </svg>
      </Handle>
      <span
        className="font-medium leading-none"
        style={{
          marginLeft: isInput ? '10px' : '0',
          marginRight: isInput ? '0' : '10px'
        }}
      >
        {port.label}
      </span>
    </div>
  );
}