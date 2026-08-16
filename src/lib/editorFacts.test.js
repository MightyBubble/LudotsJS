import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EDITOR_FACTS, RESERVED_FACT_SLOTS, factValue } from './editorFacts.js';

test('事实分组齐全且有序', () => {
  assert.deepEqual(Object.keys(EDITOR_FACTS), ['ability', 'effect', 'graph', 'tag', 'attribute', 'order', 'mapBoard']);
});

test('每条事实完整：key/value/source 必填，key 全局唯一，组内非空', () => {
  const seen = new Set();
  for (const [group, facts] of Object.entries(EDITOR_FACTS)) {
    assert.ok(Array.isArray(facts) && facts.length > 0, `组 ${group} 应为非空数组`);
    for (const fact of facts) {
      assert.equal(typeof fact.key, 'string', `${group} 组存在非字符串 key`);
      assert.ok(fact.key.length > 0, `${group} 组存在空 key`);
      assert.ok('value' in fact, `${fact.key} 缺 value`);
      assert.equal(typeof fact.source, 'string', `${fact.key} 缺字符串 source`);
      assert.ok(fact.source.length > 0, `${fact.key} source 为空`);
      assert.ok(!seen.has(fact.key), `key 重复：${fact.key}`);
      seen.add(fact.key);
    }
  }
});

test('loader 侧事实位为预留空数组', () => {
  assert.deepEqual(Object.keys(RESERVED_FACT_SLOTS), ['loader']);
  assert.deepEqual(RESERVED_FACT_SLOTS.loader.configCatalog, []);
});

test('关键数值快照：validation.js 迁移前上限保持不变', () => {
  assert.equal(factValue('ability.execItemsMax'), 16);
  assert.equal(factValue('ability.execCallerParamsMax'), 4);
  assert.equal(factValue('ability.onActivateEffectsMax'), 16);
  assert.equal(factValue('ability.toggleActiveEffectsMax'), 4);
  assert.equal(factValue('effect.topLevelTagsMax'), 1);
});

test('关键数值快照：棋盘容量与默认值保持不变', () => {
  assert.equal(factValue('mapBoard.macroTileCells'), 256);
  assert.equal(factValue('mapBoard.defaultCellCm'), 100);
  assert.equal(factValue('mapBoard.defaultMacroTilesX'), 64);
  assert.equal(factValue('mapBoard.defaultMacroTilesY'), 64);
  assert.equal(factValue('mapBoard.defaultChunkSizeCells'), 64);
  assert.equal(factValue('mapBoard.defaultHexEdgeCm'), 400);
});

test('引擎侧同源事实快照（LudotsProd facts.md / C# 源码）', () => {
  assert.equal(factValue('effect.modifiersCapacity'), 8);
  assert.equal(factValue('effect.configParamsMax'), 32);
  assert.equal(factValue('effect.grantedTagsMax'), 8);
  assert.equal(factValue('effect.phaseListenerCapacity'), 8);
  assert.equal(factValue('effect.activeEffectContainerCapacity'), 32);
  assert.equal(factValue('graph.idRegistryMaxGraphs'), 4095);
  assert.equal(factValue('tag.registryMaxCoreTags'), 256);
  assert.equal(factValue('attribute.registryMaxAttributes'), 64);
  assert.equal(factValue('order.queueCapacity'), 4096);
  assert.equal(factValue('order.responseChainQueueCapacity'), 4096);
});

test('factValue 对未知 key 直接抛错，不做回退', () => {
  assert.throws(() => factValue('nope.nope'), /未知事实 key/);
});
