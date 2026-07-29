import React from 'react';
import { Section } from '@/components/docs/DocBlocks';
import { SENSORS } from '@/lib/lab/sensors';

// 设计思路：八层流水线 + 核心设计原则。一次按键从上到下穿过八层，每层只回答一个问题。
const LAYERS = [
  { n: 1, name: '输入层', q: '按了什么键？', how: '设备按键 → 抽象 InputTag（Input.Skill1）→ 动作绑定。换键位/手柄只改映射，下游无感知', cfg: 'INPUT_MAP' },
  { n: 2, name: '路由 · 确认层', q: '这次输入是什么意思？', how: '右键查上下文路由表（点敌=攻击、点残血友军=治疗）；技能按 castMode 决定立即施放还是进待确认（指示器/点击确认）', cfg: '路由表 · castMode' },
  { n: 3, name: '队列层', q: '现在做还是排队做？', how: '每单位一条指令队列：Shift 排队尾、interleave 插队首、按住 Z 冻结成计划、巡逻是永不完成的持续指令。停止=清队列', cfg: 'queueMode · Shift · Z' },
  { n: 4, name: '门禁 · 缓冲层', q: '现在允许做吗？', how: '技能声明 blockedBy 标签门（冷却=限时标签）。被挡下的请求进输入缓冲，解锁瞬间自动补放，过窗作废 —— 手感的来源', cfg: 'blockedBy · 缓冲窗口/槽数' },
  { n: 5, name: '执行层（轨道）', q: '身体忙得过来吗？', how: '单位身体拆成轨道（legs/arms），指令声明占用哪些轨道：异轨并行（边走边打）、同轨按打断策略仲裁（drop/restart/resume）。眩晕=冻结全部轨道', cfg: 'tracks · onInterrupt · interrupt' },
  { n: 6, name: '效果层', q: '命中后发生什么？', how: '技能过程是阶段+时间线，指定时刻触发效果原语（swing/projectile/pulse/damage/heal/applyTag）。效果只认注册表，伤害/治疗/控制全部同构', cfg: 'stages · timeline · effects' },
  { n: 7, name: '传感器 · 黑板层', q: '单位知道什么？', how: '传感器只写黑板键（视野→bb.perceived、记忆→bb.memory、受击→bb.lastHit、指挥→bb.control），一切决策条件只读黑板键 —— 不开天眼，追丢会去最后目击点', cfg: '视野半径 · 记忆 TTL · 还击窗口' },
  { n: 8, name: '姿态 · 仲裁层', q: '没有指令时自己做什么？', how: '空闲时姿态接管：有序 autocast 候选自上而下仲裁，首个命中者产生意图，走回同一条队列/门禁/执行管线 —— AI 和玩家用同一套管道', cfg: 'autocast · chase · leash · transitions' },
];

const PRINCIPLES = [
  ['标签是通用货币', '冷却、眩晕、职业、死亡全是标签。门禁查标签、打断查标签、路由查标签 —— 系统间零耦合，靠同一种数据对话。'],
  ['引擎与内容分离', '引擎只有通用原语（五种姿态、效果注册表、通用执行机），「圣骑士」这类职业是纯数据配置注入，删光内容引擎照常自检通过。'],
  ['四轴正交拼角色', '一个角色 = 技能包 × 仲裁链 × 移动性格(chase/leash) × 事件转移，四轴独立可换 —— 组合爆炸变成配置组合。'],
  ['单一管道', '玩家按键、右键路由、姿态 autocast 产生的意图殊途同归：全部进同一条队列 → 门禁 → 轨道 → 效果管线，行为一致、只需调一处。'],
  ['一切皆数据', '技能、姿态、路由、选目标器都是可存库的数据；编辑器改数据即改行为，引擎代码零改动。'],
];

export default function ChapterArchitecture() {
  return (
    <div>
      <Section title="八层流水线（一次按键的完整旅程）">
        <div className="space-y-1.5">
          {LAYERS.map((l) => (
            <div key={l.n} className="flex gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
              <div className="w-7 h-7 shrink-0 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{l.n}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[12px] font-bold text-slate-800">{l.name}</span>
                  <span className="text-[10px] text-amber-600 font-bold">{l.q}</span>
                  <span className="text-[9px] font-mono text-slate-400 ml-auto">{l.cfg}</span>
                </div>
                <p className="text-[11px] leading-5 text-slate-600 mt-0.5">{l.how}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2">↑ 玩家输入从 1 走到 6；单位自主行为从 7、8 产生意图后汇入 3，共用 3→6。</p>
      </Section>
      <Section title="传感器 → 黑板契约（第 7 层的词汇表）">
        <p className="text-[11px] leading-5 text-slate-600 mb-2">传感器只写黑板键、决策只读黑板键 —— 两侧靠键名对话，零直接耦合。姿态编辑器里每步流程的条件全部落在这四个键上：</p>
        <div className="space-y-1.5">
          {SENSORS.map((s) => (
            <div key={s.key} className="flex flex-wrap gap-x-3 gap-y-0.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 items-baseline">
              <span className="text-[11px] font-bold text-slate-800 w-20">{s.label}</span>
              <span className="text-[10px] font-mono text-primary">{s.writes}</span>
              <span className="text-[10px] text-slate-500">{s.source}</span>
              <span className="text-[9px] text-slate-400 ml-auto">{s.decay}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="核心设计原则">
        <div className="space-y-2">
          {PRINCIPLES.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
              <div className="text-[11px] font-bold text-slate-800 mb-0.5">{t}</div>
              <p className="text-[11px] leading-5 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}