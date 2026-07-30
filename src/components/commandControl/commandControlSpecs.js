const text = (key, label, wide = false) => ({ key, label, type: 'text', wide });
const select = (key, label, options) => ({ key, label, type: 'select', options });
const object = (key, label, fields) => ({ key, label, type: 'object', fields, wide: true, default: {} });
const array = (key, label, fields, itemDefault, itemLabel) => ({ key, label, type: 'array', fields, itemDefault, itemLabel, wide: true });

const bindingFields = [
  text('actionId', 'Action ID'),
  select('trigger', 'Trigger', ['PressedThisFrame', 'ReleasedThisFrame', 'Held', 'DoubleTap']),
  text('intentId', 'Command Intent ID'),
  { key: 'enabled', label: 'Enabled', type: 'boolean' },
];

export const inputBindingSpec = {
  entity: 'InputBindingProfile', queryKey: 'input-binding-profiles', title: '输入绑定', idKey: 'profile_id', idLabel: 'Profile ID',
  buildNew: () => ({ profile_id: `InputBinding.${Date.now()}`, name: '新输入绑定', inputContextId: '', bindings: [] }),
  fields: [text('profile_id', 'Profile ID'), text('name', 'Name'), text('inputContextId', 'Input Context ID'), array('bindings', 'Bindings', bindingFields, { actionId: '', trigger: 'PressedThisFrame', intentId: '', enabled: true }, 'Binding')],
};

const projectionFields = [
  text('collectionKey', 'Actor Collection Key'),
  select('access', 'Access', ['FullyControlled', 'DirectGrant']),
  { key: 'includeAnchor', label: 'Include Anchor', type: 'boolean' },
  select('primaryPolicy', 'Primary Policy', ['FirstMember', 'Anchor']),
];

export const controlPlaneSpec = {
  entity: 'ControlPlaneProfile', queryKey: 'control-plane-profiles', title: '控制平面', idKey: 'profile_id', idLabel: 'Profile ID',
  buildNew: () => ({ profile_id: `ControlPlane.${Date.now()}`, name: '新控制平面', anchor: { kind: 'LocalAvatar', contextKey: '' }, controlRelations: ['Controls'], projections: [] }),
  fields: [text('profile_id', 'Profile ID'), text('name', 'Name'), object('anchor', 'Control Anchor', [select('kind', 'Kind', ['LocalAvatar', 'ContextEntity']), text('contextKey', 'Context Key')]), { key: 'controlRelations', label: 'Control Relations', type: 'list', wide: true }, array('projections', 'Actor Collection Projections', projectionFields, { collectionKey: 'collection.command.source', access: 'FullyControlled', includeAnchor: false, primaryPolicy: 'FirstMember' }, 'Projection')],
};