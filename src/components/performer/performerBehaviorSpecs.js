/** 与 Ludots performers.json behaviors 对齐的每种 kind 字段规格。 */
export const BEHAVIOR_KINDS = ['AssetBinding', 'AttributeBinding', 'TagBinding', 'Animator', 'Attachment', 'Sound', 'Material', 'Spline', 'Grounding', 'MinimapMarker', 'WorldText', 'SurfaceSource', 'InstancedBatch'];

export const BEHAVIOR_SPECS = {
  AssetBinding: {
    field: 'assetBinding',
    fields: [
      { k: 'assetKind', t: 'text', hint: 'Mesh / SkinnedMesh / Decal / Vfx' },
      { k: 'assetId', t: 'text', ref: 'logicalAssets' },
      { k: 'renderPath', t: 'text', hint: 'StaticMesh / SkinnedMesh' },
      { k: 'mobility', t: 'text', hint: 'Static / Movable' },
      { k: 'localOffset', t: 'vec3' },
      { k: 'localScale', t: 'vec3' },
      { k: 'localRotation', t: 'vec4' },
      { k: 'scaleParamKey', t: 'text' },
      { k: 'colorParamKey', t: 'text' },
      { k: 'materialParamKey', t: 'text' },
      { k: 'assetSwapParamKey', t: 'text' },
      { k: 'visibilityParamKey', t: 'text' },
    ],
    extras: ['style', 'motion'],
  },
  AttributeBinding: {
    field: 'attributeBinding',
    fields: [
      { k: 'attributeId', t: 'text', ref: 'attributes' },
      { k: 'targetParamKey', t: 'text' },
      { k: 'mode', t: 'text', options: ['Attribute', 'AttributeRatio', 'AttributeBase'] },
    ],
  },
  TagBinding: {
    field: 'tagBinding',
    fields: [
      { k: 'tagId', t: 'text', ref: 'tags' },
      { k: 'targetParamKey', t: 'text' },
      { k: 'invertLogic', t: 'bool' },
    ],
  },
  Animator: {
    field: 'animator',
    fields: [
      { k: 'animatorControllerId', t: 'text', ref: 'controllers' },
      { k: 'animationProfileId', t: 'text', ref: 'profiles' },
      { k: 'speedParamKey', t: 'text' },
      { k: 'stateParamKey', t: 'text' },
    ],
  },
  Attachment: {
    field: 'attachment',
    fields: [
      { k: 'target', t: 'text', options: ['Parent', 'Bone'] },
      { k: 'boneId', t: 'number' },
      { k: 'offset', t: 'vec3' },
      { k: 'rotationOffset', t: 'vec4' },
      { k: 'inheritScale', t: 'bool' },
      { k: 'followPositionX', t: 'bool' },
      { k: 'followPositionY', t: 'bool' },
      { k: 'followPositionZ', t: 'bool' },
      { k: 'followRotationX', t: 'bool' },
      { k: 'followRotationY', t: 'bool' },
      { k: 'followRotationZ', t: 'bool' },
      { k: 'followScaleX', t: 'bool' },
      { k: 'followScaleY', t: 'bool' },
      { k: 'followScaleZ', t: 'bool' },
    ],
  },
  Sound: {
    field: 'sound',
    fields: [
      { k: 'soundAssetId', t: 'text', ref: 'hostAssets' },
      { k: 'volume', t: 'number' },
      { k: 'volumeParamKey', t: 'text' },
      { k: 'loop', t: 'bool' },
    ],
  },
  Material: {
    field: 'material',
    fields: [
      { k: 'baseMaterialId', t: 'text', ref: 'materials' },
      { k: 'materialSwapParamKey', t: 'text' },
    ],
  },
  Spline: {
    field: 'spline',
    fields: [
      { k: 'splineAssetId', t: 'text', ref: 'hostAssets' },
      { k: 'usage', t: 'text', hint: 'Patrol / Road ...' },
      { k: 'widthParamKey', t: 'text' },
      { k: 'colorParamKey', t: 'text' },
      { k: 'speedParamKey', t: 'text' },
      { k: 'progressParamKey', t: 'text' },
      { k: 'waypointEventId', t: 'number' },
      { k: 'loop', t: 'bool' },
      { k: 'pingPong', t: 'bool' },
    ],
  },
  Grounding: { field: 'grounding', fields: [], raw: true },
  MinimapMarker: { field: 'minimapMarker', fields: [], raw: true },
  WorldText: {
    field: 'worldText',
    fields: [
      { k: 'textToken', t: 'text', ref: 'textTokens' },
      { k: 'mode', t: 'text' },
      { k: 'valueParamKey', t: 'text' },
      { k: 'secondaryValueParamKey', t: 'text' },
      { k: 'fontSize', t: 'number' },
    ],
    extras: ['style', 'motion'],
  },
  SurfaceSource: { field: 'surfaceSource', fields: [], raw: true },
  InstancedBatch: { field: 'instancedBatch', fields: [{ k: 'batchAssetId', t: 'text' }] },
};

export const blankBehavior = (kind = 'AssetBinding') => ({
  slot: 'body',
  kind,
  activeByDefault: true,
  [BEHAVIOR_SPECS[kind].field]: {},
});

