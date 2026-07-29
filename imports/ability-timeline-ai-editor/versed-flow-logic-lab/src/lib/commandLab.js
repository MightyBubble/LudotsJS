// Command Lab —— 对外门面（façade），保持原有 import 路径兼容。
// 模块划分（DDD 限界上下文）：
//   lab/abilityDefs.js — 技能纯数据（加技能零代码）
//   lab/effects.js     — Effect 处理器注册表（命中结算，registerEffect 可扩展）
//   lab/events.js      — 领域事件总线 + 日志/fx/统计适配器
//   lab/engine.js      — 世界状态、Controller、指令队列、施法激活、tick
export * from '@/lib/lab/abilityDefs';
export * from '@/lib/lab/engine';
export { registerEffect, EFFECT_HANDLERS, executeEffect } from '@/lib/lab/effects';
export * from '@/lib/lab/tags';
export * from '@/lib/lab/stances';