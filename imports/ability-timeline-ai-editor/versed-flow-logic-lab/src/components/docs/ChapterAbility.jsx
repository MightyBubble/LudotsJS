import React from 'react';
import { Section, ConfigTable } from '@/components/docs/DocBlocks';

// 技能配置：每个技能是一条数据（施法偏好面板运行时可调）
export default function ChapterAbility() {
  return (
    <div>
      <Section title="目标与距离">
        <ConfigTable rows={[
          ['targetMode', 'unit / point / direction', '取一个对象施放 / 对准一个地点 / 对准一个方向'],
          ['targetFilter', 'enemy / ally', '候选只纳入敌人或友军 —— 治疗和攻击是同一套流程，只换这一项'],
          ['cast.range', '数字（施放距离）', '目标超出这个距离时，先自动走近再施放'],
          ['acquire.range', '数字（索敌半径）', '不点目标直接按键时，在这个半径内自动挑一个目标'],
          ['acquire.selector', '硬过滤 + 评分曲线（见「选目标」章）', '自动挑目标的规则：谁被排除、谁得分最高谁中'],
        ]} />
      </Section>
      <Section title="施放手感（按键何时生效）">
        <ConfigTable rows={[
          ['castMode', 'instant', '按下立即施放（LOL 无指示器智能施法）'],
          ['castMode', 'onRelease', '按住显示预览指示器，抬起才施放（LOL 带指示器）'],
          ['castMode', 'confirm', '按键后进入待确认，再点一次左键选中目标/地点才施放（WAR3）'],
          ['hold', '开 / 关', '按住不放持续施放，松开停止'],
        ]} />
      </Section>
      <Section title="引导类技能（持续施放期间）">
        <ConfigTable rows={[
          ['channel', 'burst', '固定节奏跳伤害，参数按下瞬间定死，中途不变'],
          ['channel', 'repeat', '一轮一轮连射，每轮重新挑目标；松开把当前这轮打完才停'],
          ['channel', 'beam', '激光逐帧结算；松开立刻中断'],
          ['rebind.direction', 'tick', '引导中光束逐帧跟着鼠标转（扫射激光）'],
          ['rebind.target', 'onInvalid', '目标死亡/丢失时自动换下一个目标继续打'],
        ]} />
      </Section>
      <Section title="多段与时间线">
        <ConfigTable rows={[
          ['stages[]', '多个阶段，各自时长', '技能分段展开（前摇 → 出手 → 后摇）'],
          ['timeline', '相对时刻 + 效果', '在阶段的指定时刻触发效果（如 0.28s 命中帧）'],
          ['comboWindow', '秒数', '本段结束后的窗口内再按同键，接续下一段（三连击）'],
        ]} />
      </Section>
      <Section title="打断 · 冷却 · 排队">
        <ConfigTable rows={[
          ['blockedBy', "标签列表（如 Cooldown.melee）", '这些标签在身时按键被挡下 → 进输入缓冲，标签消失自动补放。冷却就是一个限时标签'],
          ['onInterrupt', 'none / drop / restart / resume', '施法中来了新指令：不许打断 / 丢弃 / 之后重放 / 先执行新指令再从中断处续放（不重付冷却）'],
          ['interrupt', 'by: 标签 + policy', '身上出现指定标签（如被眩晕）时强制中断，按 policy 处理'],
          ['queueMode', 'replace / interleave', '直接按键时：清掉现有队列立即执行 / 插到队首，原计划（巡逻等）保留续跑'],
          ['tracks', "['arms'] / ['legs','arms']", '只占上半身 = 可边走边放；占全身 = 停下来施放。占用不冲突的指令并行执行'],
        ]} />
      </Section>
      <Section title="效果（命中后发生什么）">
        <ConfigTable rows={[
          ['swing', '范围 + 伤害', '近身挥击，范围内结算'],
          ['projectile', '速度 + 追踪与否', '飞行道具：追踪弹必中，直线弹可被走位躲开'],
          ['pulse / search', '半径 + 后续效果', '区域脉冲 / 在落点附近搜对象再触发后续'],
          ['damage / heal', '数值', '扣血 / 回血'],
          ['applyTag', '标签 + 持续秒数', '给目标贴限时标签（State.Stunned 即眩晕：冻结其一切行动）'],
        ]} />
      </Section>
    </div>
  );
}