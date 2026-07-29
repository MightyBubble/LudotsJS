import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { tick, issueMove, issueAttack, issueAttackMove, issuePatrol, selectTarget, switchControl, getControlled, getUnit, getAutoTarget, getPrefs, smartOrder, cancelPending, commitPending, ABILITY_DEFS, ATTACK_RANGE } from '@/lib/commandLab';
import { createNoticeOverlay } from '@/components/lab/noticeOverlay';

const TEAM_COLORS = { 1: 0x3b82f6, 2: 0xef4444 };

// 3D scene: 对称多单位双阵营。点击友方=切换控制，点击敌方=选中（双击=攻击），点击地面=移动。
export default function LabScene({ stateRef, configRef, onFrame }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0d);
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 15, 11);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    mount.style.position = 'relative';
    const notices = createNoticeOverlay(mount);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshLambertMaterial({ color: 0x121216 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    scene.add(new THREE.GridHelper(24, 24, 0x3d3520, 0x1e1c15));

    // Units: capsule + facing cone per unit（同构，对称）
    const unitGroups = {};
    for (const u of stateRef.current.units) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 0.6, 4, 12),
        new THREE.MeshStandardMaterial({ color: TEAM_COLORS[u.team], emissive: TEAM_COLORS[u.team], emissiveIntensity: 0.15 })
      );
      body.position.y = 0.7;
      body.userData.unitId = u.id;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.4, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      cone.rotation.z = -Math.PI / 2;
      cone.position.set(0.6, 0.7, 0);
      cone.userData.unitId = u.id;
      g.add(body);
      g.add(cone);
      scene.add(g);
      const beam = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.9 })
      );
      beam.visible = false;
      scene.add(beam);
      unitGroups[u.id] = { g, body, cone, beam };
    }

    // Rings: 控制中（白）、射程、选中候选（琥珀）、悬停（浅蓝）
    const controlRing = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.62, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    controlRing.rotation.x = -Math.PI / 2;
    controlRing.position.y = 0.03;
    scene.add(controlRing);
    const rangeRing = new THREE.Mesh(
      new THREE.RingGeometry(ATTACK_RANGE - 0.04, ATTACK_RANGE, 48),
      new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    rangeRing.rotation.x = -Math.PI / 2;
    rangeRing.position.y = 0.02;
    scene.add(rangeRing);
    const selRing = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.85, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
    );
    selRing.rotation.x = -Math.PI / 2;
    selRing.position.y = 0.04;
    selRing.visible = false;
    scene.add(selRing);
    const hoverRing = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.8, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.y = 0.04;
    hoverRing.visible = false;
    scene.add(hoverRing);

    // ③确认层指示器：Armed 态显示施放范围圈 + 瞄准线（commit 前的实时预览）
    const pendRing = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    pendRing.rotation.x = -Math.PI / 2;
    pendRing.position.y = 0.05;
    pendRing.visible = false;
    scene.add(pendRing);
    const pendLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    pendLine.visible = false;
    scene.add(pendLine);

    // 统一视野圈（黑板感知半径）
    const sightR = stateRef.current.units[0].sight;
    const sightRing = new THREE.Mesh(
      new THREE.RingGeometry(sightR - 0.04, sightR + 0.04, 64),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    sightRing.rotation.x = -Math.PI / 2;
    sightRing.position.y = 0.015;
    scene.add(sightRing);

    // 每技能：候选纳入范围圈 + 自动目标连线/色环（自动施法开启时可见）
    const skillViz = {};
    Object.entries(ABILITY_DEFS).forEach(([aid, def], idx) => {
      if (aid === 'atk' || !def.cast?.targeted || !def.acquire) return;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(def.acquire.range - 0.03, def.acquire.range + 0.03, 48),
        new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02 + idx * 0.002;
      ring.visible = false;
      scene.add(ring);
      const line = new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: def.color, transparent: true, opacity: 0.9 })
      );
      line.visible = false;
      scene.add(line);
      const r0 = 0.95 + idx * 0.14;
      const marker = new THREE.Mesh(
        new THREE.RingGeometry(r0, r0 + 0.06, 32),
        new THREE.MeshBasicMaterial({ color: def.color, side: THREE.DoubleSide })
      );
      marker.rotation.x = -Math.PI / 2;
      marker.visible = false;
      scene.add(marker);
      skillViz[aid] = { ring, line, marker };
    });

    // Waypoints + path
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    const discGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16);
    const moveMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const atkMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const patrolMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const pathLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x10b981 })
    );
    scene.add(pathLine);

    // Projectiles
    const projGeo = new THREE.SphereGeometry(0.18, 10, 10);
    const projMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const projMeshes = new Map();

    // Transient FX
    const fxGroup = new THREE.Group();
    scene.add(fxGroup);
    const transients = [];

    const spawnFx = (fx) => {
      let mesh, ttl = 0.3, kind = fx.type;
      if (fx.type === 'swing') {
        mesh = new THREE.Mesh(
          new THREE.RingGeometry(0.6, fx.range, 20, 1, -0.65, 1.3),
          new THREE.MeshBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
        );
        mesh.rotation.x = -Math.PI / 2;
        const g = new THREE.Group();
        g.position.set(fx.x, 0.15, fx.z);
        g.add(mesh);
        g.rotation.y = -Math.atan2(fx.dz, fx.dx);
        fxGroup.add(g);
        transients.push({ mesh: g, mat: mesh.material, age: 0, ttl: 0.25, kind });
        return;
      } else if (fx.type === 'pulse') {
        mesh = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.5, 32),
          new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(fx.x, 0.1, fx.z);
        mesh.userData.radius = fx.radius;
        ttl = 0.45;
      } else {
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 })
        );
        mesh.position.set(fx.x, 0.8, fx.z);
        ttl = 0.2;
      }
      fxGroup.add(mesh);
      transients.push({ mesh, mat: mesh.material, age: 0, ttl, kind });
    };

    // Picking
    const raycaster = new THREE.Raycaster();
    const pickUnit = (ev) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const st = stateRef.current;
      const bodies = Object.values(unitGroups).map((o) => o.body);
      const hits = raycaster.intersectObjects(bodies);
      const hit = hits.find((h) => getUnit(st, h.object.userData.unitId)?.alive);
      return { st, unitId: hit ? hit.object.userData.unitId : null };
    };

    const groundPoint = () => {
      const g = raycaster.intersectObject(ground);
      return g.length > 0
        ? { x: Math.max(-11, Math.min(11, g[0].point.x)), z: Math.max(-11, Math.min(11, g[0].point.z)) }
        : null;
    };
    const onPointerDown = (ev) => {
      const { st, unitId } = pickUnit(ev);
      // 右键 = Input.Smart（上下文路由：敌=打/地=走/友=跟随/治疗）；确认态下右键优先取消
      if (ev.button === 2) {
        if (st.controller.pending) { cancelPending(st, '右键取消'); return; }
        if (unitId) { smartOrder(st, { targetId: unitId }, ev.shiftKey); return; }
        const p = groundPoint();
        if (p) smartOrder(st, p, ev.shiftKey);
        return;
      }
      if (ev.button !== 0) return;
      // ③确认层：confirm 模式下左键点击 = commit 边沿（点击点/点击对象即施法参数）
      const pend = st.controller.pending;
      if (pend && getPrefs(st, pend.id).castMode === 'confirm') {
        const p = groundPoint();
        commitPending(st, { targetId: unitId || undefined, aim: p || undefined });
        return;
      }
      const ctrl = getControlled(st);
      if (unitId) {
        const target = getUnit(st, unitId);
        if (target.team === ctrl.team) {
          // 点击友方（含自己）= 切换控制
          switchControl(st, unitId);
        } else if (ev.detail >= 2 || ev.shiftKey) {
          issueAttack(st, unitId, ev.shiftKey);
        } else {
          selectTarget(st, unitId);
        }
        return;
      }
      const p = groundPoint();
      if (!p) return;
      // A-move / 巡逻待确认：点击地面下达（巡逻 Shift+点击持续追加路点）
      if (st.controller.pendingOrder === 'attackmove') {
        st.controller.pendingOrder = null;
        issueAttackMove(st, p.x, p.z, ev.shiftKey);
      } else if (st.controller.pendingOrder === 'patrol') {
        if (!ev.shiftKey) st.controller.pendingOrder = null;
        issuePatrol(st, p.x, p.z);
      } else {
        issueMove(st, p.x, p.z, ev.shiftKey);
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onPointerMove = (ev) => {
      const { st, unitId } = pickUnit(ev);
      st.controller.hoverTargetId = unitId;
      const g = raycaster.intersectObject(ground);
      if (g.length > 0) st.controller.aim = { x: g[0].point.x, z: g[0].point.z };
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Loop
    let raf;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;
      tick(st, dt, configRef.current);
      const ctrl = getControlled(st);

      for (const u of st.units) {
        const o = unitGroups[u.id];
        if (!o) continue;
        o.g.position.set(u.x, 0, u.z);
        o.g.rotation.y = -Math.atan2(u.fz, u.fx);
        const hpScale = u.alive ? Math.max(0.35, u.health / u.maxHealth) : 0.2;
        o.body.scale.y = hpScale;
        o.body.position.y = 0.7 * hpScale;
        o.body.material.color.setHex(u.alive ? TEAM_COLORS[u.team] : 0x94a3b8);
        o.body.material.emissive.setHex(u.tags.includes('State.Channeling') ? 0x8b5cf6 : TEAM_COLORS[u.team]);
        o.body.material.emissiveIntensity = u.ability ? 0.6 : 0.15;
        o.cone.visible = u.alive;
        const bp = u.ability?.beamPoint;
        o.beam.visible = !!(bp && u.alive);
        if (bp) o.beam.geometry.setFromPoints([new THREE.Vector3(u.x, 0.8, u.z), new THREE.Vector3(bp.x, 0.8, bp.z)]);
      }

      controlRing.visible = !!ctrl?.alive;
      rangeRing.visible = !!ctrl?.alive;
      if (ctrl) {
        controlRing.position.set(ctrl.x, 0.03, ctrl.z);
        rangeRing.position.set(ctrl.x, 0.02, ctrl.z);
        rangeRing.material.color.setHex(TEAM_COLORS[ctrl.team]);
      }
      const sel = st.units.find((u) => u.id === st.controller.selectedTargetId && u.alive);
      selRing.visible = !!sel;
      if (sel) selRing.position.set(sel.x, 0.04, sel.z);
      const hov = st.units.find((u) => u.id === st.controller.hoverTargetId && u.alive && ctrl && u.team !== ctrl.team);
      hoverRing.visible = !!hov && st.controller.hoverTargetId !== st.controller.selectedTargetId;
      if (hov) hoverRing.position.set(hov.x, 0.04, hov.z);

      // ③确认层指示器
      const pend = st.controller.pending;
      pendRing.visible = pendLine.visible = !!(pend && ctrl?.alive);
      if (pend && ctrl) {
        const pdef = ABILITY_DEFS[pend.id];
        const r = pdef.cast?.range || 2;
        pendRing.scale.set(r, r, 1);
        pendRing.material.color.set(pdef.color);
        pendRing.position.set(ctrl.x, 0.05, ctrl.z);
        const aim = st.controller.aim;
        pendLine.material.color.set(pdef.color);
        pendLine.geometry.setFromPoints([new THREE.Vector3(ctrl.x, 0.45, ctrl.z), new THREE.Vector3(aim.x, 0.45, aim.z)]);
      }

      // 视野圈 + 每技能自动取目标可视化
      sightRing.visible = !!ctrl?.alive;
      if (ctrl) sightRing.position.set(ctrl.x, 0.015, ctrl.z);
      for (const viz of Object.values(skillViz)) {
        viz.ring.visible = viz.line.visible = viz.marker.visible = false;
      }
      if (ctrl?.alive) {
        for (const [aid, viz] of Object.entries(skillViz)) {
          const prof = st.prefs[aid] || {};
          if (!prof.autoAcquire || (prof.targetMode || 'unit') !== 'unit') continue;
          viz.ring.visible = true;
          viz.ring.position.set(ctrl.x, viz.ring.position.y, ctrl.z);
          const tgt = getAutoTarget(st, ctrl, prof);
          if (tgt) {
            viz.line.visible = true;
            viz.marker.visible = true;
            viz.line.geometry.setFromPoints([new THREE.Vector3(ctrl.x, 0.5, ctrl.z), new THREE.Vector3(tgt.x, 0.5, tgt.z)]);
            viz.marker.position.set(tgt.x, 0.05, tgt.z);
          }
        }
      }

      // Projectiles
      const liveIds = new Set();
      for (const p of st.projectiles) {
        liveIds.add(p.id);
        let m = projMeshes.get(p.id);
        if (!m) {
          m = new THREE.Mesh(projGeo, projMat);
          scene.add(m);
          projMeshes.set(p.id, m);
        }
        m.position.set(p.x, 0.8, p.z);
      }
      for (const [id, m] of projMeshes) {
        if (!liveIds.has(id)) { scene.remove(m); projMeshes.delete(id); }
      }

      // FX
      for (const fx of st.fx.splice(0)) spawnFx(fx);
      for (let i = transients.length - 1; i >= 0; i--) {
        const t = transients[i];
        t.age += dt;
        const k = t.age / t.ttl;
        if (k >= 1) {
          fxGroup.remove(t.mesh);
          transients.splice(i, 1);
          continue;
        }
        t.mat.opacity = (1 - k) * 0.8;
        if (t.kind === 'pulse') {
          const s = 1 + k * (t.mesh.userData.radius / 0.5 - 1);
          t.mesh.scale.set(s, s, 1);
        }
        if (t.kind === 'hit') t.mesh.scale.setScalar(1 + k * 1.5);
      }

      // Waypoint markers + path（所控单位）
      markerGroup.clear();
      const pts = ctrl ? [new THREE.Vector3(ctrl.x, 0.06, ctrl.z)] : [];
      if (ctrl) {
        for (const cmd of ctrl.queue) {
          let x, z;
          if (cmd.type === 'patrol') {
            for (const pt of cmd.points) {
              const marker = new THREE.Mesh(discGeo, patrolMat);
              marker.position.set(pt.x, 0.03, pt.z);
              markerGroup.add(marker);
              pts.push(new THREE.Vector3(pt.x, 0.06, pt.z));
            }
            continue;
          }
          if (cmd.type === 'move' || cmd.type === 'attackmove') { x = cmd.x; z = cmd.z; }
          else if (cmd.type === 'attack' || cmd.params?.targetId) {
            const e = getUnit(st, cmd.type === 'attack' ? cmd.targetId : cmd.params.targetId);
            if (!e) continue;
            x = e.x; z = e.z;
          } else if (cmd.params?.kind === 'point') { x = cmd.params.x; z = cmd.params.z; }
          else continue;
          const marker = new THREE.Mesh(discGeo, cmd.type === 'move' ? moveMat : atkMat);
          marker.position.set(x, 0.03, z);
          markerGroup.add(marker);
          pts.push(new THREE.Vector3(x, 0.06, z));
        }
      }
      pathLine.geometry.setFromPoints(pts);

      renderer.render(scene, camera);
      notices.update(st, camera, mount.clientWidth, mount.clientHeight);
      onFrame();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      notices.dispose();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []); // eslint-disable-line

  return <div ref={mountRef} className="w-full h-full" />;
}