// 对齐辅助线 + 自动吸附（React Flow 官方 Helper Lines Pro 模式的自研实现，全部编辑器共享）。
// 拖动节点时：本节点的 左/中/右 与其他节点的 左/中/右、顶/中/底 两两比较，
// 屏幕 8px 以内吸附到对齐位置并亮出贯穿画布的辅助线；松手即清除。
import { useCallback, useState } from 'react';
import { useStore } from 'reactflow';

export function useHelperLines(nodes, setNodes, getZoom) {
  const [helper, setHelper] = useState({}); // { x?, y? }（世界坐标）
  const clear = useCallback(() => setHelper({}), []);
  const onDrag = useCallback((_, dragNode) => {
    const zoom = getZoom?.() || 1;
    const threshold = 8 / zoom; // 屏幕 8px → 世界坐标
    const w = dragNode.width ?? 200, h = dragNode.height ?? 80;
    const mineX = [dragNode.position.x, dragNode.position.x + w / 2, dragNode.position.x + w];
    const mineY = [dragNode.position.y, dragNode.position.y + h / 2, dragNode.position.y + h];
    let bx = null, by = null;
    for (const n of nodes) {
      if (n.id === dragNode.id) continue;
      const nw = n.width ?? 200, nh = n.height ?? 80;
      const xs = [n.position.x, n.position.x + nw / 2, n.position.x + nw];
      const ys = [n.position.y, n.position.y + nh / 2, n.position.y + nh];
      for (let i = 0; i < 3; i++) {
        for (const v of xs) {
          const d = Math.abs(mineX[i] - v);
          if (d <= threshold && (!bx || d < bx.d)) bx = { d, snap: v - (i * w) / 2, line: v };
        }
        for (const v of ys) {
          const d = Math.abs(mineY[i] - v);
          if (d <= threshold && (!by || d < by.d)) by = { d, snap: v - (i * h) / 2, line: v };
        }
      }
    }
    setHelper({ x: bx?.line, y: by?.line });
    if (bx || by) {
      setNodes((ns) => ns.map((n) => (n.id === dragNode.id
        ? { ...n, position: { x: bx ? bx.snap : n.position.x, y: by ? by.snap : n.position.y } }
        : n)));
    }
  }, [nodes, setNodes, getZoom]);
  return { helper, onDrag, clear };
}

// 辅助线渲染：必须是 <ReactFlow> 的子组件（用 store 的 viewport 变换把世界坐标换算为屏幕坐标）
export function HelperLines({ x, y }) {
  const [tx, ty, zoom] = useStore((s) => s.transform);
  return (
    <>
      {x !== undefined && (
        <div className="absolute pointer-events-none" style={{ zIndex: 30, left: x * zoom + tx, top: 0, bottom: 0, width: 1, background: '#E8E8EDdd' }} />
      )}
      {y !== undefined && (
        <div className="absolute pointer-events-none" style={{ zIndex: 30, top: y * zoom + ty, left: 0, right: 0, height: 1, background: '#E8E8EDdd' }} />
      )}
    </>
  );
}
