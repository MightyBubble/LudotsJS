import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';

// 操作说明 —— 可折叠悬浮面板（默认收起，不遮挡战场）
export default function LabHelpPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md border border-amber-400/40 bg-black/75 backdrop-blur px-3 py-1.5 text-[11px] font-medium text-amber-400 hover:bg-black/90 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" /> 操作说明
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-3 z-10 w-[460px] max-h-[72vh] overflow-y-auto rounded-lg border border-amber-400/30 bg-black/85 backdrop-blur">
      <div className="sticky top-0 flex items-center justify-between border-b border-amber-400/20 bg-black/90 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400"><BookOpen className="w-3.5 h-3.5" /> 操作说明</span>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-amber-400"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="px-3 py-2.5 text-[11px] text-slate-500 space-y-0.5">
        <div><b className="text-slate-700">点击地面</b> 移动（替换队列）· <b className="text-slate-700">Shift+点击</b> 预约排队</div>
        <div><b className="text-slate-700">点击友方</b> 切换控制 · <b className="text-slate-700">Tab</b> 循环所有单位（含敌方阵营）</div>
        <div><b className="text-slate-700">点击敌人</b> 选中候选目标 · <b className="text-slate-700">双击</b> 攻击指令</div>
        <div><b className="text-slate-700">右键</b> 智能指令（上下文路由）：敌=攻击 · 地面=移动 · 残血友军+治疗者=治疗 · 友军=跟随</div>
        <div><b className="text-slate-700">确认方式</b> 即时/抬起/点击确认 —— 参数在 commit 边沿定格 · <b className="text-slate-700">Esc/右键</b> 取消确认态</div>
        <div><b className="text-slate-700">统一视野</b> 半径7（灰圈）：感知敌人写入黑板，一切候选必然来自黑板</div>
        <div><b className="text-slate-700">三种距离</b> 施放距离（白/蓝圈）≠ 候选纳入范围（技能色圈）≠ 效果范围</div>
        <div><b className="text-slate-700">自动取目标</b> 开=按键无目标时从黑板按候选范围+优先级取（连线+色环）</div>
        <div><b className="text-slate-700">选目标 graph</b> 硬过滤（tag/血量门）+ utility 曲线（输入×公式×权重）加权取最高分 —— 偏好面板可调</div>
        <div><b className="text-slate-700">S</b> 停止：清空队列/缓冲并取消当前施法 · <b className="text-slate-700">冷却</b>=限时标签复用 blockedBy 门禁</div>
        <div><b className="text-slate-700">打断策略</b> 施法中下达移动 → 按技能声明：不可打断/丢弃/重来/续跑（进度快照重入队）</div>
        <div><b className="text-slate-700">分轨并行</b> 移动占 legs、射击类占 arms：异轨并行（边走边打，W/D/F/T 移动中可放）；近战/连击/引导是全身技能，同轨互斥照旧打断</div>
        <div><b className="text-slate-700">受迫打断</b> 眩晕只打标签（<b className="text-slate-700">T</b> 眩晕镖）：引擎检查执行中技能的 interrupt.by → 按策略丢弃/重来/续跑，眩晕期间整体冻结</div>
        <div><b className="text-slate-700">姿态 FSM</b> 静默/原地防守/还击/警戒(缰绳归位)/侵略追击/圣骑士 —— 候选筛选 + 追击/缰绳声明，图在「姿态编辑器」页</div>
        <div><b className="text-slate-700">A 键</b> A-move 攻击移动：点击地面下达，途中自动接战，清场后继续行进</div>
        <div><b className="text-slate-700">P 键</b> 巡逻：点击设路线（Shift+点击追加路点），点间循环 + 沿途接战 · <b className="text-slate-700">按住 Z</b> 计划模式：指令只入队，松开按序执行（interleave 技能插队首）</div>
        <div><b className="text-slate-700">目标失联</b> 追至最后目击点（记忆快照）仍不见 → 失效重取 / 降级点施 / 丢弃</div>
        <div><b className="text-slate-700">悬停施法</b> 悬停敌人纳入候选、鼠标附近优先级更高（鼠标只是controller参数）</div>
        <div><b className="text-slate-700">追踪吸附</b> 效果层补正：无对象参数时吸附悬停对象；首效果必须作用于对象且无候选=放不出来</div>
        <div><b className="text-slate-700">目标模式</b> 单位=取候选对象（取不到可降级为点） · 地点=鼠标地面点 · 方向=鼠标方向</div>
        <div><b className="text-slate-700">Alt+技能键</b> 将悬停/选中敌人绑定为所控单位该技能的候选目标</div>
        <div><b className="text-slate-700">E 按住引导</b> 松开提前结束（可在偏好关闭）</div>
        <div><b className="text-slate-700">Q</b> 近战 · <b className="text-slate-700">W</b> 远程弹道 · <b className="text-slate-700">E</b> 引导脉冲 · <b className="text-slate-700">R</b> 三连击 · <b className="text-slate-700">D</b> 按住连射 · <b className="text-slate-700">F</b> 持续激光 · <b className="text-slate-700">T</b> 眩晕镖</div>
        <div><b className="text-slate-700">引导三型</b> 扫射=固定周期参数冻结 · 连射=每轮重新决议松开打完本轮 · 激光=逐tick实时追踪松开立断</div>
        <div><b className="text-slate-700">跟随鼠标</b> 连射/激光默认开：引导中逐帧朝鼠标，激光变扫射光线（偏好可关回锁定目标）</div>
        <div><b className="text-slate-700">Shift+技能键</b> 将技能纳入指令队列</div>
        <div className="text-amber-600">连击窗口内再按 R 续下一段</div>
      </div>
    </div>
  );
}