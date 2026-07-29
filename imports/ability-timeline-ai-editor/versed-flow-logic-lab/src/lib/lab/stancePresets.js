// 姿态机预设 —— 仅作显式创建动作的种子模板（FSM 编辑器「创建默认姿态机」按钮、
// 确定性自检夹具）。引擎运行时只认库中 StateMachine 资产（stanceMachineOf 无兜底），
// 本文件不被任何运行时路径引用。
export const STANCE_MACHINE_PRESET = {
  flavor: 'stance',
  initial: 'HoldFire',
  states: {
    HoldFire: { label: '保持静默', color: '#94a3b8', x: 90, y: 90, autocast: [], transitions: [] },
    HoldPosition: { label: '原地防守', color: '#0ea5e9', x: 350, y: 90, chase: false, autocast: [{ ability: 'atk', trigger: 'seen' }], transitions: [] },
    ReturnFire: { label: '还击', color: '#f59e0b', x: 610, y: 90, chase: true, autocast: [{ ability: 'atk', trigger: 'damaged' }], transitions: [] },
    Guard: { label: '警戒', color: '#8b5cf6', x: 220, y: 250, chase: true, leash: 4, autocast: [{ ability: 'atk', trigger: 'seen' }], transitions: [] },
    AttackAnything: { label: '侵略追击', color: '#ef4444', x: 480, y: 250, chase: true, autocast: [{ ability: 'atk', trigger: 'seen' }], transitions: [] },
  },
};

// 层级复合职业示例（编辑器「插入 Paladin 层级示例」按钮）：复合态声明战斗性格
// （chase/leash）+ 初始子状态，叶状态继承性格并声明候选集。
export const PALADIN_EXAMPLE = {
  label: '圣骑士', color: '#14b8a6', chase: true, leash: 6, x: 740, y: 250,
  initial: 'Field',
  states: {
    Field: {
      label: '战场裁决', x: 90, y: 90,
      autocast: [
        { ability: 'heal', trigger: 'seen' },
        { ability: 'ranged', trigger: 'seen' },
        { ability: 'atk', trigger: 'damaged' },
      ],
      transitions: [],
    },
  },
  transitions: [],
};