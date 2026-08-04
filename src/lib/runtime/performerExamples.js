export const BLACKSMITH_PERFORMER_EXAMPLE = [
  {
    performer_id: 'example.blacksmith.root',
    label: '铁匠铺 Prefab',
    children: [
      { definition_id: 'example.blacksmith.building', scope_tag: 1, param_overrides: [] },
      { definition_id: 'example.blacksmith.chimney', scope_tag: 1, param_overrides: [] },
      { definition_id: 'example.blacksmith.worker', scope_tag: 1, param_overrides: [] },
    ],
    behaviors: [], paramDefaults: [], rules: [],
  },
  {
    performer_id: 'example.blacksmith.building',
    label: '建筑主体', children: [], paramDefaults: [], rules: [],
    behaviors: [{ slot: 'body', kind: 'AssetBinding', activeByDefault: true, assetBinding: { assetKind: 'Mesh', assetId: 'blacksmith.building', localOffset: [0, 0, 0], localScale: [1, 1, 1] } }],
  },
  {
    performer_id: 'example.blacksmith.chimney',
    label: '烟囱', children: [{ definition_id: 'example.blacksmith.smoke', scope_tag: 2, param_overrides: [] }], paramDefaults: [], rules: [],
    behaviors: [{ slot: 'body', kind: 'AssetBinding', activeByDefault: true, assetBinding: { assetKind: 'Mesh', assetId: 'blacksmith.chimney', localOffset: [1.2, 0, 0] } }],
  },
  {
    performer_id: 'example.blacksmith.smoke',
    label: '烟雾', children: [], paramDefaults: [],
    behaviors: [{ slot: 'body', kind: 'AssetBinding', activeByDefault: false, assetBinding: { assetKind: 'Vfx', assetId: 'blacksmith.smoke' } }],
    rules: [
      { event: { kind: 'TagEffectiveChanged', key: 'working' }, condition: { inline: 'TagGained' }, command: { kind: 'ActivateBehavior', targetBehaviorSlot: 'body' } },
      { event: { kind: 'TagEffectiveChanged', key: 'working' }, condition: { inline: 'TagLost' }, command: { kind: 'DeactivateBehavior', targetBehaviorSlot: 'body' } },
    ],
  },
  {
    performer_id: 'example.blacksmith.worker',
    label: '工人', children: [{ definition_id: 'example.blacksmith.tool', scope_tag: 1, param_overrides: [] }], paramDefaults: [], rules: [],
    behaviors: [{ slot: 'body', kind: 'AssetBinding', activeByDefault: true, assetBinding: { assetKind: 'SkinnedMesh', assetId: 'blacksmith.worker', localOffset: [-1, 0, 0] } }],
  },
  {
    performer_id: 'example.blacksmith.tool',
    label: '工具挂件', children: [], paramDefaults: [], rules: [],
    behaviors: [{ slot: 'attachment', kind: 'Attachment', activeByDefault: true, attachment: { target: 'Parent', offset: [0, 0.65, -0.35], rotationOffset: [0, 0, 0, 1], inheritScale: false } }],
  },
];