import React from 'react';
import { Section, ConfigTable } from '@/components/docs/DocBlocks';

// 选目标 + 右键路由：谁被选中、右键意味着什么
export default function ChapterTargeting() {
  return (
    <div>
      <Section title="自动选目标（偏好面板 · 每技能一套）">
        <ConfigTable rows={[
          ['硬过滤 requireTag', '必须带的标签', '不带此标签的候选直接出局'],
          ['硬过滤 forbidTag', '禁止带的标签', '带此标签的候选直接出局'],
          ['硬过滤 hpBelow', '血量比例（如 0.9）', '血量高于此比例的出局 —— 治疗配 1.0 = 满血的人永远不被奶'],
          ['评分 input', 'distance / hp', '拿什么打分：距离 / 血量'],
          ['评分 curve', 'linear / inverse', '越大越好 / 越小越好（inverse 距离 = 优先最近）'],
          ['评分 weight', '0~1', '多条评分加权平均，最高分者中。距离 0.2 + 血量 0.8 = 斩杀优先'],
        ]} />
      </Section>
      <Section title="玩家指定目标的优先级（不可配，恒定）">
        <ConfigTable rows={[
          ['悬停', '鼠标悬停在单位上按键', '最优先：就打你指的这个'],
          ['选中', '左键选中某单位', '其次：对选中者施放'],
          ['自动', '什么都不指', '兜底：走上面的自动选目标'],
        ]} />
      </Section>
      <Section title="右键路由表（路由表页 · 从上到下首条命中）">
        <ConfigTable rows={[
          ['when.target', 'enemy / ally / ground', '右键点的是敌人 / 友军 / 地面时此规则才考虑'],
          ['when.selfTags', '自身标签（如 Role.Healer）', '只有带此标签的单位适用（治疗者的右键和战士不同）'],
          ['when.targetHpBelow', '血量比例', '目标残血到这个程度才命中'],
          ['do', 'attack / move / follow / ability + 技能名', '命中后右键翻译成：攻击 / 移动 / 跟随 / 施放某技能'],
        ]} />
      </Section>
    </div>
  );
}