import { useEffect, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { base44 } from '@/api/base44Client';
import { createAgent, processCommands, processAbilities, updateNearestEnemy, ABILITIES } from '@/lib/simBehaviors';
import { executeBT, executeFSM, buildTaskNodeMap } from '@/lib/executors';
import SimControls from '@/components/test/SimControls';
import SimStats from '@/components/test/SimStats';
import { FlaskConical, MousePointerClick } from 'lucide-react';

const NPC_COLORS = [0x3b82f6, 0x10b981, 0xa855f7, 0xf59e0b];
const NPC_POSITIONS = [
  { x: -6, z: -6 },
  { x: 6, z: -6 },
  { x: -6, z: 6 },
  { x: 6, z: 6 },
];
const ENEMY_POSITIONS = [
  { x: 0, z: 9 },
  { x: 9, z: 0 },
  { x: -9, z: -9 },
];

const LABEL_COLORS = {
  巡逻: 0x3b82f6,
  追击: 0xf59e0b,
  攻击: 0xef4444,
  近战攻击: 0xdc2626,
  远程攻击: 0xf97316,
  逃跑: 0xa855f7,
  待机: 0x64748b,
  治疗: 0x10b981,
};

function createAgents() {
  return NPC_POSITIONS.map((pos, i) => {
    const agent = createAgent();
    agent.position = { ...pos };
    agent.currentWaypoint = i;
    return agent;
  });
}

function createEnemies() {
  return ENEMY_POSITIONS.map((pos) => ({
    position: { ...pos },
    health: 100,
    alive: true,
  }));
}

export default function TestEnvironment() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('bt');
  const [btList, setBtList] = useState([]);
  const [fsmList, setFsmList] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [running, setRunning] = useState(false);
  const [executorName, setExecutorName] = useState('');
  const [stats, setStats] = useState({ agents: [], enemies: [], log: [] });

  // Refs for animation loop
  const agentsRef = useRef(createAgents());
  const enemiesRef = useRef(createEnemies());
  const executorRef = useRef(null);
  const runningRef = useRef(false);
  const logRef = useRef([]);

  // Load lists
  useEffect(() => {
    (async () => {
      const [bts, fsms] = await Promise.all([
        base44.entities.BehaviorTree.list('-created_date'),
        base44.entities.StateMachine.list('-created_date'),
      ]);
      setBtList(bts);
      setFsmList(fsms);
      if (bts.length) setSelectedId(bts[0].id);
    })();
  }, []);

  // Load executor — does NOT reset agents (enables real-time BT/FSM switching)
  const loadExecutor = useCallback(async () => {
    if (!selectedId) return;
    const taskNodes = await base44.entities.TaskNode.list();
    const taskNodeMap = buildTaskNodeMap(taskNodes);
    if (mode === 'bt') {
      const bt = await base44.entities.BehaviorTree.get(selectedId);
      executorRef.current = { type: 'bt', data: bt.data, taskNodeMap };
      setExecutorName(bt.name);
    } else {
      const fsm = await base44.entities.StateMachine.get(selectedId);
      executorRef.current = { type: 'fsm', data: fsm.data, taskNodeMap };
      setExecutorName(fsm.name);
    }
  }, [selectedId, mode]);

  useEffect(() => {
    loadExecutor();
  }, [loadExecutor]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const handleModeSwitch = (m) => {
    setMode(m);
    if (m === 'bt' && btList.length) setSelectedId(btList[0].id);
    if (m === 'fsm' && fsmList.length) setSelectedId(fsmList[0].id);
    // Real-time switching: don't stop running, don't reset agents
  };

  const handleReset = () => {
    agentsRef.current = createAgents();
    enemiesRef.current = createEnemies();
    logRef.current = [];
    setRunning(false);
  };

  const currentList = mode === 'bt' ? btList : fsmList;

  // Three.js scene setup (once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 25, 50);

    const camera = new THREE.PerspectiveCamera(
      50, container.clientWidth / container.clientHeight, 0.1, 100
    );
    camera.position.set(18, 22, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Ground (larger)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Grid
    scene.add(new THREE.GridHelper(40, 40, 0x334155, 0x1e293b));

    // Waypoint route
    const waypoints = createAgent().waypoints;
    const routePoints = [...waypoints, waypoints[0]].map((p) => new THREE.Vector3(p.x, 0.05, p.z));
    const routeGeom = new THREE.BufferGeometry().setFromPoints(routePoints);
    const routeLine = new THREE.Line(
      routeGeom,
      new THREE.LineDashedMaterial({ color: 0xfbbf24, dashSize: 0.3, gapSize: 0.2, opacity: 0.3, transparent: true })
    );
    routeLine.computeLineDistances();
    scene.add(routeLine);
    const wpGeom = new THREE.SphereGeometry(0.2, 8, 8);
    const wpMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    waypoints.forEach((wp) => {
      const m = new THREE.Mesh(wpGeom, wpMat);
      m.position.set(wp.x, 0.2, wp.z);
      scene.add(m);
    });

    // Create NPC meshes + rings + beams
    const npcMeshes = [];
    const meleeRings = [];
    const rangedRings = [];
    const beams = [];

    for (let i = 0; i < NPC_POSITIONS.length; i++) {
      const npc = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
        new THREE.MeshStandardMaterial({ color: NPC_COLORS[i], emissive: 0x1e3a5f, emissiveIntensity: 0.3 })
      );
      npc.position.set(NPC_POSITIONS[i].x, 0.6, NPC_POSITIONS[i].z);

      // Team color ring at base
      const teamRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.65, 16),
        new THREE.MeshBasicMaterial({ color: NPC_COLORS[i], side: THREE.DoubleSide })
      );
      teamRing.rotation.x = -Math.PI / 2;
      teamRing.position.y = -0.55;
      npc.add(teamRing);

      scene.add(npc);
      npcMeshes.push(npc);

      // Melee range ring
      const mr = new THREE.Mesh(
        new THREE.RingGeometry(2.85, 3.0, 32),
        new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
      );
      mr.rotation.x = -Math.PI / 2;
      mr.position.y = 0.02;
      scene.add(mr);
      meleeRings.push(mr);

      // Ranged range ring
      const rr = new THREE.Mesh(
        new THREE.RingGeometry(7.85, 8.0, 32),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.1, side: THREE.DoubleSide })
      );
      rr.rotation.x = -Math.PI / 2;
      rr.position.y = 0.02;
      scene.add(rr);
      rangedRings.push(rr);

      // Beam (ranged attack)
      const beamGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.6, 0),
        new THREE.Vector3(0, 0.4, 0),
      ]);
      const beam = new THREE.Line(
        beamGeom,
        new THREE.LineBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.7 })
      );
      beam.visible = false;
      scene.add(beam);
      beams.push(beam);
    }

    // Create enemy meshes
    const enemyMeshes = ENEMY_POSITIONS.map((pos) => {
      const enemy = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x5f1e1e, emissiveIntensity: 0.3 })
      );
      enemy.position.set(pos.x, 0.4, pos.z);
      scene.add(enemy);
      return enemy;
    });

    // Raycaster — click to move nearest enemy
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onCanvasClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(ground);
      if (hits.length === 0) return;
      const p = hits[0].point;
      const enemies = enemiesRef.current;
      let nearest = null;
      let minDist = Infinity;
      for (const en of enemies) {
        if (!en.alive) continue;
        const d = Math.sqrt((en.position.x - p.x) ** 2 + (en.position.z - p.z) ** 2);
        if (d < minDist) { minDist = d; nearest = en; }
      }
      if (nearest) {
        nearest.position.x = p.x;
        nearest.position.z = p.z;
      } else {
        const dead = enemies.find((en) => !en.alive);
        if (dead) {
          dead.alive = true;
          dead.health = 100;
          dead.position.x = p.x;
          dead.position.z = p.z;
        }
      }
    };
    canvas.addEventListener('click', onCanvasClick);

    // Resize
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // Animation loop
    let lastTime = performance.now();
    let frameCount = 0;
    let animId;

    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const agents = agentsRef.current;
      const enemies = enemiesRef.current;
      const exec = executorRef.current;

      // Execute behaviors + process commands
      if (runningRef.current && exec) {
        for (let i = 0; i < agents.length; i++) {
          const agent = agents[i];
          updateNearestEnemy(agent, enemies);
          if (exec.type === 'bt') {
            const root = (exec.data?.nodes || []).find((n) => n.type === 'root');
            if (root) executeBT(root, exec.data.nodes, exec.taskNodeMap, agent, dt);
          } else {
            executeFSM(exec.data, exec.taskNodeMap, agent, dt);
          }
          processAbilities(agent, dt);
          processCommands(agent, dt);

          // Track label changes for log
          if (agent.label !== agent._lastLabel && agent.label !== '—') {
            agent._lastLabel = agent.label;
            logRef.current = [`NPC${i + 1} → ${agent.label}`, ...logRef.current].slice(0, 12);
          }
        }
      }

      // Sync NPC meshes
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        const mesh = npcMeshes[i];
        if (!mesh || !agent) continue;

        const prevX = mesh.position.x;
        const prevZ = mesh.position.z;
        mesh.position.x = agent.position.x;
        mesh.position.z = agent.position.z;
        const dx = agent.position.x - prevX;
        const dz = agent.position.z - prevZ;
        if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
          mesh.rotation.y = Math.atan2(dx, dz);
        }
        const color = LABEL_COLORS[agent.label];
        if (color !== undefined) mesh.material.color.setHex(color);
        // Dim emissive during lockout (visual recovery indicator)
        mesh.material.emissiveIntensity = agent.lockoutTimer > 0 ? 0.05 : 0.3;

        // Rings follow NPC
        meleeRings[i].position.x = agent.position.x;
        meleeRings[i].position.z = agent.position.z;
        rangedRings[i].position.x = agent.position.x;
        rangedRings[i].position.z = agent.position.z;

        // Beam for ranged attacks
        const showBeam = agent.label === '远程攻击' && agent.enemy.alive;
        beams[i].visible = showBeam;
        if (showBeam) {
          const pos = beams[i].geometry.attributes.position;
          pos.setXYZ(0, agent.position.x, 0.6, agent.position.z);
          pos.setXYZ(1, agent.enemy.position.x, 0.4, agent.enemy.position.z);
          pos.needsUpdate = true;
        }
      }

      // Sync enemy meshes
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const mesh = enemyMeshes[i];
        if (!mesh || !enemy) continue;
        mesh.position.x = enemy.position.x;
        mesh.position.z = enemy.position.z;
        mesh.visible = enemy.alive;
        const s = enemy.health < 30 ? 0.8 + Math.sin(now * 0.01) * 0.1 : 1;
        mesh.scale.setScalar(s);
      }

      // Throttled stats update
      frameCount++;
      if (frameCount % 10 === 0) {
        const agentStats = agents.map((a) => {
          let stateName = '—';
          if (exec?.type === 'fsm') {
            const st = (exec.data?.states || []).find((s) => s.id === a.fsmState);
            stateName = st?.name || '—';
          }
          return {
            health: Math.round(a.health),
            label: a.label,
            stateName,
            ability: a.activeAbility ? (ABILITIES[a.activeAbility.key]?.label || a.activeAbility.key) : null,
            lockout: a.lockoutTimer > 0 ? Math.ceil(a.lockoutTimer * 10) / 10 : 0,
            queue: a.abilityQueue.map((q) => ABILITIES[q.key]?.label || q.key),
            visionRange: a.visionRange,
            attackRange: a.attackRange,
            rangedRange: a.rangedRange,
            hasTarget: !!a.enemy?.alive,
          };
        });
        const enemyStats = enemies.map((e) => ({
          health: Math.round(e.health),
          alive: e.alive,
        }));
        setStats({ agents: agentStats, enemies: enemyStats, log: [...logRef.current] });
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('click', onCanvasClick);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <SimControls
        mode={mode}
        onModeSwitch={handleModeSwitch}
        selectedId={selectedId}
        onSelectChange={setSelectedId}
        currentList={currentList}
        running={running}
        onToggleRun={() => setRunning(!running)}
        onReset={handleReset}
        executorName={executorName}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur text-xs text-slate-300">
            <MousePointerClick className="w-3 h-3" />
            点击地面移动最近的敌人
          </div>
          {!selectedId && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
              <div className="text-center">
                <FlaskConical className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">请先创建并选择一个{mode === 'bt' ? '行为树' : '状态机'}</p>
              </div>
            </div>
          )}
        </div>

        <SimStats
          agentStats={stats.agents}
          enemyStats={stats.enemies}
          mode={mode}
          log={stats.log}
        />
      </div>
    </div>
  );
}