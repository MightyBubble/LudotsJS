import * as THREE from 'three';

// 世界内飘字层 —— 统一接口：消费 state.notices（events.js NOTICE 适配器写入），
// 把单位头顶的拒绝/失效反馈投影到屏幕坐标，随时间上浮淡出。
export function createNoticeOverlay(mount) {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
  mount.appendChild(layer);
  const nodes = new Map();
  const v = new THREE.Vector3();

  function update(state, camera, width, height) {
    const live = new Set();
    for (const n of state.notices) {
      live.add(n.id);
      let el = nodes.get(n.id);
      if (!el) {
        el = document.createElement('div');
        el.textContent = n.text;
        el.style.cssText = 'position:absolute;transform:translate(-50%,-100%);font-size:11px;font-weight:600;color:#dc2626;background:rgba(255,255,255,.85);padding:1px 6px;border-radius:6px;white-space:nowrap;';
        layer.appendChild(el);
        nodes.set(n.id, el);
      }
      const unit = state.units.find((u) => u.id === n.unitId);
      const x = unit ? unit.x : n.x || 0;
      const z = unit ? unit.z : n.z || 0;
      const age = state.time - n.at;
      v.set(x, 2 + age * 0.7, z).project(camera);
      el.style.left = `${(v.x * 0.5 + 0.5) * width}px`;
      el.style.top = `${(-v.y * 0.5 + 0.5) * height}px`;
      el.style.opacity = String(Math.max(0, 1 - age / 1.4));
    }
    for (const [id, el] of nodes) {
      if (!live.has(id)) { el.remove(); nodes.delete(id); }
    }
  }

  return { update, dispose: () => layer.remove() };
}