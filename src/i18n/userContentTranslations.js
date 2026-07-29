import { base44 } from '@/api/base44Client';

export const getUserContentTranslations = (entityName, recordId) =>
  base44.entities.UserContentTranslation.filter({ entity_name: entityName, record_id: recordId });

export async function saveUserContentTranslation(identity, locale, value) {
  const query = { ...identity, locale };
  const existing = await base44.entities.UserContentTranslation.filter(query);
  if (existing[0]) return base44.entities.UserContentTranslation.update(existing[0].id, { value });
  return base44.entities.UserContentTranslation.create({ ...query, value });
}