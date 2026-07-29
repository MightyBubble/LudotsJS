import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getTypeColor, getTypeShape } from './nodeConfigs';

/**
 * 虚幻蓝图风格引脚：
 * - 未连接为空心，已连接为实心
 * - 圆形=单值，方形=数组/集合，菱形=结构体，三角=执行流
 */
export default function NodePort({ nodeId, port, type, connected, hideLabel = false }) {
  const isInput = type === 'input';
  const portColor = getTypeColor(port.type);
  const portShape = getTypeShape(port.type);
  const isFilled = connected === undefined ? false : !!connected;
  const isExec = portShape === 'triangle';

  const renderPortShape = () => {
    const s = 13;
    const c = s / 2;
    const props = {
      fill: isFilled || isExec ? portColor : 'transparent',
      stroke: portColor,
      strokeWidth: 1.8,
      strokeLinejoin: 'round',
      style: { pointerEvents: 'none' }
    };

    switch (portShape) {
      case 'square':
        return (
          <g>
            <rect x={1.5} y={1.5} width={s - 3} height={s - 3} rx={1.5} {...props} />
            {!isFilled && <rect x={c - 1.25} y={c - 1.25} width={2.5} height={2.5} fill={portColor} />}
          </g>
        );
      case 'diamond':
        return <polygon points={`${c},1.2 ${s - 1.2},${c} ${c},${s - 1.2} 1.2,${c}`} {...props} />;
      case 'triangle':
        return <polygon points={`2,1.5 ${s - 1.5},${c} 2,${s - 1.5}`} {...props} />;
      default:
        return (
          <g>
            <circle cx={c} cy={c} r={c - 1.6} {...props} />
            {isFilled && <circle cx={c} cy={c} r={c - 4} fill="#0D0F14" opacity={0.35} />}
          </g>
        );
    }
  };

  return (
    <div
      className={`group flex items-center text-[11px] relative ${isInput ? 'flex-row' : 'flex-row-reverse text-right'}`}
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
          left: isInput ? '-7px' : 'auto',
          right: isInput ? 'auto' : '-7px',
          transform: 'translateY(-50%)',
          width: 14,
          height: 14,
          minWidth: 14,
          minHeight: 14,
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          zIndex: 20,
          cursor: 'crosshair'
        }}
      >
        <svg
          width="13"
          height="13"
          className="transition-transform duration-100 group-hover:scale-125"
          style={{ overflow: 'visible', display: 'block', pointerEvents: 'none', filter: `drop-shadow(0 0 2px ${portColor}55)` }}
        >
          {renderPortShape()}
        </svg>
      </Handle>
      {!hideLabel && (
        <span
          className="font-medium leading-none tracking-wide text-white/70"
          style={{
            marginLeft: isInput ? '11px' : '0',
            marginRight: isInput ? '0' : '11px'
          }}
        >
          {port.label}
        </span>
      )}
    </div>
  );
}