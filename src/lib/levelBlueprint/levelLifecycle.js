export const LEVEL_LIFECYCLE_EVENTS = [
  { value: 'Level.Initializing', label: 'Initializing · 开始初始化' },
  { value: 'Level.Ready', label: 'Ready · 初始化完成' },
  { value: 'Level.Started', label: 'Started · 正式开始' },
  { value: 'Level.Paused', label: 'Paused · 已暂停' },
  { value: 'Level.Resumed', label: 'Resumed · 已恢复' },
  { value: 'Level.EndRequested', label: 'EndRequested · 请求结束' },
  { value: 'Level.Ended', label: 'Ended · 结算完成' },
  { value: 'Level.Unloading', label: 'Unloading · 开始卸载' },
  { value: 'Level.Unloaded', label: 'Unloaded · 卸载完成' },
];

export const levelBuiltinEventNodeType = (eventId) =>
  `level_builtin_event_${eventId.slice('Level.'.length).replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()}`;

export const LEVEL_EVENT = Object.fromEntries(
  LEVEL_LIFECYCLE_EVENTS.map(({ value }) => [value.slice('Level.'.length), value])
);