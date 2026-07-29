import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

const formatValue = (value) => {
  if (value === undefined || value === null) return 'null';

  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  if (typeof value === 'object') {
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

    if (value.color && typeof value.color === 'object') {
      const c = value.color;
      if (c.r !== undefined && c.g !== undefined && c.b !== undefined) {
        return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
      }
    }

    if (value.x !== undefined && value.y !== undefined) {
      if (value.z !== undefined) {
        if (value.w !== undefined) {
          return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)}, ${value.z.toFixed(1)}, ${value.w.toFixed(1)})`;
        }
        return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)}, ${value.z.toFixed(1)})`;
      }
      return `(${value.x.toFixed(1)}, ${value.y.toFixed(1)})`;
    }

    if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      return `rgb(${Math.round(value.r * 255)}, ${Math.round(value.g * 255)}, ${Math.round(value.b * 255)})`;
    }
  }

  if (typeof value === 'string') {
    return value.length > 20 ? value.substring(0, 20) + '...' : value;
  }

  return String(value);
};

export default function Connection({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data
}) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const strokeColor = selected ? '#ffa500' : '#999';
  const strokeWidth = selected ? 3 : 2;
  const value = data?.value;
  const label = data?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={20}
        style={{
          stroke: strokeColor,
          strokeWidth,
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }}
      />

      {(value !== undefined && value !== null) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#15171C',
              border: `1px solid ${strokeColor}`,
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#fff',
              pointerEvents: 'none'
            }}
          >
            {formatValue(value)}
          </div>
        </EdgeLabelRenderer>
      )}

      {(value === undefined || value === null) && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#15171C',
              border: `1px solid ${strokeColor}`,
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: 10,
              color: '#E2D8B3',
              pointerEvents: 'none'
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}