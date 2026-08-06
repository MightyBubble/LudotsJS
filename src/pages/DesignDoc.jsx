import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

const modules = [
  {
    id: "overview",
    title: "系统总览",
    overview: "本应用是一个游戏设计数据编辑器（Game Design Data Editor），面向策划/设计师，用于可视化定义和管理游戏系统中的核心数据结构。它不是运行时引擎，而是一个纯数据编辑工具——所有编辑结果以结构化JSON持久化，供游戏引擎消费。",
    definition: "整个系统由 17 个功能模块 + 4 个可视化图编辑器 + 2 个模拟器组成，覆盖了 GAS（Gameplay Ability System）风格的标签、属性、修饰器、验证器、需求、事件、条件、效果、指令、原型、关系、结构、常量、数据表等核心概念。",
    intent: "为游戏策划提供一个统一的、无需编程的数据编辑环境，使得复杂游戏系统（如技能、Buff、条件判断、属性计算等）可以通过可视化界面完成定义，降低策划与程序之间的沟通成本。",
    architecture: `核心架构分为四层：
• 数据层（Entity）：20+ 个 JSON Schema 实体，定义了所有数据模型
• 编辑层（Editor Pages）：17 个 CRUD 编辑页面，每个对应一个或多个实体
• 图计算层（Graph Editor）：统一的节点图编辑器，支持 Data/Query/Function/Structure 四种图类型
• 模拟层（Simulator）：标签模拟器 + 属性模拟器，提供即时反馈

数据引用关系（核心依赖链）：
GameplayTag → Validator → Requirement
GameplayTag → UnlockableCommand / InteractionEffect
Attribute → ModifierDefinition → EntityPrototype
DataGraph/FunctionGraph → Attribute (计算图)
EntityRelation → StructureDefinition → EntityPrototype
GlobalConstant / DataTable → 全局可引用`,
    questions: []
  },
  {
    id: "generic-ui-panels",
    title: "通用 UI 面板与世界空间指示器 (Generic UI & World Indicators)",
    overview: "对齐 Nexus Flow 看板『Ludots通用面板』35 张子卡片：28 类 HUD 面板 + 7 类世界空间指示器，按选中上下文动态路由组合，皮肤与布局全部数据驱动、Mod 可覆盖。",
    definition: "四层结构：UIScreenProfile（槽位布局+皮肤 token）→ UISelectionRouteProfile（选中数量/标签/原型 → 槽位面板路由，首条命中、未命中显式留空）→ 各类 PanelProfile（stat_strip / menu / tab_group / event_stream / order_queue / container_grid / node_tree / relation_graph / minimap / view_filter + 既有 command / entity / selection_info）→ WorldIndicatorProfile（selection_marker / nameplate / area_boundary / path_network / region_tint / offscreen_marker / relation_link）。",
    intent: "35 类预设面板全部是数据记录而非代码；代码只维护两张注册表（UI_PANEL_KINDS 与 WORLD_INDICATOR_KINDS）和对应渲染器。集合键（EntityCollection）是面板与指示器唯一的数据入口：面板只消费集合，Global.Selection 由框选写入，唯一的生产者例外是 view_filter（显式声明 output_collection_key）。",
    architecture: `已落地（增量1）：\n• UIScreenProfile / UISelectionRouteProfile 实体 + UI Screens / Selection Routes 编辑页\n• 蓝图节点 level_mount_ui_screen；Playground 框选写入 Global.Selection\n• RuntimeScreenHost（槽位×路由×皮肤）+ RuntimeSelectionInfoPanel\n\n待评审后落地：\n• 统一 action 结构：activate_ability / select_entities / open_panel / mount_screen / emit_event / time_scale / camera_focus / save_game / load_game / set_preference，经 uiActionRuntime 派发 ludots:level-event，不新建事件系统\n• 蓝图节点 level_mount_world_indicator、level_write_formation\n• Performer 新 behavior kind：CollectionBinding（实体∈集合→参数，选中圈/编队高亮统一驱动）\n• 场景级指示器为 viewport 图层（区域/染色/路网/屏外/关系连线），per-entity 指示器复用 WorldText / Spline / Material / MinimapMarker\n• 种子演示数据挂 Map.SelectionCaptureDemo：Screen.RTS.Default + Route.RTS.Selection + 各面板示例记录 + Level.UiShowcase 蓝图\n\n完整设计（含全部 schema 草案、35 卡映射表、Cucumber UAT）见评审文档 ludots_js_generic_ui_design.md；C# 落地路径见 ludots_csharp_generic_ui_issue.md。`,
    questions: [
      "路由规则匹配语义：多选时 required_all_tags 要求『每个选中实体都命中』，是否需要补充『任一命中』模式？",
      "设置项与 tab 的用户偏好持久化：user scope 存 localStorage 还是新建 UserPreference 实体？",
      "生产队列在 Playground 的模拟数据源用关卡变量还是给实体加 order_queue 字段？"
    ]
  },
  {
    id: "command-control",
    title: "命令与控制 (Command & Control)",
    overview: "以客户端控制者化身为锚点，通过关系投影生成可控制 Actor 集合，再由输入意图向集合提交命令。",
    definition: "命令与控制是 Input、Actor Collection 与 Order 之间的领域边界。Input Config 只描述输入动作与绑定；Control Plane 只引用一个 Entity Query Graph，用于从当前控制者化身解析可控制 Actor 集合。",
    intent: "保留 Ludots 的集合式控制创新：玩家控制的不是硬编码单 Actor，而是由关系图实时投影出的 Actor Collection，从而统一支持 RTS 编队、MOBA 英雄与召唤物、ARPG 化身与伙伴。",
    architecture: `一级模块：命令与控制
二级配置：
• Input Config：原有输入配置，原封不动迁入本模块
• Control Plane：极简配置，仅包含 control_plane_id 与 entity_query_graph_ref

领域边界：
• Avatar / Player Entity：当前客户端控制域的锚点，由运行时上下文提供，不写进配置
• Entity Query Graph：接收控制者化身上下文，沿 Controls 等关系查询并输出可控制 Actor 集合
• Actor Collection：命令作用对象的集合语义；actorCollectionKey 必须保留
• Command Intent：根据集合成员与目标上下文决定 Order，不拥有控制关系
• Input Binding：只触发 Intent，不解析关系、不保存 Actor 列表

单一数据源：
控制权限与成员关系只存在于实体关系图；Control Plane 不复制 relation id、遍历深度、筛选器或 Actor 列表。关系变化后，下一次查询自然得到新的控制集合。

约束：
1. Control Plane 查询必须输出 Entities/Actor Collection，而不是单个 Actor。
2. 查询图只能读取世界关系并选择 Actor，不提交 Order，也不修改 World。
3. Primary Actor 只是集合的兼容投影，不能替代集合模型。
4. InputOrderMapping 对集合只保存稳定的 actorCollectionKey 引用。`,
    questions: [
      "Control Plane 第一版是否固定使用一个全局配置，还是允许按游戏模式选择不同 profile？"
    ]
  },
  {
    id: "architecture-decisions",
    title: "架构统一决策 (Roadmap)",
    overview: "对文档中全部疑问的根因分析与统一方案。",
    definition: "文档里的 10 个疑问可归为四个根因：①图系统实体分裂 ②缺少统一的图执行引擎 ③布尔判断体系三层重叠（Validator / ConditionDefinition / Requirement）④副作用没有统一表达方式。",
    intent: "避免每个模块各自发明一小块 DSL。统一图存储、统一执行、统一条件、统一副作用，让新增玩法只需组合已有构件。",
    architecture: `已完成：
• 修复 graph_type 枚举矛盾：DataGraph 的枚举补齐为 data / structure / curve / attribute_calculation，并新增 usage 字段（general / curve / attribute_calculation）作为「用途标记」。属性编辑器与修饰器编辑器现在能同时选到新建的 data 图和遗留类型的图。
• 抽出统一图执行引擎 src/lib/graphRuntime.js：拓扑求值 + 环检测，实现数值、向量、黑板、比较、逻辑、集合、条件、标签判断节点。图编辑器的实时连线值与属性模拟器的曲线计算已共用它，删除了模拟器里 magnitude = a*10+b*5 的硬编码。

• Structure 统一：统一图编辑器的 structure 类型改为直接读写 StructureDefinition（EntityPrototype.structure_bindings 引用的就是它），新增 src/lib/structureAdapter.js 负责 StructureDefinition ↔ 画布(nodes/connections) 双向转换；旧的 DataGraph(structure) 数据已一次性迁移完毕并删除，DataGraph 的 graph_type 枚举已移除 structure，无遗留兼容代码。

• 图 / 数据分层（本次决策）：判定标准是「能否被求值」。能被求值的进图编辑器（Data / Query / Function / 未来的 Action，按 usage 组织）；只描述记录之间关系的进数据层。结构图因此从图编辑器的概念范围移出，归入导航的「数据」分组（数据表 + 关系图），未来的任务流图、progression 解锁图、科技树都复用同一个底座：一个带拓扑关系字段的实体 + 两个视图（表格视图批量编辑 / 拓扑视图看依赖与成环）。两边只通过引用衔接——解锁节点的可解锁性引用 Requirement 或验证图，任务节点的奖励引用动作图，计算逻辑仍只在执行图里定义一次。

待办（按优先级）：
1. 布尔体系收敛为两层：Validator = 原子判断 + 逻辑组合（并入 ConditionDefinition 能力，补齐 schema 缺失的 relation 字段）；Requirement = 面向玩家的解锁语义，补完 node_config / count_config 编辑 UI。
2. Action Graph（第 5 种图，副作用图）：引入 exec 执行引脚、事件入口节点、动作节点（加/移标签、改属性键、施加修饰器、发射事件、增删关系）与真正的顺序 / 分支 / 遍历。之后各处硬编码副作用字段渐进式改为引用 action graph。
3. Function 节点的执行语义接入引擎（目前为端口透传）。Query 已接入：src/lib/queryRuntime.js 实现实体源/原型·属性·标签·关系·关联实体过滤、空间距离与区域、交并差、按属性·关系·标签排序、TopN/BottomN/百分比限制，查询图编辑器右侧「查询模拟」面板可用模拟实体集实时查看各节点结果与最终输出。
4. 零散项：TagHistory 接入写入、TagCountEvent 面板补 GameEvent 下拉、ConditionEditor 配色统一（若并入 Validator 则直接下线）。`,
    questions: [
      "Action Graph 的事件入口应该复用 GameEvent 实体，还是单独定义一套图触发器？"
    ]
  },
  {
    id: "tag-editor",
    title: "标签编辑器 (TagEditor)",
    overview: "GameplayTag 的可视化树形编辑器，是整个系统的基础模块。",
    definition: "管理 GameplayTag 实体。支持层级路径创建（如 Ability.Combat.Fireball）、树形/图形视图切换、拖拽层级调整、批量操作、分类管理、导入导出。每个标签可配置 6 类规则：必需标签、阻止标签、附加标签、移除标签、禁用条件、移除条件。",
    intent: "GameplayTag 是整个 GAS 系统的核心标识符。几乎所有其他模块（验证器、需求、指令、效果、修饰器等）都依赖标签路径进行条件判断。本模块确保标签的层级结构和规则定义的正确性。",
    architecture: `实体：GameplayTag, TagCategory, TagHistory, TagTemplate, TagCountEvent
页面：TagEditor（主编辑器）、TagSimulator（模拟器）
组件：GraphView（图形视图）、CategoryManager（分类管理）、TagCountEventPanel（标签计数事件面板）

关键逻辑：
• 路径自动创建：输入 A.B.C 时自动创建 A、A.B、A.B.C 三个标签
• 拖拽重构：拖拽标签到新父节点时，自动级联更新所有子标签的 full_path 和 parent_path
• 规则系统：required_tags / blocked_tags 控制附加前验证，attached_tags / removed_tags 控制附加后副作用，disabled_if_tags / remove_if_tags 控制条件性状态变更
• 本地编辑 + 手动保存：拖拽操作先在本地 state 生效，需手动保存才持久化`,
    questions: [
      "TagCountEvent 面板引用了 GameEvent 实体，但 TagEditor 中并未直接查询 GameEvent 列表，是否存在缺失的联动？",
      "TagHistory 实体已定义但未在 TagEditor 中使用，是否计划实现操作历史回溯功能？"
    ]
  },
  {
    id: "tag-simulator",
    title: "标签模拟器 (TagSimulator)",
    overview: "标签规则的即时模拟测试工具。",
    definition: "模拟一个虚拟实体，允许用户向其添加/移除标签，实时检测标签规则（required/blocked/attached/removed/disabled_if/remove_if）的触发效果。",
    intent: "让策划在定义标签规则后，无需启动游戏即可验证规则的正确性。例如：验证「添加 Buff.Fire 时是否会自动移除 Buff.Ice」。",
    architecture: `独立页面，无持久化写入。三栏布局：
• 左栏：当前实体的活跃标签状态
• 中栏：标签库（分为可添加/被阻止两组）
• 右栏：选中标签的 Inspector（显示添加后的副作用预览）

核心逻辑：canAddTag() 检查前置条件，simulateAddTag() 预览副作用，handleAddTag() 执行添加并级联处理 remove_if 规则。`,
    questions: []
  },
  {
    id: "validator-editor",
    title: "验证器编辑器 (ValidatorEditor)",
    overview: "布尔判断单元的定义工具。",
    definition: "管理 Validator 实体。每个验证器返回 true/false，支持四种类型：entity_check（实体存在性检查）、entity_compare（实体属性比较）、combine（逻辑组合 AND/OR/NOT/XOR）、function_graph（引用函数图）。",
    intent: "验证器是 Requirement（需求）系统的基础构件。通过将复杂的布尔判断拆分为可复用的验证器单元，策划可以像搭积木一样组合出复杂的前置条件。",
    architecture: `实体：Validator
引用：Attribute, GameplayTag, EntityRelation, EntityPrototype, FunctionGraph, GlobalConstant

关键设计：
• entity_check：支持 has_tag / has_any_tags / has_all_tags / is_prototype / has_attribute / has_relation / function_graph 七种检查方式
• entity_compare：比较值A 和 比较值B 均支持多种来源（literal/constant/attribute_value/tag_count/relation_attribute/relation_count/function_graph），操作符支持 gt/lt/gte/lte/eq/neq
• combine：通过引用其他 validator_id 实现逻辑组合
• negate 字段：取反任意验证器的结果
• failure_result：验证失败时返回 false 或 unknown`,
    questions: [
      "entity_compare 的 value_source 包含 relation_attribute 和 relation_count，但 Schema 中未定义对应的 source_relation_id 等字段——这些扩展字段是否仅在前端使用？"
    ]
  },
  {
    id: "requirement-editor",
    title: "需求编辑器 (RequirementEditor)",
    overview: "前置条件的组合定义工具。",
    definition: "管理 Requirement 实体。支持两种类型：node（逻辑组合节点，包含 AND/OR/XOR 的子需求列表）和 count（计数型需求，如「拥有 >= 3 个某标签的实体」）。",
    intent: "Requirement 是面向玩家的「解锁条件」抽象。例如：「建造兵营需要：木材 >= 100 AND 已解锁石器时代」。它复用 Validator 作为原子条件，通过逻辑树组合出复杂需求。",
    architecture: `实体：Requirement
引用：Validator

node_config.sub_requirements 中每项可以是 validator 或嵌套 requirement，支持 negate 和 context_binding（指定 source/target/player/global 上下文）。
count_config 支持 validator_true_count 和 entity_count 两种计数模式。

状态字段 state 支持 active/disabled/hidden 三态。`,
    questions: [
      "当前编辑器的配置部分仅显示占位符「编辑配置...」，node_config 和 count_config 的详细编辑 UI 似乎尚未完成？"
    ]
  },
  {
    id: "unlockable-commands",
    title: "指令解锁编辑器 (UnlockableCommands)",
    overview: "基于标签条件的指令可用性规则。",
    definition: "管理 UnlockableCommand 实体。定义「当交互者和目标满足特定标签条件时，某个指令标签被解锁」的规则。",
    intent: "控制游戏中可执行指令的可用性。例如：「玩家拥有 Skill.Fireball 标签 且 目标拥有 Type.Enemy 标签时，解锁 Command.Attack.Fireball」。",
    architecture: `实体：UnlockableCommand
引用：GameplayTag

每条规则包含：
• unlocked_command_tag_path：被解锁的指令标签路径
• interactor_conditions：交互者（通常是玩家）的标签条件（has_any_tags / has_all_tags / not_has_tags）
• target_conditions：目标对象的标签条件（同上）
• is_active：是否启用

表格式编辑器，支持内联编辑所有 6 组标签条件。`,
    questions: []
  },
  {
    id: "interaction-effects",
    title: "交互效果编辑器 (InteractionEffects)",
    overview: "效果触发的条件映射表。",
    definition: "管理 InteractionEffect 实体。定义「当某个效果标签被触发，且发起者/目标满足特定标签条件时，产生哪些后续效果」的规则。",
    intent: "实现效果的链式反应。例如：「Fire.Burn 效果作用于 Material.Wood 目标时 → 产生 Effect.Ignite + Effect.Damage.Fire」。支持优先级排序。",
    architecture: `实体：InteractionEffect
引用：GameplayTag

与 UnlockableCommand 结构类似，但增加了：
• triggering_effect_tag_path：触发源效果标签
• resulting_effect_ids：后续效果 ID 列表（这些效果会再次进入效果系统处理，形成链式反应）
• priority：优先级数值，决定同一触发源的多个效果规则的执行顺序`,
    questions: [
      "resulting_effect_ids 的值应为效果标签路径还是 InteractionEffect 记录的 ID？当前 Schema 定义为 string 数组，但命名暗示是 ID。"
    ]
  },
  {
    id: "unified-graph-editor",
    title: "统一图编辑器 (UnifiedGraphEditor)",
    overview: "可视化节点图编辑器，支持四种图类型。",
    definition: "管理 DataGraph、EntityQuery、FunctionGraph 三个实体（Structure 类型也存储在 DataGraph 中）。提供拖拽式的节点-连线图编辑界面，支持：数学运算节点、黑板（Blackboard）参数、查询节点、函数节点、结构节点。",
    intent: "用可视化方式定义复杂的数值计算（属性计算曲线）、实体查询逻辑、通用函数和抽象结构关系，取代策划手写公式或表格。",
    architecture: `实体：DataGraph（graph_type: data/structure）、EntityQuery、FunctionGraph
组件：GraphCanvas、UnifiedNode、NodePort、Connection、BlackboardPanel、UnifiedNodeLibrary、Toolbar、nodeConfigs

四种图类型：
• Data Graph：纯数值计算图，用于属性最终值计算、修饰器曲线计算
• Query Graph：实体查询图，通过 source → filter → sort → limit 管线筛选实体集
• Function Graph：通用函数图，支持比较、逻辑、集合、条件分支、标签判断等操作
• Structure Graph：抽象结构图，定义节点间的关系拓扑

核心架构：
• 每个图的定义存储为 JSON 字符串（graph_definition），包含 nodes、connections、blackboard
• 节点类型在 nodeConfigs.js 中集中注册，包含输入/输出端口的类型定义
• 连接时进行端口类型校验（any 类型可接受任何输入）
• 实时计算：每当节点/连接变化时自动执行拓扑排序 + 前向传播计算`,
    questions: [
      "DataGraph 同时存储 data 和 structure 两种图类型，通过 graph_type 字段区分。但 structure 图有自己的专用编辑器（StructureEditor），是否存在数据竞争风险？",
      "[部分完成] 计算已抽到统一引擎 graphRuntime，覆盖数值/向量/黑板/比较/逻辑/集合/条件/标签节点；Query 与 Structure 节点仍为端口透传，待接入执行语义。"
    ]
  },
  {
    id: "attribute-editor",
    title: "属性编辑器 (AttributeEditor)",
    overview: "实体属性的定义和计算配置工具。",
    definition: "管理 Attribute 实体。每个属性由多个键（keys）组成（如 base_value、add_zone、multiply_zone），通过 input_mappings 将键映射到 Data Graph 的黑板参数，最终由 Data Graph 计算出属性最终值。",
    intent: "定义游戏中所有可量化的属性（如 attack_power、health、move_speed），并配置其计算管线。属性值不是直接存储的数字，而是通过多个「键」汇总计算得到。",
    architecture: `实体：Attribute, AttributeThresholdEvent
引用：DataGraph

关键设计：
• keys 数组：每个键有 name 和 type（value 或 array），value 型键存储单一数值，array 型键存储数值列表
• input_mappings：将 Data Graph 黑板的公共参数映射到属性的键（如 graph_base → base_value）
• final_calculation_data_graph_id：指向负责最终计算的 Data Graph
• clamp_config：钳制约束（最小/最大值，可引用键或固定值）
• recovery_config：自动回复行为（目标键、回复速率、延迟）
• 阈值事件：通过 ThresholdEventPanel 配置，当属性键达到阈值时触发 GameEvent`,
    questions: [
      "[已修复] graph_type 枚举已补齐并新增 usage 用途标记，计算图下拉现在同时包含 data 图与遗留 attribute_calculation 图。"
    ]
  },
  {
    id: "modifier-definition-editor",
    title: "修饰器定义编辑器 (ModifierDefinitionEditor)",
    overview: "属性修饰器（Buff/Debuff 效果）的定义工具。",
    definition: "管理 ModifierDefinition 实体。定义「输入源 → 曲线计算 → 输出到目标属性的某个键」的修饰管线。",
    intent: "修饰器是连接「标签/属性等输入」和「属性键变化」的桥梁。例如：「每拥有 1 个 Buff.Strength 标签，attack_power 的 add_zone 增加 10」。",
    architecture: `实体：ModifierDefinition
引用：DataGraph（曲线图）、Attribute、GameplayTag、EntityRelation

关键设计：
• curve_input_mappings：定义曲线图的输入来源，支持 6 种来源类型：
  - tag_count：标签计数
  - attribute_key：属性键值
  - constant：常量
  - relation_entity_attribute：关联实体的属性
  - relation_attribute：关系本身的属性
  - relation_tag_count：关系上的标签计数
• target_type：修饰目标类型（entity_attribute / related_entity_attribute / relation_attribute）
• output_key：输出到目标属性的哪个键
• max_trigger_times：最大生效次数

曲线图对应 DataGraph 的 curve 类型子集。`,
    questions: [
      "[已修复] 曲线图下拉现在同时包含 data 图（用途 general/curve）与遗留 curve 图。"
    ]
  },
  {
    id: "entity-prototype-editor",
    title: "实体原型编辑器 (EntityPrototypeEditor)",
    overview: "游戏实体的模板定义工具。",
    definition: "管理 EntityPrototype 实体。定义实体的「原型」，包含它引用的属性列表和结构绑定。",
    intent: "原型是游戏实体的蓝图。例如：「战士」原型引用了 health、attack_power、defense 三个属性，并绑定到科技树结构的某个节点。运行时创建实体时，根据原型初始化属性实例。",
    architecture: `实体：EntityPrototype
引用：Attribute、StructureDefinition

关键字段：
• referenced_attributes：引用的属性 ID 列表，决定了该原型的实体拥有哪些属性
• structure_bindings：绑定到抽象结构图的节点（structure_id + node_id），用于将原型放入拓扑网络（如科技树、势力关系图）
• static_relations（遗留字段）：直接定义的静态关系，已移至 EntityRelationEditor 的「静态关系」视图管理`,
    questions: []
  },
  {
    id: "entity-relation-editor",
    title: "关系编辑器 (EntityRelationEditor)",
    overview: "实体间关系的定义和配置工具。",
    definition: "管理 EntityRelation 实体。分为两个视图：关系定义（定义关系类型的 Schema）和静态关系（在原型上配置具体的关系实例）。",
    intent: "定义游戏世界中实体间的各种关系类型（如父子、盟友、宿敌、装备槽位等），并允许在原型层面预配置静态关系。",
    architecture: `实体：EntityRelation, EntityPrototype（static_relations 字段）
引用：Attribute、GameplayTag

关系定义视图：
• relation_id：关系类型标识符
• is_directional：是否有向
• inverse_relation_id：反向关系 ID
• attributes：关系本身携带的属性列表（引用 Attribute ID）

静态关系视图：
• 左栏选择源原型，右栏配置该原型的 static_relations
• 每条静态关系：relation_definition_id + target_prototype_id + attribute_values`,
    questions: []
  },
  {
    id: "structure-editor",
    title: "结构编辑器 (StructureEditor)",
    overview: "抽象拓扑结构的可视化编辑器。",
    definition: "管理 StructureDefinition 实体。通过拖拽节点和连线定义抽象的图结构（如科技树、势力关系网、地图拓扑等）。",
    intent: "提供独立于具体实体的抽象结构定义。EntityPrototype 通过 structure_bindings 绑定到结构节点，实现「原型在拓扑中的位置」映射。",
    architecture: `实体：StructureDefinition
引用：EntityRelation

使用 GraphCanvas 组件，但自定义了 StructureNode 组件（简化的节点渲染）。
• nodes 数组：每个节点有 node_id、name、position
• edges 数组：每条边有 source_node_id、target_node_id、relation_definition_id、attribute_values
• 右侧属性面板：选中节点时编辑节点属性，未选中时显示所有连接并可修改关系类型

与 UnifiedGraphEditor 中 structure 图类型存在功能重叠。`,
    questions: [
      "[已完成] 结构图已完全迁移：统一编辑器的 structure 类型直接读写 StructureDefinition（唯一真源），旧的 DataGraph(structure) 记录已全部转换并删除，DataGraph 的 graph_type 不再包含 structure，代码中无兼容分支。"
    ]
  },
  {
    id: "new-attribute-simulator",
    title: "属性模拟器 (NewAttributeSimulator)",
    overview: "修饰器 → 属性计算的端到端模拟工具。",
    definition: "选择一个实体原型后，显示其引用的所有属性和相关的修饰器。用户可以调整输入源（标签计数、属性键值、常量），实时查看修饰器输出和属性最终值。",
    intent: "让策划在不启动游戏的情况下验证：「给一个战士叠 5 层力量 Buff 后，攻击力会变成多少？」。",
    architecture: `三栏布局：
• 左栏（输入源）：按「被引用标签」「属性键输入」「常量输入」分组显示，标签可 +/- 计数
• 中栏（修饰器计算）：显示所有修饰器的输入/输出，支持手动开关单个修饰器
• 右栏（属性聚合）：显示每个属性的所有键值和最终汇总值

核心计算逻辑：
1. 根据修饰器的 curve_input_mappings 读取输入值
2. 简化计算 magnitude = inputs * 10 + 5（注意：这是模拟计算，非真实曲线图执行）
3. 将 magnitude 累加到目标属性的对应键
4. 汇总所有键值得到最终属性值

缺陷预警系统：当修饰器引用了原型未包含的属性时，显示「输入预警」或「目标预警」。`,
    questions: [
      "[已修复] 已接入统一图执行引擎，按修饰器的 curve_data_graph_id 真实执行曲线图；找不到可执行图时退化为输入求和并在卡片上标注「无图」。"
    ]
  },
  {
    id: "game-event-editor",
    title: "事件编辑器 (GameEventEditor)",
    overview: "游戏事件的定义工具。",
    definition: "管理 GameEvent 实体。定义事件的唯一 ID、输入参数（订阅时传入）和输出参数（触发时传出）。",
    intent: "事件是系统间解耦通信的载体。属性阈值事件、标签计数事件等触发器在条件满足时发射 GameEvent，其他系统订阅并响应。",
    architecture: `实体：GameEvent

每个事件包含：
• event_id：事件唯一标识
• input_parameters：订阅者可传入的参数（name, type, default_value）
• output_parameters：触发时输出的参数（name, type）
• category：分类标签

参数类型支持：number, boolean, string, array, object, entity, entities。
卡片式编辑界面，支持内联编辑参数列表。`,
    questions: []
  },
  {
    id: "global-constant-editor",
    title: "全局常量编辑器 (GlobalConstantEditor)",
    overview: "全局共享常量的管理工具。",
    definition: "管理 GlobalConstant 实体。支持 number、string、boolean、object、array 五种值类型。",
    intent: "提供全局可引用的常量池。验证器的 entity_compare、修饰器的 curve_input_mappings 等可以引用全局常量，避免硬编码数值。",
    architecture: `实体：GlobalConstant
字段：constant_key, constant_value（JSON 字符串）, value_type, description, category

值以 JSON 字符串格式存储，object/array 类型在编辑时提供 Textarea 输入并做 JSON 校验。
表格式编辑器，移动端切换为卡片视图。`,
    questions: []
  },
  {
    id: "data-table-editor",
    title: "数据表编辑器 (DataTableEditor)",
    overview: "通用的二维数据表管理工具。",
    definition: "管理 DataTable 实体。支持自定义列（string/number/boolean 类型）和行数据。",
    intent: "为策划提供类 Excel 的数据表编辑能力，用于存储配置表、成长曲线、掉落表等结构化数据。数据表可被 Data Graph 中的 data_table_read 节点引用。",
    architecture: `实体：DataTable
字段：table_id, name, columns（列定义数组）, rows（行数据数组）

左右分栏布局：左侧数据表列表，右侧表格编辑器。
支持两种模式：查看模式（直接内联编辑单元格）和编辑表头模式（修改列名/类型、增删列行）。`,
    questions: []
  },
  {
    id: "condition-editor",
    title: "条件编辑器 (ConditionEditor)",
    overview: "通用条件定义工具。",
    definition: "管理 ConditionDefinition 实体。支持三种类型：preset（预设条件）、function_graph（函数图条件）、group（条件组 AND/OR/NOT）。",
    intent: "条件是比验证器更高层的抽象，支持上下文参数绑定和函数图计算。用于技能释放条件、AI 决策条件等场景。",
    architecture: `实体：ConditionDefinition
组件：PresetConditionEditor, FunctionGraphConditionEditor, ConditionGroupEditor

三种类型：
• preset：内置的预设条件模板（equals, greater_than 等），通过 param_source 配置参数来源
• function_graph：引用 FunctionGraph 并配置 input_mappings
• group：通过 AND/OR/NOT 组合多个子条件（sub_conditions 以 JSON 字符串存储）

evaluate_context_parameters：定义评估此条件所需的上下文参数。`,
    questions: [
      "此页面的暗色主题尚未更新为新的配色方案（仍使用 #1e1e1e / #2d2d2d / #3d3d3d），与其他页面不一致。"
    ]
  },
  {
    id: "action-graph",
    title: "Action Graph（规划中）",
    overview: "可复用的动作例程库，类似虚幻的 Function Library / Macro。",
    definition: "第五类图。带执行流（exec 引脚）的可复用动作例程：有签名（输入参数、可选返回值）、有内部执行流与副作用节点，可被其他 Action Graph 调用。",
    intent: `定位为类似虚幻蓝图的 Function Library / Macro：一组无状态、可复用、可组合的动作单元。

Action Graph 只描述"做什么"，不包含任何触发条件，也不关心自己被谁调用。调用方式（谁在什么时机调用它、如何绑定参数）不属于本模块范围，后续单独讨论。

与现有四类图的区别：Data / Query / Function / Structure 图都是求值语义（输入 → 值 / 布尔 / 实体集），Action Graph 是执行语义（按 exec 链顺序产生副作用）。求值部分直接复用现有图作为子图。`,
    architecture: `实体：ActionGraph（规划）
字段：action_id, name, description, parameters[]（名称/类型/默认值）, return_type, is_macro（宏：内联展开，可有多个执行输出；函数：单入单出）, graph_definition（JSON）

节点分类（规划）：
• 执行流：exec 入口(entry)/返回(return)、分支(branch)、序列(sequence)、循环(for_each，接 Query 图输出的实体集)
• 副作用：添加/移除标签、施加/移除修饰器、设置属性键值、触发 GameEvent、创建/删除关系
• 调用：call_action（调用另一个 Action Graph）、call_function（调用 Function 图求值）
• 取值：复用 Data / Function / Query 图作为纯求值子图；条件判断复用 Validator / Requirement

引脚约定：白色三角 exec 引脚只连 exec，数据引脚沿用现有 TYPE_SHAPES / TYPE_COLORS。
运行时：新增 actionRuntime.js，按 exec 链顺序执行并产出"副作用日志"（不真的改库），在编辑器右侧面板单步查看。`,
    questions: [
      "宏（is_macro，内联展开、允许多个执行输出引脚）第一版是否需要？还是先只做函数形态（单入单出）。",
      "副作用是否需要事务/回滚语义（一串动作中途失败时前面的是否撤销）。",
      "循环节点的实体集来源确认为 Query 图输出，是否还需要支持数组类型的黑板变量。"
    ]
  }
];

function ModuleSection({ module }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-[#2A2E37] rounded-lg overflow-hidden bg-[#15171C]">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-3 hover:bg-[#1A1D24] transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-[#D97706] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#E2D8B3]">{module.title}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{module.overview}</div>
        </div>
        {module.questions.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded flex-shrink-0">
            <AlertTriangle className="w-3 h-3" />
            {module.questions.length} 疑问
          </span>
        )}
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#2A2E37] pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#D97706] uppercase tracking-wider mb-2">模块定义</h4>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{module.definition}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-[#D97706] uppercase tracking-wider mb-2">设计意图</h4>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{module.intent}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-bold text-[#D97706] uppercase tracking-wider mb-2">关键架构</h4>
            <pre className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap font-mono bg-[#0D0F14] p-3 rounded border border-[#2A2E37] overflow-x-auto">{module.architecture}</pre>
          </div>
          
          {module.questions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> 疑问与待确认
              </h4>
              <div className="space-y-2">
                {module.questions.map((q, i) => (
                  <div key={i} className="text-xs text-amber-300/80 bg-amber-400/5 border border-amber-400/20 rounded p-2.5 leading-relaxed">
                    {i + 1}. {q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DesignDocPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0D0F14] text-[#e5e5e5]">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {modules.map(module => (
            <ModuleSection key={module.id} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
}