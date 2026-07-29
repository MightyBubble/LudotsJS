import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import useConstants from '@/lib/useConstants';

const q = (key, fn) => ({ queryKey: [key], queryFn: fn, initialData: [] });

/** 统一拉取核心能力系统所需的全部引用数据（复用现有实体，不新建平行系统） */
export default function useCoreRefs() {
  const { data: attributes } = useQuery(q('attributes', () => base44.entities.Attribute.list()));
  const { data: tags } = useQuery(q('gameplayTags', () => base44.entities.GameplayTag.list()));
  const { data: requirements } = useQuery(q('requirements', () => base44.entities.Requirement.list()));
  const { data: events } = useQuery(q('gameEvents', () => base44.entities.GameEvent.list()));
  const { data: prototypes } = useQuery(q('entityPrototypes', () => base44.entities.EntityPrototype.list()));
  const { data: entityQueries } = useQuery(q('entityQueries', () => base44.entities.EntityQuery.list()));
  const constants = useConstants();
  const { data: dataGraphs } = useQuery(q('dataGraphs', () => base44.entities.DataGraph.list()));
  const { data: effects } = useQuery(q('effects', () => base44.entities.Effect.list()));
  const { data: abilities } = useQuery(q('abilities', () => base44.entities.Ability.list()));
  const { data: triggers } = useQuery(q('triggerDefinitions', () => base44.entities.TriggerDefinition.list()));
  const { data: assets } = useQuery(q('assets', () => base44.entities.Asset.list()));
  const { data: actionGraphs } = useQuery(q('actionGraphs', () => base44.entities.ActionGraph.list()));

  return { attributes, tags, requirements, events, prototypes, entityQueries, constants, dataGraphs, effects, abilities, triggers, assets, actionGraphs };
}