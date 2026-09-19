// 编辑器集中事实表：容量 / 上限 / 默认值的单一事实源（编辑器路线图第 4 步）。
//
// 同源纪律：本表与 LudotsProd 仓库 `gitbook/reference/mod-editor-prd/facts.md`
// （由 `scripts/generate-prd-facts.py` 从 C# 源码与 assets 配置生成）同源维护——
// 数值变更必须先在引擎侧落地（C# 常量 / game.json / config_catalog.json），再生 facts.md，
// 最后同步本表；两侧冲突时以引擎源码为准并立即修正漂移侧。
// 本仓库不做跨仓库文件依赖，此文件是受控手抄副本 + 编辑器侧默认值（UI 偏好，无引擎对应物）的唯一落点。
//
// 规则：校验与 UI 代码禁止在本表之外出现容量 / 上限字面量，一律经 factValue(key) 取值。

export const EDITOR_FACTS = {
  ability: [
    { key: 'ability.execItemsMax', value: 16, unit: 'items', source: 'C# AbilityExecSpec.MAX_ITEMS（AbilityExecLoader 校验）', note: 'exec.items 数组长度上限' },
    { key: 'ability.execCallerParamsMax', value: 4, unit: 'sets', source: 'C# AbilityExecCallerParamsPool.MAX_SETS', note: 'exec.callerParams 参数组数上限' },
    { key: 'ability.onActivateEffectsMax', value: 16, unit: 'effects', source: 'C# AbilityOnActivateEffects.CAPACITY', note: 'onActivateEffects 数量上限' },
    { key: 'ability.toggleActiveEffectsMax', value: 4, unit: 'effects', source: 'C# AbilityExecLoader.MaxToggleActiveEffects', note: 'toggleSpec.activeEffects 数量上限' },
  ],
  effect: [
    { key: 'effect.topLevelTagsMax', value: 1, unit: 'tags', source: 'C# EffectTemplateLoader 顶层 tag 上限', note: 'Effect 模板最多一个顶层 tag' },
    { key: 'effect.modifiersCapacity', value: 8, unit: 'modifiers', source: 'C# GasConstants.EFFECT_MODIFIERS_CAPACITY', note: 'EffectTemplate modifiers 容器容量' },
    { key: 'effect.configParamsMax', value: 32, unit: 'params', source: 'C# GasConstants.EFFECT_CONFIG_PARAMS_MAX', note: 'configParams 键数量上限' },
    { key: 'effect.grantedTagsMax', value: 8, unit: 'tags', source: 'C# GasConstants.EFFECT_GRANTED_TAGS_MAX', note: 'grantedTags 容量' },
    { key: 'effect.phaseListenerCapacity', value: 8, unit: 'listeners', source: 'C# GasConstants.EFFECT_PHASE_LISTENER_CAPACITY', note: '单 Effect phaseListeners 容量' },
    { key: 'effect.activeEffectContainerCapacity', value: 32, unit: 'effects', source: 'C# GasConstants.ACTIVE_EFFECT_CONTAINER_CAPACITY', note: '单位活跃 Effect 容器容量' },
  ],
  graph: [
    { key: 'graph.idRegistryMaxGraphs', value: 4095, unit: 'graphs', source: 'C# GraphIdRegistry.MaxGraphs', note: '图程序注册上限；facts.md 生成正则误读 InvalidId=0，以源码为准' },
  ],
  tag: [
    { key: 'tag.registryMaxCoreTags', value: 256, unit: 'tags', source: 'C# TagRuleRegistry.MaxCoreTags', note: '核心 TagRule 注册总数上限' },
  ],
  attribute: [
    { key: 'attribute.registryMaxAttributes', value: 64, unit: 'attributes', source: 'C# AttributeRegistry.MaxAttributes', note: '属性注册总数上限' },
  ],
  order: [
    { key: 'order.queueCapacity', value: 4096, unit: 'orders', source: 'LudotsProd assets/game.json orderQueueCapacity', note: '订单队列容量基线' },
    { key: 'order.responseChainQueueCapacity', value: 4096, unit: 'orders', source: 'LudotsProd assets/game.json responseChainOrderQueueCapacity', note: '响应链订单队列容量基线' },
  ],
  mapBoard: [
    { key: 'mapBoard.macroTileCells', value: 256, unit: 'cells', source: 'C# MapTile.Size', note: '一个宏块（macro tile）的 cell 边长' },
    { key: 'mapBoard.defaultCellCm', value: 100, unit: 'cm', source: 'C# SpatialScaleDefaults.CellCm', note: '缺省空间 cell 尺寸' },
    { key: 'mapBoard.defaultMacroTilesX', value: 64, unit: '宏块', source: '编辑器 blankBoard 默认，对齐 game.json 世界宏格 64×64', note: '新建 Board 缺省宽' },
    { key: 'mapBoard.defaultMacroTilesY', value: 64, unit: '宏块', source: '编辑器 blankBoard 默认，对齐 game.json 世界宏格 64×64', note: '新建 Board 缺省高' },
    { key: 'mapBoard.defaultChunkSizeCells', value: 64, unit: 'cells', source: '编辑器 blankBoard 默认；C# 要求 2 的幂', note: '缺省空间分区块边长' },
    { key: 'mapBoard.defaultHexEdgeCm', value: 400, unit: 'cm', source: '编辑器 HexGrid 缺省边长', note: 'HexGrid Board 边长回退值' },
  ],
};

// 预留事实位：loader 侧统计（configCatalog 条目数 / 分片表清单等），
// 待 LudotsProd 文件桥（路线图第 1 步）接通后从 config_catalog.json 填充，先空数组占位。
export const RESERVED_FACT_SLOTS = {
  loader: {
    configCatalog: [],
  },
};

const FACT_INDEX = new Map(
  Object.values(EDITOR_FACTS).flat().map(fact => [fact.key, fact])
);

/** 按 key 取事实值；未知 key 直接抛错，不做任何回退。 */
export function factValue(key) {
  const fact = FACT_INDEX.get(key);
  if (!fact) throw new Error(`editorFacts: 未知事实 key '${key}'`);
  return fact.value;
}
