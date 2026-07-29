import React, { useRef, useState, useCallback } from 'react';

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 60;

/**
 * Shared drag-and-pan canvas for both BT and FSM editors.
 * - nodes: [{id, x, y, ...}]
 * - connections: [{id, from, to, color?}]
 * - renderNode: (node) => ReactNode
 */
export default function EditorCanvas({
  nodes,
  connections,
  onNodeMove,
  selectedId,
  onSelectNode,
  renderNode,
  children,
}) {
  const containerRef = useRef(null);
  const [pan, setPan] = useState({ x: 48, y: 40 });
  const [drag, setDrag] = useState(null);
  const [panStart, setPanStart] = useState(null);

  const onNodeMouseDown = useCallback(
    (e, node) => {
      e.stopPropagation();
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left - pan.x;
      const my = e.clientY - rect.top - pan.y;
      setDrag({ id: node.id, dx: mx - node.x, dy: my - node.y });
      onSelectNode?.(node.id);
    },
    [pan.x, pan.y, onSelectNode]
  );

  const onMouseMove = useCallback(
    (e) => {
      const rect = containerRef.current.getBoundingClientRect();
      if (drag) {
        const x = e.clientX - rect.left - pan.x - drag.dx;
        const y = e.clientY - rect.top - pan.y - drag.dy;
        onNodeMove?.(drag.id, x, y);
      } else if (panStart) {
        setPan({
          x: panStart.panX + (e.clientX - panStart.startX),
          y: panStart.panY + (e.clientY - panStart.startY),
        });
      }
    },
    [drag, panStart, pan.x, pan.y, onNodeMove]
  );

  const onMouseUp = useCallback(() => {
    setDrag(null);
    setPanStart(null);
  }, []);

  const onBackgroundDown = useCallback(
    (e) => {
      onSelectNode?.(null);
      setPanStart({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
    },
    [pan.x, pan.y, onSelectNode]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-900 select-none cursor-grab active:cursor-grabbing"
      onMouseDown={onBackgroundDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(100,116,139,0.25) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* World layer (panned) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
      >
        {/* SVG connections */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, width: '1px', height: '1px', overflow: 'visible' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
            </marker>
          </defs>
          {connections.map((conn) => {
            const from = nodes.find((n) => n.id === conn.from);
            const to = nodes.find((n) => n.id === conn.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_WIDTH / 2;
            const y1 = from.y + NODE_HEIGHT;
            const x2 = to.x + NODE_WIDTH / 2;
            const y2 = to.y;
            const dy = Math.max(30, Math.abs(y2 - y1) / 2);
            return (
              <path
                key={conn.id}
                d={`M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`}
                stroke={conn.color || '#475569'}
                strokeWidth={2}
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute rounded-lg overflow-hidden pointer-events-auto cursor-move transition-shadow ${
              selectedId === node.id
                ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                : ''
            }`}
            style={{
              left: node.x,
              top: node.y,
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
              zIndex: selectedId === node.id ? 20 : 10,
            }}
            onMouseDown={(e) => onNodeMouseDown(e, node)}
          >
            {renderNode(node)}
          </div>
        ))}
      </div>

      {/* Toolbar / overlays */}
      {children}
    </div>
  );
}