import React from 'react';

const formatValue = (value) => {
  if (value === undefined || value === null) return 'null';
  
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  
  if (typeof value === 'object') {
    // 处理嵌套的 vector 对象 (例如 { vector: { x, y, z } })
    if (value.vector && typeof value.vector === 'object') {
      const v = value.vector;
      if (v.x !== undefined && v.y !== undefined) {
        if (v.z !== undefined) {
          if (v.w !== undefined) {
            return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)}, ${v.w.toFixed(1)})`;
          }
          return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;
        }
        return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
      }
    }
    
    // 处理嵌套的 color 对象 (例如 { color: { r, g, b } })
    if (value.color && typeof value.color === 'object') {
      const c = value.color;
      if (c.r !== undefined && c.g !== undefined && c.b !== undefined) {
        return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
      }
    }
    
    // 处理直接的向量对象 { x, y, z, w }
    if (value.x !== undefined && value.y !== undefined) {
      if (value.z !== undefined) {
        if (value.w !== undefined) {
          return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)}, ${value.z.toFixed(1)}, ${value.w.toFixed(1)})`;
        }
        return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)}, ${value.z.toFixed(1)})`;
      }
      return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)})`;
    }
    
    // 处理直接的颜色对象 { r, g, b }
    if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      return `rgb(${Math.round(value.r * 255)}, ${Math.round(value.g * 255)}, ${Math.round(value.b * 255)})`;
    }
  }
  
  if (typeof value === 'string') {
    return value.length > 20 ? value.substring(0, 20) + '...' : value;
  }
  
  return String(value);
};

export default function Connection({ id, fromX, fromY, toX, toY, value, selected, onSelect, onDelete, temporary = false }) {
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  
  const controlPointOffset = Math.abs(toX - fromX) * 0.5;
  const path = `M ${fromX} ${fromY} C ${fromX + controlPointOffset} ${fromY}, ${toX - controlPointOffset} ${toY}, ${toX} ${toY}`;

  const handleClick = (e) => {
    if (temporary) return;
    e.stopPropagation();
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect?.(id, multiSelect);
  };

  const strokeColor = selected ? '#ffa500' : (temporary ? '#666' : '#999');
  const strokeWidth = selected ? 3 : 2;

  return (
    <g onClick={handleClick}>
      <path
        d={path}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ cursor: temporary ? 'default' : 'pointer' }}
      />
      
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={temporary ? '5,5' : 'none'}
        style={{ 
          pointerEvents: 'none',
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }}
      />

      {!temporary && value !== undefined && value !== null && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x="-30"
            y="-10"
            width="60"
            height="20"
            fill="#1e1e1e"
            stroke={strokeColor}
            strokeWidth="1"
            rx="3"
            style={{ pointerEvents: 'none' }}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize="10"
            fontFamily="monospace"
            style={{ pointerEvents: 'none' }}
          >
            {formatValue(value)}
          </text>
        </g>
      )}
    </g>
  );
}