export const inputEditorExamples = {
  InputConfig: {
    title: 'WASD 二维移动',
    result: 'WASD 键会合成为一个二维移动方向，并交给 Move 动作处理。',
    config: {
      config_id: 'Input.Config.Player', name: '玩家键鼠输入',
      actions: [{ id: 'Move', name: '角色移动', type: 'Axis2D' }],
      contexts: [{ id: 'Gameplay', name: '游戏中', priority: 10, bindings: [{ actionId: 'Move', compositeType: '2DVector', compositeParts: [{ actionId: 'Up', path: '<Keyboard>/w' }, { actionId: 'Down', path: '<Keyboard>/s' }, { actionId: 'Left', path: '<Keyboard>/a' }, { actionId: 'Right', path: '<Keyboard>/d' }] }] }]
    }
  },
  ControlScheme: {
    title: '即时角色移动',
    result: '启用游戏输入上下文，并把 Move 动作持续转换为移动订单。',
    config: { scheme_id: 'ControlScheme.Player', inputContexts: ['Gameplay'], defaults: { commandIntentId: 'CommandIntent.Player', castDispatchProfileId: 'CastDispatch.Player' }, axisMove: { actionId: 'Move', orderTypeKey: 'MoveTo', throttleTicks: 2, stepDistanceCm: 120 } }
  },
  CommandIntentProfile: {
    title: '右键智能移动或攻击',
    result: '点到敌人时发出攻击订单，点到地面时发出移动订单。',
    config: { profile_id: 'CommandIntent.Player', groupPolicy: { kind: 'independent' }, rules: [{ priority: 100, actor: { allTags: [], anyTags: [] }, target: { allTags: ['Relation.Enemy'], anyTags: [], stance: [], hasEntity: true }, route: { orderTypeKey: 'Attack', slot: '' } }, { priority: 10, actor: { allTags: [], anyTags: [] }, target: { allTags: [], anyTags: [], stance: [], hasEntity: false }, route: { orderTypeKey: 'MoveTo', slot: '' } }] }
  },
  InputOrderConfig: {
    title: '按键智能施法',
    result: '按下技能键时优先选择范围内最近的敌人，并立即提交技能订单。',
    config: { config_id: 'InputOrder.Player', interactionMode: 'SmartCast', mappings: [{ actionId: 'Skill1', trigger: 'PressedThisFrame', orderTypeKey: 'CastAbility', argsTemplate: { i0: 0 }, requireTarget: true, targetType: 'Entity', modifierBehavior: 'AlwaysImmediate', isSkillMapping: true, heldPolicy: 'EveryFrame', castModeOverride: 'SmartCast', autoTargetPolicy: 'NearestEnemyInRange', autoTargetRangeCm: 800 }], groupMoveTargetLayout: { mode: 'None', spacingCm: 120, orderTypeKeys: [] }, userOverrides: { enabled: true, persistPath: 'user://input_preferences.json' } }
  },
  CastCommitProfile: {
    title: '进入瞄准后确认施法',
    result: '激活时进入瞄准状态，按下确认键后提交订单并退出瞄准。',
    config: { profile_id: 'CastCommit.AimConfirm', onActivate: [{ op: 'pushFrame', contextProfileId: 'Aim.Skill' }], frameActions: { ConfirmCast: [{ op: 'submitOrder', payload: { target: 'cursorWorld' } }, { op: 'popFrame', contextProfileId: 'Aim.Skill' }] } }
  },
  CastDispatchProfile: {
    title: '选择最近的一名施法者',
    result: '按距离为候选单位评分，只选择第一名，并顺序提交施法订单。',
    config: { profile_id: 'CastDispatch.NearestOne', selector: { kind: 'topN', n: 1, advanceOn: '' }, scorer: { kind: 'utility', considerations: ['distanceToTarget:inverse'] }, router: { kind: 'sequential', sharedOrderId: true } }
  }
};