import { inputEditorExamples } from '@/components/input/contract/inputEditorExamples';

const MODES = ['TargetFirst','SmartCast','AimCast','SmartCastWithIndicator','ContextScored','PressReleaseAimCast'];
const TARGETS = ['None','Position','Entity','Entities','Direction','Vector','HoveredEntityOrPosition'];
const autoTargets = ['None','NearestInRange','NearestEnemyInRange'];
const tagList = (key, label) => ({ key, label, type:'tagList', wide:true });
const text = (key, label, wide=false) => ({ key, label, type:'text', wide });
const number = (key, label) => ({ key, label, type:'number' });
const select = (key, label, options) => ({ key, label, type:'select', options });
const object = (key, label, fields, wide=true, defaultValue={}) => ({ key, label, type:'object', fields, wide, default:defaultValue });
const array = (key, label, fields, itemDefault, itemLabel) => ({ key, label, type:'array', fields, itemDefault, itemLabel, wide:true });
const operationFields = [select('op','Op',['pushFrame','popFrame','submitOrder']),text('contextProfileId','Context Profile ID'),{key:'payload',label:'Payload（Order arg → cursorWorld / framePointer）',type:'map',valueType:'text',wide:true}];

export const controlSchemeSpec = {
  entity:'ControlScheme', queryKey:'control-schemes', title:'Control Scheme', idKey:'scheme_id', idLabel:'Scheme ID', example:inputEditorExamples.ControlScheme,
  buildNew:()=>({scheme_id:`ControlScheme.${Date.now()}`,inputContexts:[],defaults:{commandIntentId:'',castDispatchProfileId:''},axisMove:{actionId:'',orderTypeKey:'',throttleTicks:0,stepDistanceCm:0}}),
  fields:[text('scheme_id','Scheme ID'),{key:'inputContexts',label:'Input Context IDs',type:'list',wide:true},object('defaults','Defaults',[text('commandIntentId','Command Intent ID'),text('castDispatchProfileId','Cast Dispatch Profile ID')]),object('axisMove','Axis Move',[text('actionId','Action ID'),text('orderTypeKey','Order Type Key'),number('throttleTicks','Throttle Ticks'),number('stepDistanceCm','Step Distance Cm')])]
};

const ruleFields = [number('priority','Priority'),object('actor','Actor Predicate',[{key:'hasAbilityWithTag',label:'Has Ability With Tag',type:'tag'},tagList('allTags','All Tags'),tagList('anyTags','Any Tags')]),object('target','Target Predicate',[tagList('allTags','All Tags'),tagList('anyTags','Any Tags'),{key:'stance',label:'Stance',type:'list',wide:true},{key:'hasEntity',label:'Has Entity',type:'nullableBoolean'}]),object('route','Route',[text('orderTypeKey','Order Type Key'),text('slot','Slot（byAbilityTag: / contextGroup:）')])];
export const commandIntentSpec = {
  entity:'CommandIntentProfile', queryKey:'command-intent-profiles', title:'Command Intent', idKey:'profile_id', idLabel:'Profile ID', example:inputEditorExamples.CommandIntentProfile,
  buildNew:()=>({profile_id:`CommandIntent.${Date.now()}`,groupPolicy:{kind:'independent'},rules:[]}),
  fields:[text('profile_id','Profile ID'),object('groupPolicy','Group Policy',[select('kind','Kind',['independent'])]),array('rules','Rules',ruleFields,{priority:0,actor:{allTags:[],anyTags:[]},target:{allTags:[],anyTags:[],stance:[],hasEntity:null},route:{orderTypeKey:'',slot:''}},'Rule')]
};

const candidateFields=[text('orderTypeKey','Order Type Key'),number('priority','Priority'),select('targetType','Target Type',TARGETS),object('match','Match',[tagList('requiredAllTags','Required All Tags'),tagList('blockedAnyTags','Blocked Any Tags'),number('abilitySlotIndex','Ability Slot Index'),text('abilityIdKey','Ability ID Key'),text('abilityIdKeySuffix','Ability ID Key Suffix')])];
const mappingFields=[text('actionId','Action ID'),select('trigger','Trigger',['PressedThisFrame','ReleasedThisFrame','Held','DoubleTap']),number('doubleTapWindowSeconds','Double Tap Window Seconds'),text('orderTypeKey','Order Type Key'),object('actorOrderRouting','Actor Order Routing',[array('candidates','Candidates',candidateFields,{orderTypeKey:'',priority:0,match:{requiredAllTags:[],blockedAnyTags:[]},targetType:'None'},'Candidate')]),object('argsTemplate','Args Template',['i0','i1','i2','i3','f0','f1','f2','f3'].map(k=>number(k,k.toUpperCase()))),{key:'requireTarget',label:'Require Target',type:'boolean'},text('actorCollectionKey','Actor Collection Key'),text('targetCollectionKey','Target Collection Key'),select('targetType','Target Type',TARGETS),select('modifierBehavior','Modifier Behavior',['IgnoreModifier','QueueOnModifier','AlwaysImmediate','AlwaysQueued']),{key:'isSkillMapping',label:'Is Skill Mapping',type:'boolean'},select('heldPolicy','Held Policy',['EveryFrame','StartEnd']),select('castModeOverride','Cast Mode Override',MODES),select('autoTargetPolicy','Auto Target Policy',autoTargets),number('autoTargetRangeCm','Auto Target Range Cm'),select('cursorTargetPolicy','Cursor Target Policy',autoTargets),number('cursorTargetRangeCm','Cursor Target Range Cm')];
export const inputOrderSpec = {
  entity:'InputOrderConfig', queryKey:'input-order-configs', title:'Input Order Mapping', idKey:'config_id', idLabel:'Config ID', example:inputEditorExamples.InputOrderConfig,
  buildNew:()=>({config_id:`InputOrder.${Date.now()}`,interactionMode:'TargetFirst',mappings:[],groupMoveTargetLayout:{mode:'None',spacingCm:120,orderTypeKeys:[]},userOverrides:{enabled:true,persistPath:'user://input_preferences.json'}}),
  fields:[text('config_id','Config ID'),select('interactionMode','Interaction Mode',MODES),array('mappings','Mappings',mappingFields,{actionId:'',trigger:'PressedThisFrame',doubleTapWindowSeconds:.3,orderTypeKey:'',actorOrderRouting:{candidates:[]},argsTemplate:{},requireTarget:false,actorCollectionKey:'',targetCollectionKey:'',targetType:'None',modifierBehavior:'QueueOnModifier',isSkillMapping:false,heldPolicy:'EveryFrame',castModeOverride:'TargetFirst',autoTargetPolicy:'None',autoTargetRangeCm:0,cursorTargetPolicy:'None',cursorTargetRangeCm:0},'Mapping'),object('groupMoveTargetLayout','Group Move Target Layout',[select('mode','Mode',['None','Grid']),number('spacingCm','Spacing Cm'),{key:'orderTypeKeys',label:'Order Type Keys',type:'list',wide:true}]),object('userOverrides','User Overrides',[{key:'enabled',label:'Enabled',type:'boolean'},text('persistPath','Persist Path')])]
};

export const castCommitSpec = {
  entity:'CastCommitProfile', queryKey:'cast-commit-profiles', title:'Cast Commit', idKey:'profile_id', idLabel:'Profile ID', example:inputEditorExamples.CastCommitProfile,
  buildNew:()=>({profile_id:`CastCommit.${Date.now()}`,onActivate:[],frameActions:{}}),
  fields:[text('profile_id','Profile ID'),array('onActivate','On Activate',operationFields,{op:'submitOrder',payload:{},contextProfileId:''},'Operation'),{key:'frameActions',label:'Frame Actions（Input Action → Operations）',type:'map',valueType:'array',fields:operationFields,itemDefault:{op:'submitOrder',payload:{},contextProfileId:''},itemLabel:'Operation',wide:true,keyPlaceholder:'InputAction'}]
};

export const castDispatchSpec = {
  entity:'CastDispatchProfile', queryKey:'cast-dispatch-profiles', title:'Cast Dispatch', idKey:'profile_id', idLabel:'Profile ID', example:inputEditorExamples.CastDispatchProfile,
  buildNew:()=>({profile_id:`CastDispatch.${Date.now()}`,selector:{kind:'all',n:null,advanceOn:''},scorer:{kind:'utility',considerations:[]},router:{kind:'parallel',sharedOrderId:true}}),
  fields:[text('profile_id','Profile ID'),object('selector','Selector',[select('kind','Kind',['all','topN','cycle']),number('n','N'),text('advanceOn','Advance On')]),object('scorer','Scorer',[select('kind','Kind',['utility']),{key:'considerations',label:'Considerations（distanceToTarget[:modifier]）',type:'list',wide:true}]),object('router','Router',[select('kind','Kind',['parallel','sequential']),{key:'sharedOrderId',label:'Shared Order ID',type:'nullableBoolean'}])]
};