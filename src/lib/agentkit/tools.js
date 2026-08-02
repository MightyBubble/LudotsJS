import { base44 } from '@/api/base44Client';

// 极简 agent 工具集：只读，供讨论型 agent 自行取证
export const AGENT_ENTITIES = [
  'CommandPanelProfile', 'EntityCollection', 'ControlPlaneProfile', 'AbilitySemanticProfile',
  'EntityPrototype', 'Ability', 'InputConfig', 'InputOrderConfig', 'CommandIntentProfile',
  'CastDispatchProfile', 'CastCommitProfile', 'EntityQuery', 'GameplayTag', 'Attribute', 'Effect',
];

export const AGENT_TOOLS = {
  list_entities: {
    description: '列出可查询的配置实体名称。无参数。',
    run: async () => AGENT_ENTITIES,
  },
  entity_schema: {
    description: '读取某个配置实体的字段结构。参数：{ "entity": "实体名" }',
    run: async ({ entity }) => {
      if (!AGENT_ENTITIES.includes(entity)) throw new Error(`未知实体 ${entity}`);
      return await base44.entities[entity].schema();
    },
  },
  read_records: {
    description: '读取配置记录。参数：{ "entity": "实体名", "query": {可选筛选}, "limit": 可选(默认20) }',
    run: async ({ entity, query, limit }) => {
      if (!AGENT_ENTITIES.includes(entity)) throw new Error(`未知实体 ${entity}`);
      const n = Math.min(Number(limit) || 20, 50);
      const rows = query && Object.keys(query).length
        ? await base44.entities[entity].filter(query, '-updated_date', n)
        : await base44.entities[entity].list('-updated_date', n);
      return { count: rows.length, records: rows };
    },
  },
  count_records: {
    description: '统计某实体的记录数量。参数：{ "entity": "实体名", "query": {可选筛选} }',
    run: async ({ entity, query }) => {
      if (!AGENT_ENTITIES.includes(entity)) throw new Error(`未知实体 ${entity}`);
      const rows = query && Object.keys(query).length
        ? await base44.entities[entity].filter(query, '-updated_date', 500)
        : await base44.entities[entity].list('-updated_date', 500);
      return { count: rows.length };
    },
  },
};

export const toolManual = () =>
  Object.entries(AGENT_TOOLS).map(([name, t]) => `- ${name}: ${t.description}`).join('\n');