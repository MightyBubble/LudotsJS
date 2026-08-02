import {
  Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Box, Gamepad2,
  Link as LinkIcon, Globe, Settings, Shield, CheckSquare, Table, Network, BookOpen, Wand2,
  Image as ImageIcon, Music, Film, FolderKanban, Users, Activity, Search, ListTree, Map as MapIcon,
} from 'lucide-react';

/**
 * 顶层模块（Tab）→ 分组条目。
 * key 与 Project.enabled_modules / navigation_profile.tab_order 对应。
 */
export const NAV_GROUPS = [
  {
    key: 'project',
    label: '项目',
    items: [
      { page: 'ProjectOverview', label: '项目概览', icon: FolderKanban },
      { page: 'ProjectOverview', search: '?panel=validation', label: '校验摘要', icon: CheckSquare },
      { page: 'ProjectOverview', search: '?panel=settings', label: '项目设置', icon: Settings },
    ],
  },
  {
    key: 'participants',
    label: '世界',
    items: [
      { page: 'MapConfigEditor', label: 'Maps', icon: MapIcon },
      { page: 'LevelBlueprintEditor', label: '关卡蓝图', icon: BookOpen },
      { page: 'ParticipantEditor', label: 'Players & Teams', icon: Users },
      { page: 'EntityPrototypeEditor', label: 'Entity Prototypes', icon: Box },
      { page: 'EntityRelationEditor', label: 'Entity Relations', icon: LinkIcon },
      { page: 'EntityRelationEditor', search: '?view=static', label: 'Static Relations', icon: Network },
    ],
  },
  {
    key: 'world',
    label: '属性与标签',
    items: [
      { page: 'TagEditor', label: 'Gameplay Tags', icon: Edit3 },
      { page: 'AttributeEditor', label: 'Attributes', icon: Layers },
    ],
  },
  {
    key: 'core_data',
    label: '数据',
    items: [
      { page: 'GlobalConstantEditor', label: 'Global Constants', icon: Settings },
      { page: 'DataTableEditor', label: 'Data Tables', icon: Table },
      { page: 'StructureEditor', label: 'Structure Definitions', icon: Network },
    ],
  },
  {
    key: 'gameplay',
    label: 'Gameplay',
    items: [
      { page: 'AbilityLibrary', label: 'Abilities', icon: Wand2 },
      { page: 'AbilitySemanticProfileEditor', label: 'Ability Semantics', icon: KeyRound },
      { page: 'EffectLibrary', label: 'Effects', icon: Sparkles },
      { page: 'ModifierDefinitionEditor', label: 'Modifier Definitions', icon: GitBranch },
      { page: 'ValidatorEditor', label: 'Validators', icon: Shield },
    ],
  },
  {
    key: 'logic',
    label: '逻辑图',
    items: [
      { page: 'UnifiedGraphEditor', search: '?type=action', label: 'ActionGraph', icon: Globe },
      { page: 'UnifiedGraphEditor', search: '?type=data', label: 'DataGraph', icon: Globe },
      { page: 'UnifiedGraphEditor', search: '?type=function', label: 'FunctionGraph', icon: Globe },
      { page: 'UnifiedGraphEditor', search: '?type=query', label: 'EntityQueryGraph', icon: Search },
    ],
  },
  {
    key: 'command_control',
    label: '命令与控制',
    items: [
      { page: 'InputConfigEditor', label: 'Input Config', icon: Gamepad2 },
      { page: 'ControlPlaneEditor', label: 'Control Plane', icon: Network },
      { page: 'EntityCollectionEditor', label: 'Entity Collections', icon: Search },
      { page: 'CommandPanelEditor', label: 'Command Panels', icon: ListTree },
      { page: 'CommandPanelRuntime', label: 'Panel Runtime', icon: Activity },
    ],
  },
  {
    key: 'input',
    label: '输入与订单',
    items: [
      { page: 'InputOrderEditor', label: 'Input Order Mapping', icon: ListTree },
      { page: 'CommandIntentEditor', label: 'Command Intent', icon: GitBranch },
      { page: 'CastDispatchEditor', label: 'Cast Dispatch', icon: Network },
      { page: 'ControlSchemeEditor', label: 'Control Schemes', icon: Settings },
      { page: 'CastCommitEditor', label: 'Cast Commit', icon: CheckSquare },
    ],
  },
  {
    key: 'events',
    label: '规则',
    items: [
      { page: 'GameEventEditor', label: 'Game Events', icon: Zap },
      { page: 'InteractionEffects', label: 'Interaction Effects', icon: Sparkles },
      { page: 'UnlockableCommands', label: 'Unlockable Commands', icon: KeyRound },
    ],
  },
  {
    key: 'progression',
    label: '成长',
    items: [{ page: 'RequirementEditor', label: 'Requirements', icon: CheckSquare }],
  },
  {
    key: 'presentation',
    label: '表现',
    items: [
      { page: 'AssetLibrary', label: '全部资源', icon: Box },
      { page: 'AssetLibrary', search: '?type=model', label: '模型', icon: Box },
      { page: 'AssetLibrary', search: '?type=animation', label: '动画', icon: Film },
      { page: 'AssetLibrary', search: '?type=audio', label: '音效', icon: Music },
      { page: 'AssetLibrary', search: '?type=image', label: '图像', icon: ImageIcon },
    ],
  },
  {
    key: 'simulation',
    label: '模拟与诊断',
    items: [
      { page: 'NewAttributeSimulator', label: '属性计算器', icon: Calculator },
      { page: 'TagSimulator', label: '标签模拟器', icon: Zap },
      { page: 'AbilityPlayground', label: 'Ability Playground', icon: Gamepad2 },
      { page: 'History', label: 'Tag History', icon: Activity },
      { page: 'DesignDoc', label: '设计文档', icon: BookOpen },
    ],
  },
];

export const ALL_MODULE_KEYS = NAV_GROUPS.map(g => g.key);

/** 按项目的 enabled_modules / navigation_profile 过滤与排序顶层模块 */
export function getVisibleNavGroups(project) {
  const configured = project?.enabled_modules?.length ? project.enabled_modules : ALL_MODULE_KEYS;
  const enabled = configured.includes('participants') ? configured : [...configured, 'participants'];
  const configuredOrder = project?.navigation_profile?.tab_order?.length
    ? project.navigation_profile.tab_order
    : enabled;
  const order = configuredOrder.includes('participants') ? configuredOrder : [...configuredOrder.slice(0, 1), 'participants', ...configuredOrder.slice(1)];
  const labels = project?.navigation_profile?.tab_labels || {};
  return order
    .map(key => NAV_GROUPS.find(g => g.key === key))
    .filter(g => g && enabled.includes(g.key))
    .map(g => ({ ...g, label: labels[g.key] || g.label, isCustomLabel: Boolean(labels[g.key]) }));
}

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);