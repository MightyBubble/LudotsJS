export const EFFECT_PRESET_TYPES = [
  'None',
  'ApplyForce2D',
  'InstantDamage',
  'DoT',
  'Heal',
  'HoT',
  'Buff',
  'Search',
  'PeriodicSearch',
  'LaunchProjectile',
  'CreateUnit',
  'Displacement',
  'Relation',
  'Exchange',
  'CompleteProgression',
  'SubmitOrderFromBlackboard',
  'DeployConsumeSource',
  'RevealArea',
];

export const EFFECT_PRESET_OPTIONS = EFFECT_PRESET_TYPES.map(value => ({ value, label: value }));