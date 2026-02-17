import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

const formatValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return value.toFixed(2);
  if (typeof value === 'object') {
    if (value.vector && typeof value.vector === 'object') {
      const v = value.vector;
      if (v.x !== undefined && v.y !== undefined) {
        if (v.z !== undefined) {
          if (v.w !== undefined) return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)}, ${v.w.toFixed(1)})`;
          return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;
        }
        return `(${v.x.toFixed(1)}, ${v.y.toFixed(1)})`;
      }
    }
    if (value.x !== undefined && value.y !== undefined) {
      if (value.z !== undefined) {
        if (value.w !== undefined) return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)}, ${value.z.toFixed(1)}, ${value.w.toFixed(1)})`;
        return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)}, ${value.z.toFixed(1)})`;
      }
      return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)})`;
    }
    if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      return `rgb(${Math.round(value.r * 255)}, ${Math.round(value.g * 255)}, ${Math.round(value.b * 255)})`;
    }
  }
  if (typeof value === 'string') return value.length > 20 ? value.substring(0, 20) + '...' : value;
  return String(value);
};

export default function RFCustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strokeColor = selected ? '#ffa500' : '#999';
  const strokeWidth = selected ? 3 : 2;
  const displayValue = data?.value !== undefined && data?.value !== null ? formatValue(data.value) : null;

  return (
    <>
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        style={{ transition: 'stroke 0.2s, stroke-width 0.2s', ...style }}
        className="react-flow__edge-path"
      />
      {displayValue && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              background: '#1e1e1e',
              border: `1px solid ${strokeColor}`,
              borderRadius: 3,
              padding: '2px 8px',
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#fff',
            }}
          >
            {displayValue}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}