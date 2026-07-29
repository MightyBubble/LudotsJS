import React from 'react';
import { Recipe } from '@/components/docs/DocBlocks';

const RECIPES = [
  { title: 'LOL 智能施法', config: [{ at: '技能', set: 'castMode = instant' }, { at: '技能', set: 'acquire.range + selector' }],
    result: '按下 Q 瞬间对半径内最优目标施放，全程不用点鼠标。' },
  { title: 'LOL 带指示器施法', config: [{ at: '技能', set: 'castMode = onRelease' }],
    result: '按住显示范围指示器、跟随鼠标预览，抬起瞬间施放。' },
  { title: 'WAR3 / 传统 RPG 点击施法', config: [{ at: '技能', set: 'castMode = confirm' }],
    result: '按技能键进入待确认，再左键点目标才施放；Esc / 右键取消。' },
  { title: '机枪连射（按住不放）', config: [{ at: '技能', set: 'channel = repeat' }, { at: '技能', set: 'hold = 开' }],
    result: '按住持续一轮轮开火，每轮重新挑目标；松开打完当前这轮才停。' },
  { title: '跟随鼠标的扫射激光', config: [{ at: '技能', set: 'channel = beam' }, { at: '技能', set: 'rebind.direction = tick' }],
    result: '按住发射激光并逐帧跟着鼠标转，扫到谁伤谁；松开立断。' },
  { title: '三段连击', config: [{ at: '技能', set: 'stages ×3' }, { at: '技能', set: 'comboWindow = 0.5' }],
    result: '连按三下打出一二三段；窗口内没接上就收招重来。' },
  { title: '眩晕控制技', config: [{ at: '技能效果', set: 'applyTag State.Stunned 2s' }, { at: '对方技能', set: 'interrupt.by 含 State.Stunned' }],
    result: '命中即打断对方施法并定身 2 秒：不能动、不能放、指令冻结，醒来自动继续。' },
  { title: '智能右键治疗（暗黑/魔兽护士流）', config: [{ at: '路由表', set: 'ally + hpBelow 1.0 → heal' }, { at: '单位', set: '标签 Role.Healer' }],
    result: '治疗者右键残血队友 = 自动治疗，右键敌人照常攻击；满血队友右键 = 跟随。' },
  { title: '岗哨守卫（塔防/据点）', config: [{ at: '姿态', set: '警戒：普攻·视野接战 + 缰绳 4' }],
    result: '站桩看家，敌人靠近就打、追出 4 格自动回岗，回岗路上不被勾引。' },
  { title: '圣骑士（复合职业）', config: [{ at: '姿态', set: '新建：治疗(视野) → 远程(视野) → 普攻(受击)' }, { at: '姿态', set: '缰绳 6' }],
    result: '空闲时自动照顾队伍：有残血先奶，没人要奶就远程输出，被贴脸才近战还手，不追出阵地。' },
  { title: '狂战士（受击变身）', config: [{ at: '姿态', set: '静默态 + 转移 damaged → 激怒' }, { at: '姿态', set: '激怒态：普攻·视野接战·无缰绳' }],
    result: '平时人畜无害，挨第一下后性情大变，见谁咬谁无限追击。' },
  { title: '边走边打的行军', config: [{ at: '技能', set: "tracks = ['arms']" }, { at: '姿态', set: '侵略追击' }],
    result: '下达移动后途经敌人不停步，上半身自动开火，走到目的地为止。' },
  { title: 'SC2 A-move 推进', config: [{ at: '操作', set: 'A + 点地' }],
    result: '部队朝目标点推进，沿途见敌自动接战，清完继续走。' },
  { title: '战术计划（先布置后执行）', config: [{ at: '操作', set: '按住 Z 连下多条指令' }],
    result: '按住期间单位纹丝不动、指令全部入队；松开一口气按序执行整套战术。' },
];

export default function ChapterRecipes() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {RECIPES.map((r) => <Recipe key={r.title} {...r} />)}
    </div>
  );
}