/** 与 Ludots performers.json behaviors 对齐的每种 kind 字段规格。 */
export const BEHAVIOR_KINDS = ['AssetBinding', 'AttributeBinding', 'TagBinding', 'Animator', 'Attachment', 'Sound', 'Material', 'Spline'];

export const BEHAVIOR_SPECS = {
  AssetBinding: {
    field: 'assetBinding',
    fields: [
      { k: 'assetKind', t: 'text', hint: 'Mesh / SkinnedMesh / Decal / Vfx' },
      { k: 'assetId', t: 'text' },
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
  },
  AttributeBinding: {
    field: 'attributeBinding',
    fields: [
      { k: 'attributeId', t: 'text' },
      { k: 'targetParamKey', t: 'text' },
      { k: 'mode', t: 'text', hint: 'AttributeRatio / AttributeValue' },
    ],
  },
  TagBinding: {
    field: 'tagBinding',
    fields: [
      { k: 'tagId', t: 'text' },
      { k: 'targetParamKey', t: 'text' },
      { k: 'invertLogic', t: 'bool' },
    ],
  },
  Animator: {
    field: 'animator',
    fields: [
      { k: 'animatorControllerId', t: 'text' },
      { k: 'animationProfileId', t: 'text' },
      { k: 'speedParamKey', t: 'text' },
      { k: 'stateParamKey', t: 'text' },
    ],
  },
  Attachment: {
    field: 'attachment',
    fields: [
      { k: 'boneId', t: 'number' },
      { k: 'offset', t: 'vec3' },
      { k: 'rotationOffset', t: 'vec4' },
      { k: 'inheritScale', t: 'bool' },
    ],
  },
  Sound: {
    field: 'sound',
    fields: [
      { k: 'soundAssetId', t: 'text' },
      { k: 'volume', t: 'number' },
      { k: 'volumeParamKey', t: 'text' },
      { k: 'loop', t: 'bool' },
    ],
  },
  Material: {
    field: 'material',
    fields: [
      { k: 'baseMaterialId', t: 'text' },
      { k: 'materialSwapParamKey', t: 'text' },
    ],
  },
  Spline: {
    field: 'spline',
    fields: [
      { k: 'splineAssetId', t: 'text' },
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
};

export const blankBehavior = (kind = 'AssetBinding') => ({
  slot: 'body',
  kind,
  activeByDefault: true,
  [BEHAVIOR_SPECS[kind].field]: {},
});