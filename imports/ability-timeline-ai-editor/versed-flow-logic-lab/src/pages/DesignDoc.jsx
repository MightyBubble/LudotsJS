import React, { useState } from 'react';
import { Layers, Wand2, Shield, Crosshair, Gamepad2, ChefHat } from 'lucide-react';
import ChapterArchitecture from '@/components/docs/ChapterArchitecture';
import ChapterAbility from '@/components/docs/ChapterAbility';
import ChapterStance from '@/components/docs/ChapterStance';
import ChapterTargeting from '@/components/docs/ChapterTargeting';
import ChapterOrders from '@/components/docs/ChapterOrders';
import ChapterRecipes from '@/components/docs/ChapterRecipes';

// 配置手册：只讲「编辑器输入什么 → 得到什么游戏行为」，不讲实现理念。
const CHAPTERS = [
  { key: 'architecture', icon: Layers, title: '设计思路', desc: '八层流水线架构与核心设计原则', Comp: ChapterArchitecture },
  { key: 'ability', icon: Wand2, title: '技能配置', desc: '一个技能的每个字段，与它带来的手感', Comp: ChapterAbility },
  { key: 'stance', icon: Shield, title: '姿态配置', desc: '单位空闲时的自主性格：打谁、追多远、何时变', Comp: ChapterStance },
  { key: 'targeting', icon: Crosshair, title: '选目标与路由', desc: '自动挑目标的规则 + 右键在不同上下文的含义', Comp: ChapterTargeting },
  { key: 'orders', icon: Gamepad2, title: '玩家操控', desc: '实验室里每个输入对应的预期行为', Comp: ChapterOrders },
  { key: 'recipes', icon: ChefHat, title: '设计食谱', desc: '常见游戏设计的现成配法', Comp: ChapterRecipes },
];

export default function DesignDoc() {
  const [active, setActive] = useState('architecture');
  const ch = CHAPTERS.find((c) => c.key === active);
  return (
    <div className="h-full flex min-h-0">
      <div className="w-56 shrink-0 border-r border-slate-200 bg-white p-3 space-y-1 overflow-y-auto">
        <div className="px-2 pt-1 pb-2">
          <div className="text-sm font-bold text-slate-900">配置手册</div>
          <div className="text-[10px] text-slate-400">输入 → 预期游戏行为</div>
        </div>
        {CHAPTERS.map((c) => (
          <button key={c.key} onClick={() => setActive(c.key)}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors ${active === c.key ? 'bg-primary/15 text-primary font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
            <c.icon className="w-3.5 h-3.5 shrink-0" />
            {c.title}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <h2 className="text-lg font-bold text-slate-900">{ch.title}</h2>
          <p className="text-[11px] text-slate-400 mb-6">{ch.desc}</p>
          <ch.Comp />
        </div>
      </div>
    </div>
  );
}