export const inputConfigGuides = {
  InputConfig: {
    title: 'Input Config 输入配置',
    description: '定义项目可识别的输入动作、输入上下文和设备绑定，是整个输入与订单流程的起点。',
    points: ['Action 描述按钮、单轴或多轴输入。', 'Context 决定一组绑定何时生效及其优先级。', 'Binding 将键盘、鼠标或手柄路径映射到 Action，并可附加处理器与交互规则。'],
    example: { config_id:'Input.Config.Gameplay', name:'战斗输入', actions:[{id:'Move',name:'移动',type:'Axis2D'}], contexts:[{id:'Gameplay',name:'战斗',priority:10,bindings:[{actionId:'Move',path:'<Gamepad>/leftStick'}]}] }
  },
  ControlScheme: {
    title: 'Control Schemes 控制方案',
    description: '组合当前玩法需要启用的输入上下文，并指定默认的指令意图、施法分发策略和轴向移动行为。',
    points: ['Input Context IDs 决定方案启用哪些输入上下文。', 'Defaults 为指针指令和施法流程指定默认配置。', 'Axis Move 将连续方向输入转换为移动订单，并控制提交频率与步进距离。'],
    example: { scheme_id:'ControlScheme.Player', inputContexts:['Gameplay','Camera'], defaults:{commandIntentId:'Intent.Default',castDispatchProfileId:'Dispatch.Selected'}, axisMove:{actionId:'Move',orderTypeKey:'Move.To',throttleTicks:2,stepDistanceCm:120} }
  },
  CommandIntentProfile: {
    title: 'Command Intent 指令意图',
    description: '根据操作者状态与点击目标的特征，判断一次指针操作最终应该产生哪一种游戏指令。',
    points: ['规则按 Priority 从高到低匹配。', 'Actor Predicate 检查操作者的能力与标签。', 'Target Predicate 检查目标类型、关系和标签，Route 给出订单类型与能力槽位。'],
    example: { profile_id:'Intent.Default', groupPolicy:{kind:'independent'}, rules:[{priority:100,actor:{allTags:['Unit.Controllable']},target:{stance:['Enemy'],hasEntity:true},route:{orderTypeKey:'Combat.Attack',slot:''}}] }
  },
  InputOrderConfig: {
    title: 'Input Order Mapping 输入订单映射',
    description: '把输入动作转换为可执行订单，并配置目标来源、队列行为、长按策略和自动选目标规则。',
    points: ['Interaction Mode 决定按键、瞄准与确认的交互方式。', 'Mappings 为每个 Action 指定触发时机、订单类型和参数模板。', 'Group Move Target Layout 控制多单位移动的落点排列。'],
    example: { config_id:'InputOrder.Gameplay', interactionMode:'SmartCast', mappings:[{actionId:'Skill1',trigger:'PressedThisFrame',orderTypeKey:'Ability.Cast',argsTemplate:{i0:0},requireTarget:true,targetType:'HoveredEntityOrPosition',modifierBehavior:'QueueOnModifier',heldPolicy:'EveryFrame',autoTargetPolicy:'NearestEnemyInRange',autoTargetRangeCm:800}], groupMoveTargetLayout:{mode:'Grid',spacingCm:120,orderTypeKeys:['Move.To']}, userOverrides:{enabled:true,persistPath:'user://input_preferences.json'} }
  },
  CastCommitProfile: {
    title: 'Cast Commit 施法提交',
    description: '定义施法确认后要执行的操作序列，以及临时交互状态中各输入动作对应的处理方式。',
    points: ['On Activate 在进入该提交流程时依次执行。', 'submitOrder 提交已准备好的订单。', 'pushFrame 与 popFrame 用于进入或退出瞄准、选点等临时交互状态。'],
    example: { profile_id:'CastCommit.Aim', onActivate:[{op:'pushFrame',payload:{cursor:'cursorWorld'},contextProfileId:'Aim.Skillshot'}], frameActions:{Confirm:[{op:'submitOrder',payload:{target:'cursorWorld'},contextProfileId:''}],Cancel:[{op:'popFrame',payload:{},contextProfileId:''}]} }
  },
  CastDispatchProfile: {
    title: 'Cast Dispatch 施法分发',
    description: '当多个可操作者都能响应一次施法输入时，决定选择谁、如何评分以及以何种顺序分发订单。',
    points: ['Selector 决定选择全部、前 N 名或循环选择。', 'Scorer 通过 Considerations 对候选操作者评分。', 'Router 决定并行或顺序分发，以及是否共享订单标识。'],
    example: { profile_id:'Dispatch.BestCaster', selector:{kind:'topN',n:1,advanceOn:''}, scorer:{kind:'utility',considerations:['distanceToTarget:inverse','resourceReady']}, router:{kind:'parallel',sharedOrderId:true} }
  }
};