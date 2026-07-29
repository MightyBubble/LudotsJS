import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TimelineView from "../components/editor/TimelineView";
import NodeEditor from "../components/editor/NodeEditor";
import Toolbar from "../components/editor/Toolbar";
import GlobalBlackboard from "../components/editor/GlobalBlackboard";

export default function EditorPage() {
  const queryClient = useQueryClient();
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentAbilityId, setCurrentAbilityId] = useState(null);
  const [showAbilityDialog, setShowAbilityDialog] = useState(false);
  const [newAbilityName, setNewAbilityName] = useState("");
  
  // Breadcrumbs state: array of { id, name }
  // Empty array means root level
  const [scopeStack, setScopeStack] = useState([]);

  const [globalBlackboard, setGlobalBlackboard] = useState({
    Caster: { type: 'actor', value: null },
    Target: { type: 'actor', value: null },
    CasterPos: { type: 'vector', value: { x: 0, y: 0, z: 0 } },
    TargetPos: { type: 'vector', value: { x: 0, y: 0, z: 0 } }
  });

  // Fetch Abilities
  const { data: abilities, isLoading: isLoadingAbilities } = useQuery({
    queryKey: ['abilities'],
    queryFn: () => base44.entities.Ability.list(),
    initialData: [],
  });

  // Select first ability by default if none selected
  useEffect(() => {
    if (!currentAbilityId && abilities.length > 0) {
      setCurrentAbilityId(abilities[0].id);
    } else if (!currentAbilityId && abilities.length === 0 && !isLoadingAbilities) {
      // No abilities exist, maybe prompt to create one
      setShowAbilityDialog(true);
    }
  }, [abilities, currentAbilityId, isLoadingAbilities]);

  // Fetch Nodes for current Ability
  const { data: dbNodes, isLoading } = useQuery({
    queryKey: ['nodes', currentAbilityId],
    queryFn: () => currentAbilityId ? base44.entities.Node.filter({ ability_id: currentAbilityId }) : [],
    enabled: !!currentAbilityId,
    initialData: [],
  });

  const createAbilityMutation = useMutation({
    mutationFn: (data) => base44.entities.Ability.create(data),
    onSuccess: (newAbility) => {
      queryClient.invalidateQueries({ queryKey: ['abilities'] });
      setCurrentAbilityId(newAbility.id);
      setShowAbilityDialog(false);
      setNewAbilityName("");
    }
  });

  const handleCreateAbility = () => {
    if (!newAbilityName.trim()) return;
    createAbilityMutation.mutate({ 
      name: newAbilityName,
      description: "New Ability"
    });
  };

  useEffect(() => {
    if (dbNodes) {
      setNodes(dbNodes.map(node => ({
        ...node,
        position: node.position || { x: 100, y: 100 },
        connections: node.connections || {},
        collapsedSections: node.collapsedSections || {},
        effectClipData: node.effectClipData || (node.type === 'effect_clip' ? { startTime: 0, endTime: 2000, duration: 2000, magnitude: 100, stackCount: 1 } : null),
        gameplayTagClipData: node.gameplayTagClipData || (node.type === 'gameplay_tag_clip' ? { startTime: 0, endTime: 2000, duration: 2000, tagName: 'Tag', attachmentCount: 0 } : null),
        gameplayCueClipData: node.gameplayCueClipData || (node.type === 'gameplay_cue_clip' ? { startTime: 0, endTime: 1000, duration: 1000, cueTag: 'GameplayCue.', intensity: 1.0 } : null),
        montageClipData: node.montageClipData || (node.type === 'montage_clip' ? { startTime: 0, endTime: 2000, duration: 2000, animName: '', playRate: 1.0, sectionName: 'Default' } : null),
        compositeClipData: node.compositeClipData || (node.type === 'composite_clip' ? { startTime: 0, endTime: 5000, duration: 5000, loop: false } : null),
        instantEffectFrameData: node.instantEffectFrameData || (node.type === 'instant_effect_frame' ? { startTime: 0, effectType: 'Damage', value: 100 } : null),
        customEventFrameData: node.customEventFrameData || (node.type === 'custom_event_frame' ? { startTime: 0, eventName: 'CustomEvent' } : null),
        gameplayCueFrameData: node.gameplayCueFrameData || (node.type === 'gameplay_cue_frame' ? { startTime: 0, cueTag: 'GameplayCue.', intensity: 1.0 } : null),
        operatorData: node.operatorData || (['add', 'subtract', 'multiply', 'divide', 'constant'].includes(node.type) ? { inputA: 0, inputB: 0, output: 0, constantValue: 0 } : null),
        blackboardData: node.blackboardData || (['get_blackboard', 'set_blackboard'].includes(node.type) ? { variableName: '', variableType: 'number' } : null),
        // For macro nodes, try to find their parent to init time
        startTime: node.type === 'macro_entry' ? node.startTime || 0 : undefined,
        endTime: node.type === 'macro_exit' ? node.endTime || 0 : undefined,
        dynamicPins: node.dynamicPins || []
      })));
    }
  }, [dbNodes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  const saveMutation = useMutation({
  mutationFn: async () => {
    if (!currentAbilityId) return;

    // Get existing nodes ONLY for this ability
    const existingNodes = await base44.entities.Node.filter({ ability_id: currentAbilityId });

    // Delete all existing nodes for this ability
    // Note: In a production app we would diff and update, but for now full replace is safer
    for (const node of existingNodes) {
      await base44.entities.Node.delete(node.id);
    }

    // Create all current nodes
    for (const node of nodes) {
      const { id, created_date, updated_date, created_by, ...nodeData } = node;
      // Ensure ability_id is set
      nodeData.ability_id = currentAbilityId;
      await base44.entities.Node.create(nodeData);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['nodes', currentAbilityId] });
    setHasUnsavedChanges(false);
  },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const addNewNode = (nodeType, timelineTime = null) => {
    if (!currentAbilityId) return;

    const currentParentId = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1].id : null;
    const nodeCount = nodes.filter(n => n.type === nodeType).length;
    
    const newNode = {
      id: `temp-${Date.now()}`,
      ability_id: currentAbilityId,
      parent_node_id: currentParentId, // Set parent ID based on current scope
      name: nodeType === 'effect_clip' ? `Effect ${nodeCount + 1}` :
            nodeType === 'gameplay_tag_clip' ? `Tag ${nodeCount + 1}` :
            nodeType === 'gameplay_cue_clip' ? `Cue ${nodeCount + 1}` :
            nodeType === 'montage_clip' ? `Montage ${nodeCount + 1}` :
            nodeType === 'composite_clip' ? `Container ${nodeCount + 1}` :
            nodeType === 'instant_effect_frame' ? `即时效果 ${nodeCount + 1}` :
            nodeType === 'custom_event_frame' ? `自定义事件 ${nodeCount + 1}` :
            nodeType === 'get_blackboard' ? `获取黑板值` :
            nodeType === 'set_blackboard' ? `设置黑板值` :
            `${nodeType} ${nodeCount + 1}`,
      type: nodeType,
      position: { 
        x: 100 + (nodes.length % 4) * 280, 
        y: 100 + Math.floor(nodes.length / 4) * 180 
      },
      connections: {},
      collapsedSections: {},
      dynamicPins: []
    };

    if (nodeType === 'effect_clip') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 2000;
      newNode.effectClipData = {
        startTime: startTime,
        endTime: startTime + 2000,
        duration: 2000,
        magnitude: 100,
        stackCount: 1
      };
    } else if (nodeType === 'gameplay_tag_clip') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 2000;
      newNode.gameplayTagClipData = {
        startTime: startTime,
        endTime: startTime + 2000,
        duration: 2000,
        tagName: 'Tag',
        attachmentCount: 0
      };
    } else if (nodeType === 'gameplay_cue_clip') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 1000;
      newNode.gameplayCueClipData = {
        startTime: startTime,
        endTime: startTime + 1000,
        duration: 1000,
        cueTag: 'GameplayCue.',
        intensity: 1.0
      };
    } else if (nodeType === 'montage_clip') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 2000;
      newNode.montageClipData = {
        startTime: startTime,
        endTime: startTime + 2000,
        duration: 2000,
        animName: 'Anim_Asset',
        playRate: 1.0,
        sectionName: 'Default'
      };
    } else if (nodeType === 'composite_clip') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 5000;
      newNode.compositeClipData = {
        startTime: startTime,
        endTime: startTime + 5000,
        duration: 5000,
        loop: false
      };
    } else if (nodeType === 'instant_effect_frame') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 1000;
      newNode.instantEffectFrameData = {
        startTime: startTime,
        effectType: 'Damage',
        value: 100
      };
    } else if (nodeType === 'custom_event_frame') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 1000;
      newNode.customEventFrameData = {
        startTime: startTime,
        eventName: 'CustomEvent'
      };
    } else if (nodeType === 'gameplay_cue_frame') {
      const startTime = timelineTime !== null ? timelineTime : nodeCount * 1000;
      newNode.name = `Cue Frame ${nodeCount + 1}`;
      newNode.gameplayCueFrameData = {
        startTime: startTime,
        cueTag: 'GameplayCue.',
        intensity: 1.0
      };
    } else if (['add', 'subtract', 'multiply', 'divide', 'constant'].includes(nodeType)) {
      newNode.operatorData = {
        inputA: 0,
        inputB: 0,
        output: 0,
        constantValue: nodeType === 'constant' ? 1000 : 0
      };
    } else if (nodeType === 'get_blackboard' || nodeType === 'set_blackboard') {
      newNode.blackboardData = {
        variableName: '',
        variableType: 'number'
      };
    } else if (nodeType === 'effect_events') {
       // No extra data needed, just connections
    }

    setNodes([...nodes, newNode]);
    setHasUnsavedChanges(true);
  };

  const calculateOperatorOutput = (node, operatorDataOverride = null) => {
    const data = operatorDataOverride || node.operatorData;
    if (node.type === 'constant') {
      return Math.round(data.constantValue);
    }

    const a = Math.round(data.inputA || 0);
    const b = Math.round(data.inputB || 0);

    switch (node.type) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return b !== 0 ? Math.round(a / b) : 0;
      default: return 0;
    }
  };

  // Helper to get raw data object from node based on type
  const getNodeData = (node) => {
    if (!node) return null;
    if (node.type === 'effect_clip') return node.effectClipData;
    if (node.type === 'gameplay_tag_clip') return node.gameplayTagClipData;
    if (node.type === 'gameplay_cue_clip') return node.gameplayCueClipData;
    if (node.type === 'montage_clip') return node.montageClipData;
    if (node.type === 'composite_clip') return node.compositeClipData;
    if (node.type === 'instant_effect_frame') return node.instantEffectFrameData;
    if (node.type === 'custom_event_frame') return node.customEventFrameData;
    if (node.type === 'gameplay_cue_frame') return node.gameplayCueFrameData;
    if (['add', 'subtract', 'multiply', 'divide', 'constant'].includes(node.type)) return node.operatorData;
    return null;
  };

  // Helper to apply changes and perform internal calculations (like Time/Duration -> EndTime)
  const applyNodeChanges = (node, changes) => {
    const newNode = { ...node };
    let dataKey = '';

    if (node.type === 'effect_clip') dataKey = 'effectClipData';
    else if (node.type === 'gameplay_tag_clip') dataKey = 'gameplayTagClipData';
    else if (node.type === 'gameplay_cue_clip') dataKey = 'gameplayCueClipData';
    else if (node.type === 'montage_clip') dataKey = 'montageClipData';
    else if (node.type === 'composite_clip') dataKey = 'compositeClipData';
    else if (node.type === 'instant_effect_frame') dataKey = 'instantEffectFrameData';
    else if (node.type === 'custom_event_frame') dataKey = 'customEventFrameData';
    else if (node.type === 'gameplay_cue_frame') dataKey = 'gameplayCueFrameData';
    else if (['add', 'subtract', 'multiply', 'divide', 'constant'].includes(node.type)) dataKey = 'operatorData';

    if (!dataKey) return { updatedNode: newNode, effectiveChanges: changes };

    // 1. Apply direct changes
    newNode[dataKey] = { ...newNode[dataKey], ...changes };
    const newData = newNode[dataKey];
    const effectiveChanges = { ...changes };

    // 2. Internal Calculations & Derived Data

    // Clips: Time Logic (Start + Duration = End)
    if (['effect_clip', 'gameplay_tag_clip', 'gameplay_cue_clip', 'montage_clip', 'composite_clip'].includes(node.type)) {
       // If Start or Duration changed, recalculate End
       // Or if End was passed in (from recursion/timeline), we might respect it? 
       // Standard logic: Input pins (Start/Duration) drive output (End).
       const start = newData.startTime || 0;
       const duration = newData.duration || 0;
       const calculatedEnd = start + duration;

       if (newData.endTime !== calculatedEnd) {
           newData.endTime = calculatedEnd;
           effectiveChanges['endTime'] = calculatedEnd;
       }
    }

    // Operators: Calc Output
    if (['add', 'subtract', 'multiply', 'divide'].includes(node.type)) {
       const newOutput = calculateOperatorOutput(newNode, newData);
       if (newData.output !== newOutput) {
           newData.output = newOutput;
           effectiveChanges['output'] = newOutput;
       }
    }

    return { updatedNode: newNode, effectiveChanges };
  };

  const propagateConnectionUpdates = (startNodeId, startChanges, allNodes) => {
    // Build dependency graph
    const graph = new Map(); // nodeId -> [dependent nodeIds]
    const inDegree = new Map(); // nodeId -> count of incoming edges
    
    allNodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build edges from connections
    allNodes.forEach(node => {
      if (node.connections && typeof node.connections === 'object') {
        Object.values(node.connections).forEach(connData => {
          const connections = Array.isArray(connData) ? connData : [connData];
          connections.forEach(conn => {
            if (conn && conn.connectedTo) {
              graph.get(node.id).push(conn.connectedTo);
              inDegree.set(conn.connectedTo, (inDegree.get(conn.connectedTo) || 0) + 1);
            }
          });
        });
      }
    });

    // Topological sort (Kahn's algorithm)
    const queue = [];
    const sortedNodes = [];
    
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    while (queue.length > 0) {
      const nodeId = queue.shift();
      sortedNodes.push(nodeId);
      
      graph.get(nodeId).forEach(dependent => {
        inDegree.set(dependent, inDegree.get(dependent) - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      });
    }

    // Apply updates in topological order
    const nodeMap = new Map(allNodes.map(n => [n.id, n]));
    const pendingChanges = new Map(); // nodeId -> changes to apply
    pendingChanges.set(startNodeId, startChanges);

    sortedNodes.forEach(nodeId => {
      const currentNode = nodeMap.get(nodeId);
      if (!currentNode) return;

      const changes = pendingChanges.get(nodeId);
      if (!changes) return;

      // Apply changes and internal calculations
      const { updatedNode, effectiveChanges } = applyNodeChanges(currentNode, changes);
      nodeMap.set(nodeId, updatedNode);

      // Propagate to downstream nodes
      if (updatedNode.connections) {
        Object.entries(updatedNode.connections).forEach(([sourcePin, connData]) => {
          if (!effectiveChanges.hasOwnProperty(sourcePin)) return;

          const valueToPropagate = effectiveChanges[sourcePin];
          const connections = Array.isArray(connData) ? connData : [connData];

          connections.forEach(conn => {
            if (!conn || !conn.connectedTo || !conn.connectedPin) return;

            const existingChanges = pendingChanges.get(conn.connectedTo) || {};
            pendingChanges.set(conn.connectedTo, {
              ...existingChanges,
              [conn.connectedPin]: valueToPropagate
            });
          });
        });
      }
    });

    return nodeMap;
  };

  const updateNode = (nodeId, updates, source) => {
    if (activeEditor && source && source !== activeEditor) return;

    setNodes(prevNodes => {
      // First, filter out updates that are constrained by input connections
      const constrainedUpdates = { ...updates };
      
      // Check if any field being updated has an input connection
      prevNodes.forEach(sourceNode => {
        if (sourceNode.connections && typeof sourceNode.connections === 'object') {
          Object.entries(sourceNode.connections).forEach(([sourcePin, connData]) => {
            const connections = Array.isArray(connData) ? connData : [connData];
            connections.forEach(conn => {
              if (conn && conn.connectedTo === nodeId && conn.connectedPin) {
                // This field is connected, remove it from user updates (will be set by propagation)
                if (constrainedUpdates.hasOwnProperty(conn.connectedPin)) {
                  delete constrainedUpdates[conn.connectedPin];
                }
              }
            });
          });
        }
      });

      const directUpdatedNodes = prevNodes.map(node => {
        if (node.id === nodeId) {
          const updatedNode = { ...node };
          
          if (updates.hasOwnProperty('collapsedSections')) {
            updatedNode.collapsedSections = updates.collapsedSections;
            setHasUnsavedChanges(true);
            return updatedNode;
          }
          
          if (updates.hasOwnProperty('position')) {
            updatedNode.position = updates.position;
            return updatedNode;
          }

          if (updates.hasOwnProperty('connections')) {
            updatedNode.connections = updates.connections;
            return updatedNode;
          }
          
          else if (node.type === 'effect_clip') {
            updatedNode.effectClipData = { ...node.effectClipData, ...constrainedUpdates };
            
            // Always recalculate endTime from startTime + duration
            if (constrainedUpdates.hasOwnProperty('startTime') || constrainedUpdates.hasOwnProperty('duration')) {
              updatedNode.effectClipData.endTime = updatedNode.effectClipData.startTime + updatedNode.effectClipData.duration;
            }
            
            // Timeline resize: update duration from endTime change
            if (source === 'timeline' && constrainedUpdates.hasOwnProperty('endTime')) {
              updatedNode.effectClipData.duration = updatedNode.effectClipData.endTime - updatedNode.effectClipData.startTime;
            }
          } 
          else if (node.type === 'gameplay_tag_clip') {
            updatedNode.gameplayTagClipData = { ...node.gameplayTagClipData, ...constrainedUpdates };
            
            if (constrainedUpdates.hasOwnProperty('startTime') || constrainedUpdates.hasOwnProperty('duration')) {
              updatedNode.gameplayTagClipData.endTime = updatedNode.gameplayTagClipData.startTime + updatedNode.gameplayTagClipData.duration;
            }
            
            if (source === 'timeline' && constrainedUpdates.hasOwnProperty('endTime')) {
              updatedNode.gameplayTagClipData.duration = updatedNode.gameplayTagClipData.endTime - updatedNode.gameplayTagClipData.startTime;
            }
          }
          else if (node.type === 'gameplay_cue_clip') {
            updatedNode.gameplayCueClipData = { ...node.gameplayCueClipData, ...constrainedUpdates };
            
            if (constrainedUpdates.hasOwnProperty('startTime') || constrainedUpdates.hasOwnProperty('duration')) {
              updatedNode.gameplayCueClipData.endTime = updatedNode.gameplayCueClipData.startTime + updatedNode.gameplayCueClipData.duration;
            }
            
            if (source === 'timeline' && constrainedUpdates.hasOwnProperty('endTime')) {
              updatedNode.gameplayCueClipData.duration = updatedNode.gameplayCueClipData.endTime - updatedNode.gameplayCueClipData.startTime;
            }
          }
          else if (node.type === 'montage_clip') {
            updatedNode.montageClipData = { ...node.montageClipData, ...constrainedUpdates };
            
            if (constrainedUpdates.hasOwnProperty('startTime') || constrainedUpdates.hasOwnProperty('duration')) {
              updatedNode.montageClipData.endTime = updatedNode.montageClipData.startTime + updatedNode.montageClipData.duration;
            }
            
            if (source === 'timeline' && constrainedUpdates.hasOwnProperty('endTime')) {
              updatedNode.montageClipData.duration = updatedNode.montageClipData.endTime - updatedNode.montageClipData.startTime;
            }
          }
          else if (node.type === 'composite_clip') {
            updatedNode.compositeClipData = { ...node.compositeClipData, ...constrainedUpdates };
            
            if (constrainedUpdates.hasOwnProperty('startTime') || constrainedUpdates.hasOwnProperty('duration')) {
              updatedNode.compositeClipData.endTime = updatedNode.compositeClipData.startTime + updatedNode.compositeClipData.duration;
            }
            
            if (source === 'timeline' && constrainedUpdates.hasOwnProperty('endTime')) {
              updatedNode.compositeClipData.duration = updatedNode.compositeClipData.endTime - updatedNode.compositeClipData.startTime;
            }
          }
          else if (node.type === 'instant_effect_frame') {
            updatedNode.instantEffectFrameData = { ...node.instantEffectFrameData, ...constrainedUpdates };
          }
          else if (node.type === 'custom_event_frame') {
            updatedNode.customEventFrameData = { ...node.customEventFrameData, ...constrainedUpdates };
          }
          else if (node.type === 'gameplay_cue_frame') {
            updatedNode.gameplayCueFrameData = { ...node.gameplayCueFrameData, ...constrainedUpdates };
          }
          else if (node.type === 'get_blackboard' || node.type === 'set_blackboard') {
            updatedNode.blackboardData = { ...node.blackboardData, ...constrainedUpdates };
          }
          else if (['add', 'subtract', 'multiply', 'divide', 'constant'].includes(node.type)) {
            updatedNode.operatorData = { ...node.operatorData, ...constrainedUpdates };
            
            if (node.type !== 'constant') {
              updatedNode.operatorData.output = calculateOperatorOutput(updatedNode);
            }
          }
          
          return updatedNode;
        }
        return node;
      });
      
      if (updates.hasOwnProperty('position') || updates.hasOwnProperty('collapsedSections')) {
        return directUpdatedNodes;
      }
      
      // Always propagate changes, even during drag, to ensure real-time visual feedback and correct cascading
      // if (isDragging) return directUpdatedNodes;

      // Propagate changes through the dependency graph
      const propagatedMap = propagateConnectionUpdates(nodeId, constrainedUpdates, directUpdatedNodes);

      const finalNodes = directUpdatedNodes.map(node => {
        const propagatedNode = propagatedMap.get(node.id);
        if (propagatedNode) {
          return propagatedNode;
        }

        // Also check if we need to update Macro Entry/Exit nodes if their parent Composite Clip changed
        if (node.type === 'macro_entry' || node.type === 'macro_exit') {
             const parentNode = propagatedMap.get(node.parent_node_id) || directUpdatedNodes.find(p => p.id === node.parent_node_id);

             if (parentNode && parentNode.id === node.parent_node_id) {
                 if (node.type === 'macro_entry' && node.startTime !== parentNode.compositeClipData?.startTime) {
                     return { ...node, startTime: parentNode.compositeClipData?.startTime };
                 }
                 if (node.type === 'macro_exit' && node.endTime !== parentNode.compositeClipData?.endTime) {
                     return { ...node, endTime: parentNode.compositeClipData?.endTime };
                 }
             }
        }

        return node;
      });

      setHasUnsavedChanges(true);
      return finalNodes;
    });
  };

  const handleDragEnd = (editor) => {
    setActiveEditor(null);
    setIsDragging(false);
    
    // No need to propagate here since updateNode handles it even during drag now.
    setHasUnsavedChanges(true);
  };

  const deleteNode = (nodeId) => {
    setNodes(prevNodes => {
      const nodesWithCleanedConnections = prevNodes.map(node => {
        if (node.connections && typeof node.connections === 'object') {
          const newConnections = { ...node.connections };
          let hasChange = false;
          
          Object.keys(newConnections).forEach(pinType => {
            const connData = newConnections[pinType];
            
            if (Array.isArray(connData)) {
                const filtered = connData.filter(c => c.connectedTo !== nodeId);
                if (filtered.length !== connData.length) {
                    if (filtered.length === 0) delete newConnections[pinType];
                    else newConnections[pinType] = filtered;
                    hasChange = true;
                }
            } else if (connData && connData.connectedTo === nodeId) {
              delete newConnections[pinType];
              hasChange = true;
            }
          });
          
          if (hasChange) {
            return { ...node, connections: newConnections };
          }
        }
        return node;
      });
      
      return nodesWithCleanedConnections.filter(node => node.id !== nodeId);
    });
    
    setHasUnsavedChanges(true);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const createConnection = (sourceNodeId, sourcePin, targetNodeId, targetPin) => {
    setNodes(prevNodes => {
      // Remove any existing connections to the target input pin (Fan-In = 1)
      const nodesWithoutOldConnection = prevNodes.map(node => {
        if (node.connections && typeof node.connections === 'object') {
          const newConnections = { ...node.connections };
          let hasChange = false;

          Object.keys(newConnections).forEach(pin => {
            const connData = newConnections[pin];
            if (Array.isArray(connData)) {
                const filtered = connData.filter(c => !(c.connectedTo === targetNodeId && c.connectedPin === targetPin));
                if (filtered.length !== connData.length) {
                    if (filtered.length === 0) delete newConnections[pin];
                    else newConnections[pin] = filtered;
                    hasChange = true;
                }
            } else if (connData && connData.connectedTo === targetNodeId && connData.connectedPin === targetPin) {
              delete newConnections[pin];
              hasChange = true;
            }
          });

          if (hasChange) {
            return { ...node, connections: newConnections };
          }
        }
        return node;
      });

      const newNodes = nodesWithoutOldConnection.map(node => {
        if (node.id === sourceNodeId) {
          const existingConns = Array.isArray(node.connections[sourcePin]) 
            ? node.connections[sourcePin] 
            : (node.connections[sourcePin] ? [node.connections[sourcePin]] : []);

          return {
            ...node,
            connections: {
              ...node.connections,
              [sourcePin]: [
                ...existingConns,
                {
                  connectedTo: targetNodeId,
                  connectedPin: targetPin
                }
              ]
            }
          };
        }
        return node;
      });

      // After establishing connection, propagate the value from source node
      const sourceNode = newNodes.find(n => n.id === sourceNodeId);
      if (sourceNode) {
        const value = getNodeData(sourceNode)?.[sourcePin];
        
        if (value !== undefined) {
          const propagatedMap = propagateConnectionUpdates(sourceNodeId, { [sourcePin]: value }, newNodes);
          return newNodes.map(node => propagatedMap.has(node.id) ? propagatedMap.get(node.id) : node);
        }
      }
      
      return newNodes;
    });

    setHasUnsavedChanges(true);
  };

  const removeConnection = (nodeId, pin, targetNodeId, targetPin) => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          const newConnections = { ...node.connections };
          
          if (targetNodeId && targetPin) {
             // Specific removal
             const connData = newConnections[pin];
             if (Array.isArray(connData)) {
                 const filtered = connData.filter(c => !(c.connectedTo === targetNodeId && c.connectedPin === targetPin));
                 if (filtered.length === 0) delete newConnections[pin];
                 else newConnections[pin] = filtered;
             } else {
                 delete newConnections[pin];
             }
          } else {
             // Remove all (fallback)
             delete newConnections[pin];
          }
          
          return { ...node, connections: newConnections };
        }
        return node;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleBlackboardUpdate = (newBlackboard) => {
    setGlobalBlackboard(newBlackboard);
    setHasUnsavedChanges(true);
  };

  const handleConnectionDoubleClick = (connectionId, position) => {
    // New ID format: sourceNodeId|sourcePin|targetNodeId|targetPin
    const parts = connectionId.split('|');
    let sourceNodeId, sourcePin, targetNodeId, targetPin;

    if (parts.length === 4) {
        [sourceNodeId, sourcePin, targetNodeId, targetPin] = parts;
    } else {
        // Fallback for old IDs or different format (though getAllConnections should use new format)
        return; 
    }

    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    if (!sourceNode) return;
    
    const rerouteId = `reroute-${Date.now()}`;
    
    // 1. Create Reroute Node
    const rerouteNode = {
        id: rerouteId,
        ability_id: currentAbilityId,
        parent_node_id: sourceNode.parent_node_id, // Same scope
        name: 'Reroute',
        type: 'reroute',
        position: { x: position.x, y: position.y },
        connections: {
            'output': [{ // Reroute output is also array for consistency
                connectedTo: targetNodeId,
                connectedPin: targetPin
            }]
        }
    };
    
    setNodes(prevNodes => {
        // 2. Update source node to point to reroute instead of target
        const updatedNodes = prevNodes.map(n => {
            if (n.id === sourceNodeId) {
                const existingConns = Array.isArray(n.connections[sourcePin]) 
                    ? n.connections[sourcePin] 
                    : (n.connections[sourcePin] ? [n.connections[sourcePin]] : []);
                
                // Replace the specific connection to target with connection to reroute
                const newConns = existingConns.map(c => 
                    (c.connectedTo === targetNodeId && c.connectedPin === targetPin) 
                        ? { connectedTo: rerouteId, connectedPin: 'input' }
                        : c
                );

                return {
                    ...n,
                    connections: {
                        ...n.connections,
                        [sourcePin]: newConns
                    }
                };
            }
            return n;
        });
        
        return [...updatedNodes, rerouteNode];
    });
    
    setHasUnsavedChanges(true);
  };

  // Filter nodes based on current scope
  const currentParentId = scopeStack.length > 0 ? scopeStack[scopeStack.length - 1].id : null;
  
  const visibleNodes = nodes.filter(n => {
    // If node has no parent_node_id, it belongs to root (null)
    // If node has parent_node_id, it must match currentParentId
    return (n.parent_node_id || null) === currentParentId;
  });

  const clipNodes = visibleNodes.filter(n => 
    ['effect_clip', 'gameplay_tag_clip', 'gameplay_cue_clip', 'montage_clip', 'composite_clip'].includes(n.type)
  );
  
  const eventNodes = visibleNodes.filter(n => 
    ['instant_effect_frame', 'custom_event_frame', 'gameplay_cue_frame'].includes(n.type)
  );

  // Navigation Handler
  const handleDiveIn = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setScopeStack([...scopeStack, { id: node.id, name: node.name }]);
      setSelectedNodeId(null); // Clear selection when changing scope

      // Check and create Macro Entry/Exit nodes if they don't exist for this scope
      // We do this using a timeout to allow state update to process first, or just update state directly
      // Ideally we check `nodes` state, but since we are updating state, we should check current `nodes`
      const hasEntry = nodes.some(n => n.parent_node_id === nodeId && n.type === 'macro_entry');
      const hasExit = nodes.some(n => n.parent_node_id === nodeId && n.type === 'macro_exit');

      const newNodesToAdd = [];
      
      if (!hasEntry) {
        newNodesToAdd.push({
            id: `entry-${nodeId}-${Date.now()}`,
            ability_id: currentAbilityId,
            parent_node_id: nodeId,
            name: "Entry",
            type: "macro_entry",
            position: { x: 50, y: 200 },
            startTime: node.compositeClipData?.startTime || 0 // Visual only
        });
      }

      if (!hasExit) {
        newNodesToAdd.push({
            id: `exit-${nodeId}-${Date.now()}`,
            ability_id: currentAbilityId,
            parent_node_id: nodeId,
            name: "Exit",
            type: "macro_exit",
            position: { x: 800, y: 200 },
            endTime: node.compositeClipData?.endTime || 0 // Visual only
        });
      }

      if (newNodesToAdd.length > 0) {
        setNodes(prev => [...prev, ...newNodesToAdd]);
        setHasUnsavedChanges(true);
      }
    }
  };

  const handleNavigateUp = (index) => {
    if (index === -1) {
      setScopeStack([]); // Go to root
    } else {
      setScopeStack(scopeStack.slice(0, index + 1));
    }
    setSelectedNodeId(null);
  };

  if (isLoading || isLoadingAbilities) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0b0d12] flex flex-col overflow-hidden font-sans text-gray-300">
      {/* Ability Creation Dialog */}
      {showAbilityDialog && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#15171c] border border-white/10 rounded-lg p-6 w-96 shadow-2xl shadow-black">
            <h2 className="text-lg font-bold text-amber-500 mb-1 tracking-wide uppercase">Create New Ability</h2>
            <p className="text-xs text-gray-500 mb-6">Enter a name for your new gameplay ability.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Ability Name</label>
                <input 
                  type="text" 
                  value={newAbilityName}
                  onChange={(e) => setNewAbilityName(e.target.value)}
                  className="w-full bg-[#0b0d12] border border-white/5 rounded h-10 px-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-gray-700"
                  placeholder="e.g. Fireball"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                {abilities.length > 0 && (
                  <button 
                    onClick={() => setShowAbilityDialog(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wide"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={handleCreateAbility}
                  disabled={!newAbilityName.trim()}
                  className="px-6 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-black rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wide"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toolbar 
        onSave={handleSave}
        onAddNode={addNewNode}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={saveMutation.isPending}
        abilities={abilities}
        currentAbilityId={currentAbilityId}
        onChangeAbility={(id) => {
          if (hasUnsavedChanges) {
            if (confirm('当前有未保存的更改，切换技能将丢失这些更改。确定要切换吗？')) {
              setHasUnsavedChanges(false);
              setCurrentAbilityId(id);
            }
          } else {
            setCurrentAbilityId(id);
            setScopeStack([]); // Reset scope when changing ability
          }
        }}
        onCreateAbility={() => setShowAbilityDialog(true)}
        scopeStack={scopeStack}
        onNavigateUp={handleNavigateUp}
      />

      <div className="flex-1 flex overflow-hidden">
        <TimelineView
          clips={clipNodes.map(n => ({
            ...n,
            ...(n.type === 'effect_clip' ? n.effectClipData 
              : n.type === 'gameplay_tag_clip' ? n.gameplayTagClipData 
              : n.type === 'gameplay_cue_clip' ? n.gameplayCueClipData 
              : n.type === 'montage_clip' ? n.montageClipData 
              : n.type === 'composite_clip' ? n.compositeClipData 
              : {}),
            nodePosition: n.position
          }))}
          events={eventNodes.map(n => ({
            ...n,
            ...(n.type === 'instant_effect_frame' ? n.instantEffectFrameData 
              : n.type === 'custom_event_frame' ? n.customEventFrameData 
              : n.type === 'gameplay_cue_frame' ? n.gameplayCueFrameData : {}),
            nodePosition: n.position
          }))}
          selectedClipId={selectedNodeId}
          onSelectClip={setSelectedNodeId}
          onUpdateClip={(nodeId, updates) => updateNode(nodeId, updates, 'timeline')}
          onDeleteClip={deleteNode}
          onDragStart={() => { setActiveEditor('timeline'); setIsDragging(true); }}
          onDragEnd={() => handleDragEnd('timeline')}
          onAddNode={addNewNode}
          onDiveIn={handleDiveIn}
        />

        <NodeEditor
          nodes={visibleNodes} // Use filtered nodes
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNode={(nodeId, updates) => updateNode(nodeId, updates, 'node')}
          onDeleteNode={deleteNode}
          onCreateConnection={createConnection}
          onRemoveConnection={removeConnection}
          onDragStart={() => { setActiveEditor('node'); setIsDragging(true); }}
          onDragEnd={() => handleDragEnd('node')}
          globalBlackboard={globalBlackboard}
          onDiveIn={handleDiveIn} // Pass dive-in handler
          onConnectionDoubleClick={handleConnectionDoubleClick}
        />

        <div className="w-80 bg-[#0b0d12] border-l border-white/5 overflow-y-auto">
          <GlobalBlackboard
            blackboard={globalBlackboard}
            onUpdateBlackboard={handleBlackboardUpdate}
          />
        </div>
      </div>
    </div>
  );
}