// BT and FSM executors — consume shared TaskNode "services".
// Actions use BEHAVIORS[behavior_key].execute().
// Conditions use evaluateCondition(agent, config, nodeId) — data-driven.
import { BEHAVIORS, evaluateCondition } from './simBehaviors';

// ── Behavior Tree Executor ──
// Returns 'success' | 'failure' | 'running'
export function executeBT(rootNode, nodes, taskNodeMap, agent, dt) {
  function execute(node) {
    if (!node) return 'failure';
    switch (node.type) {
      case 'root':
      case 'sequence': {
        for (const childId of node.children || []) {
          const child = nodes.find((n) => n.id === childId);
          const result = execute(child);
          if (result !== 'success') return result;
        }
        return 'success';
      }
      case 'selector': {
        for (const childId of node.children || []) {
          const child = nodes.find((n) => n.id === childId);
          const result = execute(child);
          if (result !== 'failure') return result;
        }
        return 'failure';
      }
      case 'action': {
        const tn = taskNodeMap[node.task_node_id];
        if (!tn) return 'failure';
        const beh = BEHAVIORS[tn.behavior_key];
        return beh ? beh.execute(agent, dt) : 'failure';
      }
      case 'condition': {
        const tn = taskNodeMap[node.task_node_id];
        if (!tn) return 'failure';
        return evaluateCondition(agent, tn.config, tn.id) ? 'success' : 'failure';
      }
      default:
        return 'failure';
    }
  }
  return execute(rootNode);
}

// ── FSM Executor ──
export function executeFSM(fsmData, taskNodeMap, agent, dt) {
  const states = fsmData.states || [];
  const transitions = fsmData.transitions || [];

  let current = states.find((s) => s.id === agent.fsmState);
  if (!current) {
    current = states.find((s) => s.is_initial) || states[0];
    if (current) agent.fsmState = current.id;
  }
  if (!current) return;

  // Execute the state's action service
  if (current.action_id) {
    const tn = taskNodeMap[current.action_id];
    if (tn && BEHAVIORS[tn.behavior_key]) {
      BEHAVIORS[tn.behavior_key].execute(agent, dt);
    } else {
      agent.label = current.name;
    }
  } else {
    agent.label = current.name;
  }

  // Evaluate transitions (data-driven conditions)
  for (const trans of transitions) {
    if (trans.from !== current.id) continue;
    const cids = trans.condition_ids || [];
    const allMet =
      cids.length === 0 ||
      cids.every((cid) => {
        const tn = taskNodeMap[cid];
        if (!tn) return false;
        return evaluateCondition(agent, tn.config, tn.id);
      });
    if (allMet) {
      agent.fsmState = trans.to;
      return;
    }
  }
}

// Build a lookup map from an array of TaskNodes
export function buildTaskNodeMap(taskNodes) {
  const map = {};
  for (const tn of taskNodes) map[tn.id] = tn;
  return map;
}