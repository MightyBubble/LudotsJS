import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { ABILITY_DEFS, KEYBOARD_MAP, ACTION_BINDINGS, createLabState, pressInput, releaseInput, bindSkillTarget, getControlled, switchControl, cycleControl, getAutoTarget, getAutoScores, effectiveTags, setStance } from '@/lib/commandLab';
import { loadUtilityAssets, selectorAssetIndex } from '@/lib/ai/utility/seedassets.js';
import { createTemplateLibrary, createCommandBus, BUILTIN_TEMPLATES } from '@/lib/ai/templates/library.js';
import { buildAbilityTemplates, labGraphCtx } from '@/lib/lab/abilityTemplates.js';
import { ensureStanceBehaviorDefs } from '@/lib/lab/stanceBehaviorDefs.js';
import { ensureStanceConditionDefs } from '@/lib/lab/stanceConditionDefs.js';
import { findStanceMachineRow } from '@/lib/lab/stances';
import { CONTEXT_ROUTES } from '@/lib/lab/contextRouting';
import StancePanel from '@/components/lab/StancePanel';
import UnitSwitcher from '@/components/lab/UnitSwitcher';
import BlackboardPanel from '@/components/lab/BlackboardPanel';
import UtilityScorePanel from '@/components/lab/UtilityScorePanel';
import CastPrefsPanel from '@/components/lab/CastPrefsPanel';
import LabScene from '@/components/lab/LabScene';
import CastBar from '@/components/lab/CastBar';
import BufferPanel from '@/components/lab/BufferPanel';
import CommandQueuePanel from '@/components/lab/CommandQueuePanel';
import TagsPanel from '@/components/lab/TagsPanel';
import TracksPanel from '@/components/lab/TracksPanel';
import LabEventLog from '@/components/lab/LabEventLog';
import SelfTestPanel from '@/components/lab/SelfTestPanel';
import LabHelpPanel from '@/components/lab/LabHelpPanel';
import SkillBar from '@/components/lab/SkillBar';
import LabSection from '@/components/lab/LabSection';
import CommandTracePanel from '@/components/lab/CommandTracePanel';
import UtilityChainPanel from '@/components/lab/UtilityChainPanel';

export default function AbilityLab() {
  const stateRef = useRef(createLabState());
  const configRef = useRef({ bufferWindow: 0.5, bufferSize: 3 });
  const [config, setConfig] = useState(configRef.current);
  const [, setFrame] = useState(0);
  const [sceneKey, setSceneKey] = useState(0);
  // 姿态机 = 库中资产，唯一真相：载入前不运行沙盒，缺资产显式报错（无内置兜底）
  const [machineStatus, setMachineStatus] = useState('loading');

  const updateConfig = (patch) => {
    configRef.current = { ...configRef.current, ...patch };
    setConfig(configRef.current);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        cycleControl(stateRef.current);
        return;
      }
      // 设备层：物理键 → InputTag（用 e.code 免疫 Shift 变形与 IME）
      const key = e.code?.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
      const tag = KEYBOARD_MAP[key];
      if (!tag || e.repeat) return;
      if (e.altKey) {
        // Alt+技能键：运行时绑定悬停/选中敌人为该技能候选目标
        e.preventDefault();
        const ab = ACTION_BINDINGS[tag]?.ability;
        if (ab) bindSkillTarget(stateRef.current, ab);
        return;
      }
      pressInput(stateRef.current, tag, configRef.current, e.shiftKey);
    };
    const onKeyUp = (e) => {
      const key = e.code?.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key.toLowerCase();
      const tag = KEYBOARD_MAP[key];
      if (tag) releaseInput(stateRef.current, tag);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // 上下文路由表：唯一真相 = RouteTable 实体（缺记录时以默认模板落库一次，之后只读库；引擎无内置兜底）
  useEffect(() => {
    (async () => {
      let r = (await base44.entities.RouteTable.filter({ input_tag: 'Input.Smart' }).catch(() => []))[0];
      if (!r?.rules?.length) {
        r = await base44.entities.RouteTable.create({ input_tag: 'Input.Smart', rules: CONTEXT_ROUTES['Input.Smart'] }).catch(() => null);
      }
      if (r?.rules?.length) stateRef.current.routes = { 'Input.Smart': r.rules };
    })();
  }, []);

  // 姿态机：只认库中资产（唯一真相）—— 载入成功才放行沙盒，找不到就报错，绝不退回内置默认
  useEffect(() => {
    base44.entities.StateMachine.list().then((rs) => {
      const m = findStanceMachineRow(rs)?.data;
      if (m?.states) {
        stateRef.current.stanceMachine = m;
        for (const un of stateRef.current.units) if (!m.states[un.stance]) un.stance = m.initial in m.states ? m.initial : Object.keys(m.states)[0];
        setMachineStatus('ready');
      } else {
        setMachineStatus('missing');
      }
    });
  }, []);

  // 选目标器命名资产：Utility 资产库 selectors 区 → 引擎 {ref} 引用解析表
  const [selectorAssets, setSelectorAssets] = useState({});
  useEffect(() => {
    loadUtilityAssets(base44).then(({ assets }) => {
      const idx = selectorAssetIndex(assets);
      stateRef.current.selectorAssets = idx;
      setSelectorAssets(idx);
    }).catch(() => {});
  }, []);

  // 指令模板库：内置（引擎通用 + 技能指令参考实现）+ GraphDef 实体同名覆盖。
  // 指令总线挂到实验室状态上（一个受控单位一条总线），trace 常开 —— 一切动作可追溯到图节点。
  useEffect(() => {
    // base44 object 字段可能返回 JSON 字符串（与 GraphLab.parseData 同一兼容）
    const parseData = (d) => {
      if (!d) return null;
      if (typeof d === 'string') { try { return JSON.parse(d); } catch { return null; } }
      return d;
    };
    const builtins = [...BUILTIN_TEMPLATES, ...buildAbilityTemplates()];
    const attach = (rows) => {
      const entities = (rows || []).map((r) => ({ id: r.id, name: r.name, data: parseData(r.data) })).filter((r) => r.data?.nodes);
      stateRef.current.tplLib = createTemplateLibrary(entities, builtins);
      const bus = createCommandBus(stateRef.current.tplLib);
      bus.traceEnabled = true;
      stateRef.current.cmdBus = bus;
    };
    (async () => {
      try {
        let rows = (await base44.entities.GraphDef.list().catch(() => [])) || [];
        // 姿态行为图资产化（幂等 seed）：内置默认机 + 库中姿态机的全部叶状态 → GraphDef
        // 实体（stance.behavior.<叶路径>）；引擎 stanceBehaviorOf 按命名约定实执行真图，
        // GraphLab / FSM 编辑器可打开编辑 —— 行为真相源 = 图，不再是代码里的生成函数。
        const sm = await base44.entities.StateMachine.list().catch(() => []);
        const m = findStanceMachineRow(sm)?.data;
        if (m?.states) rows = await ensureStanceBehaviorDefs(base44, m, rows);
        // 转移条件蓝图资产化（幂等 seed）：cond.stance.* 条件图 → GraphDef 实体，
        // 引擎按蓝图转移数据逐 tick 求值 —— 条件语义可在 GraphLab 打开编辑
        rows = await ensureStanceConditionDefs(base44, rows);
        attach(rows);
      } catch { attach([]); }
    })();
  }, []);

  // 指令总线 tick 驱动（独立于引擎热路径；仅在有运行中的图时工作）
  useEffect(() => {
    const id = setInterval(() => {
      const st = stateRef.current;
      if (st.cmdBus?.run) {
        st.cmdBus.tick(labGraphCtx(st, getControlled(st), st.cmdBus), 0.05);
        setFrame((f) => f + 1);
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  const s = stateRef.current;
  const u = getControlled(s);
  const autoTargets = u?.alive
    ? Object.fromEntries(
        Object.entries(ABILITY_DEFS)
          .filter(([id, d]) => id !== 'atk' && d.cast?.targeted && d.acquire)
          .map(([id]) => [id, getAutoTarget(s, u, s.prefs[id] || {})?.id || null])
      )
    : {};
  const utilScores = u?.alive
    ? Object.fromEntries(
        Object.entries(ABILITY_DEFS)
          .filter(([id, d]) => id !== 'atk' && d.cast?.targeted && d.acquire)
          .map(([id]) => [id, getAutoScores(s, u, s.prefs[id] || {})])
      )
    : {};

  if (machineStatus !== 'ready') {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        {machineStatus === 'loading' ? (
          <div className="text-sm text-slate-500">正在载入姿态机资产…</div>
        ) : (
          <div className="max-w-md text-center space-y-2">
            <div className="text-sm font-semibold text-red-500">未找到姿态机资产</div>
            <div className="text-xs text-slate-500 leading-relaxed">
              姿态机配置是唯一真相，实验室不使用任何内置兜底。请在 FSM 编辑器创建姿态机（标记 flavor=stance 或命名 StanceMachine）后再进入。
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* 3D scene */}
      <div className="flex-1 relative min-w-0">
        <LabScene key={sceneKey} stateRef={stateRef} configRef={configRef} onFrame={() => setFrame((f) => f + 1)} />
        <UnitSwitcher units={s.units} controlledId={s.controller.controlledId} onSwitch={(id) => switchControl(stateRef.current, id)} />
        <LabHelpPanel />
        <SkillBar
          state={s}
          unit={u}
          onPress={(tag, shift) => pressInput(stateRef.current, tag, configRef.current, shift)}
          onRelease={(tag) => releaseInput(stateRef.current, tag)}
        />
      </div>

      {/* Right panel */}
      <div className="w-80 shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3">
          <div>
            <h1 className="text-sm font-bold text-slate-900">指令实验室 · L1 执行沙盒</h1>
            <p className="text-[10px] tracking-wide text-amber-400/80">Utility→Command→GraphVM→命中 全链路</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { const { routes, stanceMachine, selectorAssets: sa, tplLib, cmdBus } = stateRef.current; stateRef.current = createLabState(); stateRef.current.routes = routes; stateRef.current.selectorAssets = sa || {}; if (tplLib) stateRef.current.tplLib = tplLib; if (cmdBus) stateRef.current.cmdBus = cmdBus; if (stanceMachine) { stateRef.current.stanceMachine = stanceMachine; for (const un of stateRef.current.units) if (!stanceMachine.states[un.stance]) un.stance = stanceMachine.initial; } setSceneKey((k) => k + 1); }}>
            <RotateCcw className="w-3.5 h-3.5" /> 重置
          </Button>
        </div>

        <div className="p-3 space-y-2">
          <LabSection title="施法 · 状态">
            <CastBar active={u?.ability} />
            <TracksPanel unit={u} />
            <TagsPanel tags={u ? effectiveTags(u, s.time) : []} />
          </LabSection>

          <LabSection title="姿态 · AI 黑板">
            <StancePanel unit={u} machine={s.stanceMachine} onSet={(k) => setStance(stateRef.current, u.id, k)} />
            <BlackboardPanel unit={u} autoTargets={autoTargets} time={s.time} />
            <UtilityScorePanel scores={utilScores} />
          </LabSection>

          <LabSection title="指令管线">
            <CommandQueuePanel queue={u?.queue || []} casting={!!u?.ability} />
            <BufferPanel buffer={u?.buffer || []} time={s.time} config={config} />
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-500">缓冲有效窗口</span>
                  <span className="font-mono text-slate-700">{config.bufferWindow.toFixed(2)}s</span>
                </div>
                <Slider value={[config.bufferWindow]} min={0.1} max={2} step={0.05} onValueChange={([v]) => updateConfig({ bufferWindow: v })} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-500">缓冲槽位数</span>
                  <span className="font-mono text-slate-700">{config.bufferSize}</span>
                </div>
                <Slider value={[config.bufferSize]} min={1} max={5} step={1} onValueChange={([v]) => updateConfig({ bufferSize: v })} />
              </div>
              <div className="flex gap-4 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                <span>执行 <b className="text-slate-800">{s.stats.executed}</b></span>
                <span>缓冲 <b className="text-slate-800">{s.stats.buffered}</b></span>
                <span>丢弃 <b className="text-red-500">{s.stats.dropped}</b></span>
              </div>
            </div>
          </LabSection>

          <LabSection title="全链路 · Utility→指令→图→命中">
            <UtilityChainPanel state={s} unit={u} autoTargets={autoTargets} />
          </LabSection>

          <LabSection title="指令 · 实现图（GraphVM trace）">
            <CommandTracePanel state={s} unit={u} />
          </LabSection>

          <LabSection title="施法偏好" defaultOpen={false}>
            <CastPrefsPanel prefs={s.prefs} assets={selectorAssets} onChange={(id, key, v) => { stateRef.current.prefs[id][key] = v; }} />
          </LabSection>

          <LabSection title="自检 · 事件流" defaultOpen={false}>
            <SelfTestPanel />
            <LabEventLog events={s.events} />
          </LabSection>
        </div>
      </div>
    </div>
  );
}