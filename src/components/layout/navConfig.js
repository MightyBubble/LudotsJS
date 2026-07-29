import {
  Edit3, Zap, KeyRound, Sparkles, Layers, GitBranch, Calculator, Box,
  Link as LinkIcon, Globe, Settings, Shield, CheckSquare, Table, Network, BookOpen, Wand2,
  Image as ImageIcon, Music, Film,
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
      { page: 'ModifierDefinitionEditor', label: '修饰器', icon: GitBranch },
      { page: 'ValidatorEditor', label: '验证器', icon: Shield },
      { page: 'RequirementEditor', label: '需求', icon: CheckSquare },
      { page: 'GameEventEditor', label: '事件', icon: Zap },
    ],
  },
  {
    label: '数据原型',
    items: [
      { page: 'AttributeEditor', label: '属性', icon: Layers },
      { page: 'EntityPrototypeEditor', label: '实体原型', icon: Box },
      { page: 'EntityRelationEditor', label: '实体关系', icon: LinkIcon },
    ],
  },
  {
    label: '静态数据',
    items: [
      { page: 'StructureEditor', label: '结构关系图', icon: Network },
      { page: 'GlobalConstantEditor', label: '常量表', icon: Settings },
      { page: 'DataTableEditor', label: '数据表', icon: Table },
    ],
  },
  {
    label: '资源',
    items: [
      { page: 'AssetLibrary', label: '全部资源', icon: Box },
      { page: 'AssetLibrary', search: '?type=model', label: '模型', icon: Box },
      { page: 'AssetLibrary', search: '?type=animation', label: '动画', icon: Film },
      { page: 'AssetLibrary', search: '?type=audio', label: '音效', icon: Music },
      { page: 'AssetLibrary', search: '?type=image', label: '图像', icon: ImageIcon },
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