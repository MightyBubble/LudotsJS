import {
  Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Box,
  Link as LinkIcon, Globe, Settings, Shield, CheckSquare, Table, Network, BookOpen, Wand2,
} from 'lucide-react';

/** 顶栏分组导航：每组一个下拉，避免顶栏横向滚动 */
export const NAV_GROUPS = [
  {
    label: '标签',
    items: [
      { page: 'TagEditor', label: '标签编辑', icon: Edit3 },
      { page: 'TagSimulator', label: '标签模拟器', icon: Zap },
    ],
  },
  {
    label: '规则',
    items: [
      { page: 'UnlockableCommands', label: '可解锁指令', icon: KeyRound },
      { page: 'InteractionEffects', label: '交互效果规则', icon: Sparkles },
    ],
  },
  {
    label: '玩法',
    items: [
      { page: 'EffectLibrary', label: 'Effect 效果', icon: Sparkles },
      { page: 'AbilityLibrary', label: 'Ability 能力', icon: Wand2 },
      { page: 'TriggerLibrary', label: 'Trigger 触发器', icon: KeyRound },
      { page: 'ValidatorEditor', label: '验证器', icon: Shield },
      { page: 'RequirementEditor', label: '需求', icon: CheckSquare },
      { page: 'GameEventEditor', label: '事件', icon: Zap },
    ],
  },
  {
    label: '数据',
    items: [
      { page: 'AttributeEditor', label: '属性', icon: Layers },
      { page: 'ModifierDefinitionEditor', label: '修饰器', icon: GitBranch },
      { page: 'EntityPrototypeEditor', label: '实体原型', icon: Box },
      { page: 'EntityRelationEditor', label: '实体关系', icon: LinkIcon },
      { page: 'DataTableEditor', label: '数据表', icon: Table },
      { page: 'GlobalConstantEditor', label: '全局常量', icon: Settings },
      { page: 'StructureEditor', label: '结构关系图', icon: Network },
      { page: 'AssetLibrary', label: 'Asset 资源', icon: Box },
    ],
  },
  {
    label: '图与模拟',
    items: [
      { page: 'UnifiedGraphEditor', label: '图编辑器', icon: Globe },
      { page: 'NewAttributeSimulator', label: '属性计算器', icon: Calculator },
    ],
  },
  {
    label: '文档',
    items: [{ page: 'DesignDoc', label: '设计文档', icon: BookOpen }],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);