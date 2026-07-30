const f = (name, behavior, result) => ({ name, behavior, result });
const r = (title, setup, result) => ({ title, setup, result });

export const inputConfigFieldGuides = {
  InputConfig: {
    fields: [
      f('config_id','配置资产的唯一键；其他配置通过它引用整套输入定义。','稳定引用并区分不同玩法或设备方案。'),
      f('name','编辑器中展示的名称，不参与输入判断。','让策划快速识别配置用途。'),
      f('actions[].id','动作的稳定标识，Binding 使用该值建立关联。','把多个设备输入汇聚为同一个游戏动作。'),
      f('actions[].name','动作的可读名称，可与 id 不同。','提升调试和配置可读性。'),
      f('actions[].type','Button 表示开关量；Axis1D/2D/3D 表示对应维度的连续值。','决定输入值的数据形态，例如按键、摇杆或空间输入。'),
      f('contexts[].id','输入上下文标识，Control Scheme 通过它启用上下文。','按玩法状态切换整组输入。'),
      f('contexts[].name','上下文显示名称。','方便区分战斗、菜单、载具等场景。'),
      f('contexts[].priority','多个上下文同时启用时，数值更高者优先处理冲突。','实现菜单覆盖战斗输入等优先级规则。'),
      f('bindings[].actionId','指定该设备路径驱动哪个 Action。','建立设备输入到逻辑动作的映射。'),
      f('bindings[].path','设备控件路径，例如键盘按键、鼠标按钮或手柄摇杆。','决定用户实际操作哪个控件。'),
      f('bindings[].compositeType / compositeParts','把多个控件组合成一个轴向动作，各 Part 指定分量来源。','用 WASD 组合出二维移动等复合输入。'),
      f('bindings[].processors','按顺序修正输入值，parameters 提供死区、缩放等参数。','获得更平滑或更灵敏的轴输入。'),
      f('bindings[].interactions','定义按下、长按、连击等判定方式及参数。','让同一按键支持长按或双击行为。')
    ],
    recipes: [
      r('WASD 二维移动','创建 Axis2D Action；Binding 使用二维 Composite，并把 W/S/A/D 配到四个 Part。','持续输出标准化移动方向，供 Axis Move 生成移动订单。'),
      r('战斗与菜单输入隔离','创建 Gameplay 与 Menu 两个 Context，并让 Menu 拥有更高 Priority。','菜单打开时快捷键优先作用于菜单，关闭后恢复战斗操作。')
    ]
  },
  ControlScheme: {
    fields: [
      f('scheme_id','控制方案唯一键。','允许项目维护玩家、观战、载具等多套方案。'),
      f('inputContexts','列出启用的 Input Context ID，顺序不替代 Context 自身优先级。','确定这套方案可接收哪些动作。'),
      f('defaults.commandIntentId','指针点击没有额外覆盖时采用的指令意图配置。','让同一次点击根据目标自动变成移动、攻击或交互。'),
      f('defaults.castDispatchProfileId','没有技能专属覆盖时采用的施法分发配置。','决定多名候选操作者中由谁响应技能输入。'),
      f('axisMove.actionId','监听的连续轴 Action。','把摇杆或方向键输入接入移动订单。'),
      f('axisMove.orderTypeKey','轴向输入生成的订单类型。','决定连续输入触发移动、驾驶或镜头等哪类行为。'),
      f('axisMove.throttleTicks','两次轴向订单之间至少间隔的 Tick；0 表示每 Tick 可提交。','降低订单频率，平衡响应速度与处理成本。'),
      f('axisMove.stepDistanceCm','每次轴向订单向前投射的世界距离。','控制角色跟随方向输入时的目标步长。')
    ],
    recipes: [
      r('即时角色移动','启用 Gameplay Context；Axis Move 绑定 Move、Move.To，Throttle 设 0–2，步长设 100–150cm。','摇杆变化会持续生成近距离移动目标，操作紧跟输入。'),
      r('点击式战术控制','不配置 Axis Move，只设置默认 Command Intent 与 Cast Dispatch。','输入主要通过点击目标和技能快捷键生成离散订单。')
    ]
  },
  CommandIntentProfile: {
    fields: [
      f('profile_id','指令意图配置唯一键。','可为不同阵营、模式或操控方案切换点击语义。'),
      f('groupPolicy.kind','定义多单位收到同一次指针意图时如何解释；independent 表示每个单位独立匹配规则。','选中混合单位时，各单位可产生不同订单。'),
      f('rules[].priority','规则匹配顺序，数值越高越先判断；应避免相同优先级造成歧义。','确保攻击等特例先于默认移动。'),
      f('actor.hasAbilityWithTag','仅当操作者拥有带指定标签的能力时匹配。','按单位能力自动选择可执行的交互。'),
      f('actor.allTags','操作者必须拥有全部标签。','精确限定职业、状态或控制权限。'),
      f('actor.anyTags','操作者拥有任一标签即可。','允许多种单位共享同一规则。'),
      f('target.allTags','目标必须拥有全部标签。','只对满足完整条件的目标生成该指令。'),
      f('target.anyTags','目标拥有任一标签即可。','覆盖一组可交互目标类别。'),
      f('target.stance','限定与目标的关系，例如 Enemy、Ally 或 Neutral。','同一点击可按敌我关系分流。'),
      f('target.hasEntity','true 只匹配实体；false 只匹配地面；未设置则两者都匹配。','区分攻击目标与地面移动。'),
      f('route.orderTypeKey','规则命中后生成的订单类型。','决定最终执行攻击、移动、交互等行为。'),
      f('route.slot','可选能力槽选择表达式，如按能力标签或上下文组选择。','把抽象意图路由到具体技能槽。')
    ],
    recipes: [
      r('右键智能移动/攻击','高优先级规则匹配 Enemy + hasEntity=true 并路由 Combat.Attack；低优先级规则匹配地面并路由 Move.To。','右键敌人自动攻击，右键地面自动移动。'),
      r('工人与资源交互','Actor 要求 Worker 标签，Target 要求 Resource 标签，Route 指向 Gather。','只有工人点击资源时生成采集指令，其他单位继续匹配后续规则。')
    ]
  },
  InputOrderConfig: {
    fields: [
      f('config_id','编辑器中的输入订单配置唯一键。','区分不同玩法的完整映射集合。'),
      f('interactionMode','TargetFirst 先选目标；SmartCast 直接对光标施放；AimCast 进入瞄准确认；Indicator 模式按住预览松开施放；ContextScored 自动评分；PressReleaseAimCast 松键后再确认。','决定技能从按键到提交之间的整体交互体验。'),
      f('mappings[].actionId','要监听的 Input Action ID。','把具体快捷键动作接入订单流程。'),
      f('mappings[].trigger','Pressed/Released/Held/DoubleTap 决定何时触发。','支持按下施放、松开施放、持续施放和双击行为。'),
      f('doubleTapWindowSeconds','两次按下被视为双击的最大时间间隔。','调节双击操作的宽容度。'),
      f('orderTypeKey','默认生成的订单类型。','确定该动作最终请求哪种游戏行为。'),
      f('actorOrderRouting.candidates','按 Priority 检查候选项，并根据 Match 为不同操作者改选订单类型。','同一快捷键可随当前单位或技能状态改变用途。'),
      f('candidate.match.requiredAllTags','候选要求操作者具备的全部标签。','限定候选只对完整状态组合生效。'),
      f('candidate.match.blockedAnyTags','操作者命中任一阻止标签时跳过候选。','在沉默、禁用等状态下阻止特定订单。'),
      f('candidate.match.abilitySlotIndex / abilityIdKey / suffix','按槽位或能力标识进一步筛选候选。','将通用快捷键路由到当前装备或升级后的能力。'),
      f('candidate.targetType','候选命中时覆盖默认目标数据类型。','让同一动作在不同能力下要求实体、位置或方向。'),
      f('argsTemplate.i0–i3 / f0–f3','写入订单的整数和浮点参数槽。','把技能槽、模式或强度等静态参数随订单传递。'),
      f('requireTarget','开启后，没有满足要求的目标就不提交。','避免对空目标产生无效技能订单。'),
      f('actorCollectionKey','指定从哪个集合读取订单执行者。','支持当前选中单位、编队或上下文集合。'),
      f('targetCollectionKey','指定从哪个集合读取多个目标。','支持框选目标或预先收集的目标集合。'),
      f('targetType','None/Position/Entity/Entities/Direction/Vector/HoveredEntityOrPosition 决定订单需要的空间数据。','控制瞄准器和目标解析方式。'),
      f('modifierBehavior','忽略修饰键、按修饰键排队、始终立即或始终排队。','实现 Shift 排队和强制即时施放。'),
      f('isSkillMapping','标记该映射是否走技能交互流程。','技能可使用瞄准、自动选目标和施法覆盖。'),
      f('heldPolicy','EveryFrame 持续提交；StartEnd 仅在按下和松开时提交开始/结束订单。','支持持续移动或蓄力技能。'),
      f('castModeOverride','仅覆盖当前映射的全局 Interaction Mode。','单个技能可采用独立施法手感。'),
      f('autoTargetPolicy / autoTargetRangeCm','无显式实体目标时，按策略在范围内选择最近目标。','快捷施法也能自动锁定附近有效目标。'),
      f('cursorTargetPolicy / cursorTargetRangeCm','围绕光标位置查找目标，而不是围绕操作者。','提升鼠标附近目标的吸附与容错。'),
      f('groupMoveTargetLayout.mode','None 共用落点；Grid 为多执行者生成网格落点。','避免多个单位移动后完全重叠。'),
      f('groupMoveTargetLayout.spacingCm','网格落点间距。','控制编队疏密。'),
      f('groupMoveTargetLayout.orderTypeKeys','仅对列出的订单类型应用编队落点。','让移动使用编队，而技能订单保持原始目标。'),
      f('userOverrides.enabled / persistPath','允许用户覆盖映射并指定偏好保存位置。','提供可持久化的自定义键位。')
    ],
    recipes: [
      r('MOBA 智能施法','Interaction Mode 设 SmartCast；技能 Mapping 使用 PressedThisFrame、HoveredEntityOrPosition，并开启最近敌人自动目标。','按下快捷键立即对悬停目标或光标位置施法，无需二次确认。'),
      r('按住显示指示器，松开施法','全局或单项 Cast Mode 设 SmartCastWithIndicator，Trigger 使用 Held 或配合提交状态。','按住时持续瞄准，松开时提交目标。'),
      r('Shift 编队移动','移动 Mapping 使用 QueueOnModifier；Group Layout 设 Grid 并填写 Move.To。','普通点击立即移动，Shift 点击追加队列，多单位按网格保持间距。')
    ]
  },
  CastCommitProfile: {
    fields: [
      f('profile_id','施法提交配置唯一键。','允许不同施法交互复用独立提交流程。'),
      f('onActivate','进入该流程时按数组顺序执行操作。','可先进入瞄准状态，也可直接提交订单。'),
      f('frameActions','以 Input Action ID 为键，为临时交互状态配置操作序列。','定义确认、取消、切换模式等交互。'),
      f('op','pushFrame 进入临时交互；popFrame 退出；submitOrder 提交订单。','决定当前步骤改变交互状态还是执行游戏行为。'),
      f('payload','把光标、当前目标等值源写入订单参数。','在确认时将用户选择的空间数据带入订单。'),
      f('contextProfileId','pushFrame 时指定要进入的交互上下文。','切换到对应的瞄准器、目标选择或操作集。')
    ],
    recipes: [
      r('进入瞄准后左键确认','On Activate pushFrame 到 Aim；Frame Actions 中 Confirm 执行 submitOrder，Cancel 执行 popFrame。','按技能键进入瞄准，左键确认施放，取消键退出。'),
      r('无需瞄准直接提交','On Activate 只放置 submitOrder，并从当前上下文读取目标 Payload。','技能按下后立即生成订单。')
    ]
  },
  CastDispatchProfile: {
    fields: [
      f('profile_id','施法分发配置唯一键。','可为单控、多选单位或轮换施法建立不同策略。'),
      f('selector.kind','all 选择全部；topN 取最高分前 N 个；cycle 按事件推进轮换。','决定多少名候选操作者响应一次输入。'),
      f('selector.n','topN 模式选择的数量。','控制齐射人数或最佳施法者数量。'),
      f('selector.advanceOn','cycle 模式推进游标的事件键。','每次指定事件发生时切换到下一位操作者。'),
      f('scorer.kind','utility 表示按效用分数排列候选。','启用基于距离、资源或状态的最佳人选计算。'),
      f('scorer.considerations','按顺序列出评分项，可追加修饰方式。','组合多个因素形成最终候选排名。'),
      f('router.kind','parallel 同时分发；sequential 按顺序分发。','控制多名操作者同时响应或依次响应。'),
      f('router.sharedOrderId','开启后并行分发共享同一订单标识。','把一次群体操作作为同一批次追踪。')
    ],
    recipes: [
      r('选择最近且资源充足的一名施法者','Selector 设 topN、N=1；Scorer 加入距离反向评分与资源就绪评分。','多选单位按同一技能键时，仅最佳候选施法。'),
      r('全队同步施法','Selector 设 all；Router 设 parallel 并开启 Shared Order ID。','所有候选单位同时收到订单，并可作为同一批次追踪。'),
      r('单位轮流施法','Selector 设 cycle，并设置推进事件；Router 使用 sequential。','重复输入会在候选单位间轮换，避免所有单位同时消耗资源。')
    ]
  }
};