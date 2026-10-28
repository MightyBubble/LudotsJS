import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  RUNTIME_STATE_TYPES,
  SPECIAL_STATE_TYPES,
  STATE_COLORS,
  STATE_TYPES,
  makeAuthoringState,
  makeAuthoringTransition,
  normalizeAuthoringState,
  toNumber,
  transitionConditionLabel,
} from './animatorControllerModel';

function AnimatorStateNode({ data, selected }) {
  const { state, isDefault, outgoingCount, isPlaying, isActiveRuntime, readOnly, onRename, onDelete, onOpenNested } = data;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.name);
  const special = SPECIAL_STATE_TYPES.has(state.type);
  const color = state.color || STATE_COLORS[state.type] || STATE_COLORS.Normal;

  useEffect(() => setName(state.name), [state.name]);

  const commit = () => {
    setEditing(false);
    const next = name.trim();
    if (next && next !== state.name) onRename(next);
    else setName(state.name);
  };

  return (
    <div
      className={`relative w-[176px] border bg-[#15171C] shadow-sm transition ${isActiveRuntime ? 'animator-state-active border-emerald-400' : selected ? 'border-[#E2D8B3] ring-1 ring-[#E2D8B3]' : 'border-[#424a55] hover:border-[#6f7a86]'}`}
      onDoubleClick={() => {
        if (readOnly) return;
        if (state.type === 'BlendTree' || state.type === 'SubStateMachine') onOpenNested();
        else if (!special) setEditing(true);
      }}
    >
      <div className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: color }} />
      {state.type !== 'Entry' && state.type !== 'AnyState' && (
        <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-white !bg-[#748093]" />
      )}
      {state.type !== 'Exit' && (
        <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-white !bg-[#748093]" />
      )}
      <div className="flex flex-col gap-1.5 py-3 pl-4 pr-3">
        <div className="flex items-start gap-2">
          {state.type === 'SubStateMachine' && <FolderOpen className="mt-0.5 h-3.5 w-3.5 text-[#E2D8B3]" />}
          {editing ? (
            <Input
              value={name}
              autoFocus
              onChange={event => setName(event.target.value)}
              onBlur={commit}
              onKeyDown={event => {
                if (event.key === 'Enter') commit();
                if (event.key === 'Escape') {
                  setEditing(false);
                  setName(state.name);
                }
              }}
              className="nodrag h-7 flex-1 border-[#E2D8B3] bg-[#0D0F14] text-xs"
            />
          ) : (
            <div className="min-w-0 flex-1 truncate text-sm font-semibold text-[#dce2e8]">{state.name}</div>
          )}
          {!special && !readOnly && (
            <button type="button" className="nodrag text-gray-500 hover:text-red-400" onClick={event => { event.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-[10px]">{state.type}</Badge>
          {isDefault && <Badge className="h-5 rounded-sm bg-[#E2D8B3] px-1.5 text-[10px] text-[#15171C]">Default</Badge>}
          {(isActiveRuntime || (isPlaying && selected)) && <Badge className="h-5 rounded-sm bg-emerald-600 px-1.5 text-[10px]">Playing</Badge>}
        </div>
        {state.type === 'Normal' && (
          <div className="truncate font-mono text-[10px] text-gray-500">{state.animation_clip_asset_id || 'no clip'}</div>
        )}
        {RUNTIME_STATE_TYPES.has(state.type) && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>packed {state.packed_state_index}</span>
            <span>{state.playback_speed}x</span>
            <span className="ml-auto">{outgoingCount} out</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TransitionEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected, data }) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const isActive = data?.isActive;
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        className={isActive ? 'animator-transition-active' : ''}
        style={{
          stroke: isActive ? '#34d399' : selected ? '#E2D8B3' : 'rgba(130, 145, 165, 0.55)',
          strokeWidth: isActive || selected ? 2.5 : 1.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`flex h-6 min-w-6 items-center justify-center border px-1.5 text-[10px] font-semibold ${isActive ? 'border-emerald-400 bg-emerald-950 text-emerald-200' : selected ? 'border-[#E2D8B3] bg-[#242a32] text-[#E2D8B3]' : 'border-[#424a55] bg-[#15171C] text-gray-400'}`}
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { animatorState: AnimatorStateNode };
const edgeTypes = { transition: TransitionEdge };

function CanvasContextMenu({ menu, onClose, onAddState, onDeleteState }) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [onClose]);

  return (
    <div className="fixed border border-[#424a55] bg-[#15171C] p-1 shadow-lg" style={{ left: menu.x, top: menu.y, zIndex: 50 }}>
      {menu.stateId ? (
        <button type="button" onClick={onDeleteState} className="flex w-48 items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-[#242a32]">
          <Trash2 className="h-3.5 w-3.5" />
          Delete State
        </button>
      ) : (
        STATE_TYPES.map(type => (
          <button key={type} type="button" onClick={() => onAddState(type)} className="flex w-48 items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-[#242a32]">
            <Plus className="h-3.5 w-3.5" />
            {type}
          </button>
        ))
      )}
    </div>
  );
}

function StateFlowCanvasInner({
  layer,
  defaultStateId,
  selectedStateId,
  selectedTransitionId,
  onSelectState,
  onSelectTransition,
  onUpdateLayer,
  onOpenNested,
  isPlaying,
  activeStateId,
  activeTransitionId,
  readOnly = false,
  compact = false,
}) {
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [menu, setMenu] = useState(null);
  const states = layer?.states || [];
  const transitions = layer?.transitions || [];

  const updateState = useCallback((stateId, updates) => {
    if (readOnly) return;
    onUpdateLayer({
      ...layer,
      states: states.map(state => state.id === stateId ? normalizeAuthoringState({ ...state, ...updates }, 0) : state),
    });
  }, [layer, onUpdateLayer, readOnly, states]);

  const deleteState = useCallback((stateId) => {
    if (readOnly) return;
    const state = states.find(item => item.id === stateId);
    if (!state || SPECIAL_STATE_TYPES.has(state.type)) return;
    onUpdateLayer({
      ...layer,
      states: states.filter(item => item.id !== stateId).map(item => item.excluded_state_ids?.includes(stateId)
        ? { ...item, excluded_state_ids: item.excluded_state_ids.filter(id => id !== stateId) }
        : item),
      transitions: transitions.filter(transition => transition.from_state_id !== stateId && transition.to_state_id !== stateId),
      default_state_id: layer.default_state_id === stateId ? '' : layer.default_state_id,
    });
    if (selectedStateId === stateId) onSelectState(null);
  }, [layer, onSelectState, onUpdateLayer, readOnly, selectedStateId, states, transitions]);

  const deleteTransition = useCallback((transitionId) => {
    if (readOnly) return;
    onUpdateLayer({
      ...layer,
      transitions: transitions.filter(transition => transition.id !== transitionId),
    });
    if (selectedTransitionId === transitionId) onSelectTransition(null);
  }, [layer, onSelectTransition, onUpdateLayer, readOnly, selectedTransitionId, transitions]);

  useEffect(() => {
    setNodes(states.map(state => ({
      id: state.id,
      type: 'animatorState',
      position: state.position || { x: 0, y: 0 },
      selected: selectedStateId === state.id,
      draggable: !readOnly,
      data: {
        state,
        isDefault: defaultStateId === state.id,
        outgoingCount: transitions.filter(transition => transition.from_state_id === state.id).length,
        isPlaying,
        isActiveRuntime: isPlaying && activeStateId === state.id,
        readOnly,
        onRename: name => updateState(state.id, { name }),
        onDelete: () => deleteState(state.id),
        onOpenNested: () => onOpenNested(state.id),
      },
    })));
  }, [activeStateId, defaultStateId, deleteState, isPlaying, onOpenNested, readOnly, selectedStateId, states, transitions, updateState]);

  const edges = useMemo(() => transitions.map(transition => {
    const isActive = isPlaying && activeTransitionId === transition.id;
    return {
      id: transition.id,
      source: transition.from_state_id,
      target: transition.to_state_id,
      type: 'transition',
      selected: transition.id === selectedTransitionId,
      markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? '#34d399' : transition.id === selectedTransitionId ? '#E2D8B3' : '#7b8798' },
      data: { label: transitionConditionLabel(transition), isActive },
    };
  }), [activeTransitionId, isPlaying, selectedTransitionId, transitions]);

  const onNodesChange = useCallback(changes => setNodes(current => applyNodeChanges(changes, current)), []);

  const onNodeDragStop = useCallback((_event, _node, draggedNodes) => {
    if (readOnly) return;
    const moved = new Map((draggedNodes || []).map(node => [node.id, node.position]));
    if (moved.size === 0) return;
    onUpdateLayer({
      ...layer,
      states: states.map(state => moved.has(state.id) ? { ...state, position: moved.get(state.id) } : state),
    });
  }, [layer, onUpdateLayer, readOnly, states]);

  const addState = (type) => {
    if (!menu || readOnly) return;
    const position = screenToFlowPosition({ x: menu.x, y: menu.y });
    const nextPacked = states
      .filter(state => RUNTIME_STATE_TYPES.has(state.type))
      .reduce((max, state) => Math.max(max, toNumber(state.packed_state_index, -1)), -1) + 1;
    const nextState = makeAuthoringState(type, position, nextPacked);
    onUpdateLayer({
      ...layer,
      states: [...states, nextState],
      default_state_id: layer.default_state_id || nextState.id,
    });
    onSelectState(nextState.id);
    onSelectTransition(null);
    setMenu(null);
  };

  return (
    <div className={`relative flex-1 bg-[#0D0F14] ${compact ? 'min-h-[360px]' : 'min-h-[560px]'}`} style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        onConnect={connection => {
          if (readOnly || !connection.source || !connection.target || connection.source === connection.target) return;
          const exists = transitions.some(transition => transition.from_state_id === connection.source && transition.to_state_id === connection.target);
          if (exists) return;
          const nextTransition = makeAuthoringTransition(connection.source, connection.target);
          onUpdateLayer({ ...layer, transitions: [...transitions, nextTransition] });
          onSelectTransition(nextTransition.id);
          onSelectState(null);
        }}
        onNodeClick={(_event, node) => {
          onSelectState(node.id);
          onSelectTransition(null);
        }}
        onEdgeClick={(_event, edge) => {
          onSelectTransition(edge.id);
          onSelectState(null);
        }}
        onPaneClick={() => {
          if (!readOnly) {
            onSelectState(null);
            onSelectTransition(null);
          }
          setMenu(null);
        }}
        onPaneContextMenu={event => {
          if (readOnly) return;
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
        onNodeContextMenu={(event, node) => {
          if (readOnly) return;
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY, stateId: node.id });
        }}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        onNodesDelete={deleted => deleted.forEach(node => deleteState(node.id))}
        onEdgesDelete={deleted => deleted.forEach(edge => deleteTransition(edge.id))}
        fitView
        fitViewOptions={{ padding: 0.2, minZoom: 0.4, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        style={{ height: '100%', width: '100%' }}
      >
        <Background color="rgba(125, 138, 158, 0.34)" variant={BackgroundVariant.Dots} gap={22} size={1.2} />
        <Controls className="!border-[#424a55] !bg-[#15171C] [&>button]:!border-[#424a55] [&>button]:!bg-[#15171C] [&>button]:!text-gray-300" showInteractive={false} />
        {!compact && <MiniMap pannable nodeColor={node => STATE_COLORS[node.data?.state?.type] || STATE_COLORS.Normal} maskColor="rgba(13, 15, 20, 0.68)" className="!border !border-[#424a55] !bg-[#15171C]" />}
      </ReactFlow>
      {menu && !readOnly && (
        <CanvasContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onAddState={addState}
          onDeleteState={() => {
            deleteState(menu.stateId);
            setMenu(null);
          }}
        />
      )}
    </div>
  );
}

export function StateFlowCanvas(props) {
  return (
    <ReactFlowProvider>
      <StateFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}