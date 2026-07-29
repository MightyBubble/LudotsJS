// 资产库存储层 —— Utility 八件套（Agent/Decision/Consideration/Input/Normalization/TargetFilter/ActionTask）。
// Base44 实体需预注册 schema，新实体不可自动创建，故复用已注册的 UtilitySet 实体：
// 全套资产存为单条 blob（name='utility_assets_v2'），读=filter，写=update 整包。
// 种子：把引擎内置 UTILITY_SETS（content.js）一次性转换为八件套资产（纯内存、确定性 id）。
import { UTILITY_SETS } from '../world4x/content.js';

const BLOB_NAME = 'utility_assets_v2';
export const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const CURVE_NAME = { linear: 'Linear', exponential: 'Exponential', logistic: 'Logistic' };

// 内置过滤器：前三（any/enemy/ally）参与旧决策接线；后四对齐参考项目内置
const FILTER_DEFS = [
  { name: '任意目标', type: 'AnyFilter' },
  { name: '敌方', type: 'EnemyFilter' },
  { name: '友方', type: 'AllyFilter' },
  { name: 'Utility 代理', type: 'UtilityAgentFilter' },
  { name: '其他代理', type: 'OtherAgentFilter' },
  { name: '其他实体', type: 'OtherEntityFilter' },
  { name: '距离内', type: 'WithinDistanceFilter', max_distance: 10 },
];

// 内置选目标器（lab 引擎 selector 词汇：filters 硬门 + considerations 加权平均 ——
// 与 heal/atk 内联默认等价的命名资产版本；实验室/姿态候选/决策层均可按 {ref} 引用）
const SELECTOR_DEFS = [
  { name: '最近敌人', filters: [], considerations: [{ input: 'distance', curve: { type: 'inverse' }, weight: 1 }] },
  { name: '残血友军优先', filters: [{ type: 'hpBelow', ratio: 1 }], considerations: [{ input: 'hp', curve: { type: 'inverse' }, weight: 1 }] },
  { name: '斩杀优先', filters: [], considerations: [{ input: 'distance', curve: { type: 'inverse' }, weight: 0.2 }, { input: 'hp', curve: { type: 'inverse' }, weight: 0.8 }] },
];

/* 由 UTILITY_SETS 纯内存构建八件套种子（转换规则与旧版一致：
   set → Agent（compensation/momentum 随迁）· maker 随迁（decisions 存 id 列表）
   decision.command → ActionTask（category 内置，command 同名，挂 actions.action_list 首位）
   consideration 内联参数 → Input（按 source 去重）+ Normalization（按 type|min|max 去重）
   + Consideration（response_curve 为参考项目 snake_case）· selectors 区装内置选目标器 */
function buildSeedAssets() {
  let seq = 0;
  const nid = (p) => `${p}_${++seq}`;
  const assets = {
    agents: [], decisions: [], considerations: [], inputs: [],
    normalizations: [], filters: [], actionTasks: [], selectors: [],
  };
  for (const def of SELECTOR_DEFS) {
    assets.selectors.push({ id: nid('sel'), name: def.name, category: '内置', filters: def.filters, considerations: def.considerations });
  }
  const filterByKind = {};
  for (const def of FILTER_DEFS) {
    const f = { id: nid('filter'), ...def };
    if (def.type === 'AnyFilter') filterByKind.any = f;
    if (def.type === 'EnemyFilter') filterByKind.enemy = f;
    if (def.type === 'AllyFilter') filterByKind.ally = f;
    assets.filters.push(f);
  }
  const inputBySource = {};
  const normByKey = {};
  const taskByCommand = {};

  for (const setDef of Object.values(UTILITY_SETS)) {
    const makers = [];
    for (const m of setDef.makers || []) {
      const decisionIds = [];
      for (const d of m.decisions || []) {
        const consIds = [];
        for (const c of d.considerations || []) {
          let input = inputBySource[c.source];
          if (!input) {
            input = { id: nid('input'), name: c.source, source: c.source };
            inputBySource[c.source] = input;
            assets.inputs.push(input);
          }
          const nt = c.norm?.type || 'range';
          const nk = `${nt}|${c.norm?.min ?? 0}|${c.norm?.max ?? 100}`;
          let norm = normByKey[nk];
          if (!norm) {
            norm = {
              id: nid('norm'), name: `${nt} ${c.norm?.min ?? 0}~${c.norm?.max ?? 100}`,
              type: nt, min_value: c.norm?.min ?? 0, max_value: c.norm?.max ?? 100,
            };
            normByKey[nk] = norm;
            assets.normalizations.push(norm);
          }
          const cons = {
            id: nid('cons'),
            name: c.name || c.source,
            has_no_target: false,
            input_id: input.id,
            input_normalization_id: norm.id,
            response_curve: {
              type: CURVE_NAME[c.curve?.type] || 'Logistic',
              slope: c.curve?.slope ?? -1,
              exponent: c.curve?.exponent ?? 1,
              x_shift: c.curve?.xShift ?? 0,
              y_shift: c.curve?.yShift ?? 1,
            },
          };
          assets.considerations.push(cons);
          consIds.push(cons.id);
        }
        const actionIds = [];
        if (d.command?.name) {
          let task = taskByCommand[d.command.name];
          if (!task) {
            task = { id: nid('task'), name: d.command.name, category: '内置', command: d.command.name };
            taskByCommand[d.command.name] = task;
            assets.actionTasks.push(task);
          }
          actionIds.push(task.id);
        }
        const dec = {
          id: nid('dec'),
          name: d.name,
          weight: d.weight ?? 1,
          has_no_target: !!d.noTarget,
          enable_cache_per_target: false,
          target_filters: d.noTarget ? [] : [filterByKind[d.targetFilter || 'any'].id],
          considerations: consIds,
          actions: {
            execution_mode: 'Sequence',
            keep_running_until_finished: false,
            max_repeat_count: 1,
            action_list: actionIds,
          },
        };
        assets.decisions.push(dec);
        decisionIds.push(dec.id);
      }
      makers.push({ id: m.id || m.name, name: m.name, decisions: decisionIds });
    }
    assets.agents.push({
      id: nid('agent'),
      name: setDef.name,
      compensation_factor: setDef.compensation !== false,
      compensation_method: setDef.compensation !== false ? 'factor' : 'none',
      momentum_bonus: setDef.momentum ?? 1.1,
      makers,
    });
  }
  return assets;
}

// 旧 blob 迁移：补 compensation_method / momentum / 内置过滤器缺件；有改动返回新数据，否则 null
function migrateAssets(data) {
  let changed = false;
  const agents = (data.agents || []).map((a) => {
    const patch = {};
    if (!a.compensation_method) { patch.compensation_method = a.compensation_factor !== false ? 'factor' : 'none'; }
    if (a.momentum_bonus == null) patch.momentum_bonus = 1.1;
    if (Object.keys(patch).length) { changed = true; return { ...a, ...patch }; }
    return a;
  });
  const filters = [...(data.filters || [])];
  for (const def of FILTER_DEFS) {
    if (!filters.some((f) => f.type === def.type)) {
      changed = true;
      filters.push({ id: uid('filter'), ...def });
    }
  }
  const selectors = [...(data.selectors || [])];
  for (const def of SELECTOR_DEFS) {
    if (!selectors.some((s) => s.name === def.name)) {
      changed = true;
      selectors.push({ id: uid('sel'), name: def.name, category: '内置', filters: def.filters, considerations: def.considerations });
    }
  }
  if (!changed) return null;
  return { ...data, agents, filters, selectors };
}

// 加载全套资产（Intelligence 页与资产页共用）；blob 不存在时种子化并落库
export async function loadUtilityAssets(base44) {
  const rows = await base44.entities.UtilitySet.filter({ name: BLOB_NAME });
  const row = rows?.[0];
  if (row?.data?.agents) {
    const migrated = migrateAssets(row.data);
    if (migrated) await base44.entities.UtilitySet.update(row.id, { data: migrated });
    return { recordId: row.id, assets: migrated || row.data };
  }
  const assets = buildSeedAssets();
  if (row) {
    await base44.entities.UtilitySet.update(row.id, { data: assets });
    return { recordId: row.id, assets };
  }
  const created = await base44.entities.UtilitySet.create({ name: BLOB_NAME, data: assets });
  return { recordId: created.id, assets };
}

// 整包写回（各资产页在本地改完集合后一次性持久化）
export async function saveUtilityAssets(base44, recordId, assets) {
  await base44.entities.UtilitySet.update(recordId, { data: assets });
}

// selector 资产索引：byId + byName 双键（引擎 {ref} 经 resolveSelector 在此表解析）
export function selectorAssetIndex(assets) {
  const idx = {};
  for (const s of assets?.selectors || []) {
    idx[s.id] = s;
    if (s.name) idx[s.name] = s;
  }
  return idx;
}
