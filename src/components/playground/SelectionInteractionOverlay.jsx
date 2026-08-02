import React, { useMemo, useState } from 'react';

const EVENT_IDS = {
  screen_box: 'Selection.Screen.Box', screen_lasso: 'Selection.Screen.Lasso',
  world_box: 'Selection.World.Box', world_lasso: 'Selection.World.Lasso',
};
const fallbackStyle = { enabled: true, stroke_color: '#7DD3FC', fill_color: '#38BDF833', line_width: 2 };

export default function SelectionInteractionOverlay({ config, mode, viewportRef, onSelection }) {
  const [points, setPoints] = useState([]);
  const style = useMemo(() => ({ ...fallbackStyle, ...(config?.modes?.[mode] || {}) }), [config, mode]);
  if (!config?.enabled || !style.enabled) return null;
  const localPoint = event => { const rect = event.currentTarget.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const start = event => { event.currentTarget.setPointerCapture(event.pointerId); setPoints([localPoint(event)]); };
  const move = event => { if (!points.length) return; const point = localPoint(event); setPoints(list => mode.endsWith('box') ? [list[0], point] : [...list, point]); };
  const finish = event => {
    if (!points.length) return;
    const finalPoints = mode.endsWith('box') ? [points[0], localPoint(event)] : [...points, localPoint(event)];
    const entities = viewportRef.current?.selectByScreenShape(finalPoints, mode.endsWith('lasso') ? 'lasso' : 'box') || [];
    window.dispatchEvent(new CustomEvent('ludots:level-event', { detail: { eventId: EVENT_IDS[mode], payload: entities } }));
    onSelection?.(EVENT_IDS[mode], entities);
    setPoints([]);
  };
  const box = points.length > 1 ? { x: Math.min(points[0].x, points[1].x), y: Math.min(points[0].y, points[1].y), width: Math.abs(points[1].x - points[0].x), height: Math.abs(points[1].y - points[0].y) } : null;
  return <div data-testid="selection-overlay" className="absolute inset-0 z-10 cursor-crosshair touch-none" onPointerDown={start} onPointerMove={move} onPointerUp={finish}>
    <svg className="h-full w-full pointer-events-none">
      {box && <rect {...box} fill={style.fill_color} stroke={style.stroke_color} strokeWidth={style.line_width} />}
      {!mode.endsWith('box') && points.length > 1 && <polygon points={points.map(point => `${point.x},${point.y}`).join(' ')} fill={style.fill_color} stroke={style.stroke_color} strokeWidth={style.line_width} />}
    </svg>
  </div>;
}