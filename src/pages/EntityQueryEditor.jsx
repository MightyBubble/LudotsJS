import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Trash2 } from "lucide-react";
import GraphCanvas from '../components/graph/GraphCanvas';
import QueryNodeLibrary from '../components/queryGraph/QueryNodeLibrary';
import Toolbar from '../components/graph/Toolbar';
import QueryNode from '../components/queryGraph/QueryNode';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EntityQueryEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuery, setNewQuery] = useState({ query_name: '', description: '' });

  const queryClient = useQueryClient();

  const { data: queries = [] } = useQuery({
    queryKey: ['entityQueries'],
    queryFn: () => base44.entities.EntityQuery.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityQuery.create({
      ...data,
      graph_definition: JSON.stringify({ nodes: [], connections: [] })
    }),
    onSuccess: (query) => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      setIsCreating(false);
      setNewQuery({ query_name: '', description: '' });
      openQuery(query);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityQuery.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityQuery.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
    },
  });

  const filteredQueries = useMemo(() => {
    if (!searchQuery) return queries;
    return queries.filter(q =>
      q.query_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [queries, searchQuery]);

  const openQuery = (query) => {
    let graphDef;
    try {
      graphDef = typeof query.graph_definition === 'string'
        ? JSON.parse(query.graph_definition)
        : query.graph_definition || {};
    } catch {
      graphDef = {};
    }

    setCurrentQuery(query);
    setNodes(graphDef.nodes || []);
    setConnections(graphDef.connections || []);
  };

  const saveQuery = useCallback(() => {
    if (!currentQuery) return;

    updateMutation.mutate({
      id: currentQuery.id,
      data: {
        graph_definition: JSON.stringify({ nodes, connections })
      }
    });
  }, [currentQuery, nodes, connections]);

  const getNodeInputs = (type) => {
    const inputConfigs = {
      'entity_source': [],
      'filter_prototype': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_attribute': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_tag': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_relation': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'spatial_distance': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'spatial_area': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'logic_intersect': [{ id: 'a', label: 'A', type: 'entities' }, { id: 'b', label: 'B', type: 'entities' }],
      'logic_union': [{ id: 'a', label: 'A', type: 'entities' }, { id: 'b', label: 'B', type: 'entities' }],
      'logic_difference': [{ id: 'a', label: 'A (被减)', type: 'entities' }, { id: 'b', label: 'B (减去)', type: 'entities' }],
      'sort_by_attribute': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'sort_by_relation': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'sort_by_tag': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'limit_top': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'limit_bottom': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'limit_percent_top': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'limit_percent_bottom': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'output': [{ id: 'entities', label: '实体集', type: 'entities' }]
    };
    return inputConfigs[type] || [];
  };

  const getNodeOutputs = (type) => {
    const outputConfigs = {
      'entity_source': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_prototype': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_attribute': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_tag': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_relation': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'spatial_distance': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'spatial_area': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'logic_intersect': [{ id: 'result', label: '结果', type: 'entities' }],
      'logic_union': [{ id: 'result', label: '结果', type: 'entities' }],
      'logic_difference': [{ id: 'result', label: '结果', type: 'entities' }],
      'sort_by_attribute': [{ id: 'sorted', label: '排序结果', type: 'entities' }],
      'sort_by_relation': [{ id: 'sorted', label: '排序结果', type: 'entities' }],
      'sort_by_tag': [{ id: 'sorted', label: '排序结果', type: 'entities' }],
      'limit_top': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'limit_bottom': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'limit_percent_top': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'limit_percent_bottom': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'output': []
    };
    return outputConfigs[type] || [];
  };

  const addNode = useCallback((type) => {
    const defaultData = {
      entity_source: {},
      filter_prototype: { prototypeId: '' },
      filter_attribute: { attributeId: '', key: '', operator: 'gt', threshold: 0 },
      filter_tag: { tagPath: '', mode: 'has' },
      filter_relation: { relationId: '', direction: 'source' },
      spatial_distance: { maxDistance: 100, x: 0, y: 0, z: 0 },
      spatial_area: { shape: 'sphere', centerX: 0, centerY: 0, centerZ: 0, sizeX: 10, sizeY: 10, sizeZ: 10 },
      sort_by_attribute: { attributeId: '', key: '', order: 'asc' },
      sort_by_relation: { relationId: '', order: 'asc' },
      sort_by_tag: { tagPath: '', order: 'asc' },
      limit_top: { count: 10 },
      limit_bottom: { count: 10 },
      limit_percent_top: { percent: 10 },
      limit_percent_bottom: { percent: 10 }
    };

    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 300, y: 200 + nodes.length * 100 },
      data: defaultData[type] || {},
      inputs: getNodeInputs(type),
      outputs: getNodeOutputs(type)
    };
    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

  const addNodeAtPosition = useCallback((type, position) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: {},
      inputs: getNodeInputs(type),
      outputs: getNodeOutputs(type)
    };
    setNodes(prev => [...prev, newNode]);
  }, []);

  const updateNodePosition = useCallback((nodeId, position) => {
    setNodes(prev => prev.map(node => node.id === nodeId ? { ...node, position } : node));
  }, []);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes(prev => prev.map(node => node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node));
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.fromNode !== nodeId && conn.toNode !== nodeId));
  }, []);

  const addConnection = useCallback((connection) => {
    const exists = connections.some(c =>
      c.fromNode === connection.fromNode && c.fromPort === connection.fromPort &&
      c.toNode === connection.toNode && c.toPort === connection.toPort
    );
    if (!exists) setConnections(prev => [...prev, connection]);
  }, [connections]);

  const deleteConnection = useCallback((connectionId) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  const handleCreate = () => {
    if (!newQuery.query_name) {
      alert('请填写查询名称');
      return;
    }
    createMutation.mutate(newQuery);
  };

  if (currentQuery) {
    return (
      <div className="h-screen w-full bg-[#1e1e1e] flex flex-col overflow-hidden">
        <Toolbar
          onSave={saveQuery}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          onToggleLibrary={() => setShowLibrary(!showLibrary)}
          onBack={() => setCurrentQuery(null)}
          projectName={currentQuery.query_name}
          zoom={zoom}
          showBlackboard={false}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {showLibrary && <QueryNodeLibrary onAddNode={addNode} onClose={() => setShowLibrary(false)} />}

          <div className="flex-1 relative">
            <GraphCanvas
              nodes={nodes}
              connections={connections}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
              onUpdateNodePosition={updateNodePosition}
              onUpdateNodeData={updateNodeData}
              onDeleteNode={deleteNode}
              onAddConnection={addConnection}
              onDeleteConnection={deleteConnection}
              onAddNodeAtPosition={addNodeAtPosition}
              NodeComponent={QueryNode}
            />

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded text-white/60 text-xs font-mono space-y-1">
              <div>节点: {nodes.length}</div>
              <div>连接: {connections.length}</div>
              <div>缩放: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">实体查询编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredQueries.length} 个</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
              <Plus className="w-3 h-3 mr-1" />新建查询
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
            <DialogHeader><DialogTitle className="text-white">新建实体查询</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">查询名称</label>
                <Input value={newQuery.query_name} onChange={(e) => setNewQuery({ ...newQuery, query_name: e.target.value })} placeholder="我的查询" className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">描述</label>
                <Input value={newQuery.description} onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })} className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {filteredQueries.map((query) => (
            <div key={query.id} className="bg-[#252526] rounded border border-[#3e3e42] p-4 hover:border-[#0e639c] transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{query.query_name}</h3>
                  {query.description && <p className="text-white/60 text-xs mt-1">{query.description}</p>}
                </div>
                <button onClick={() => { if (confirm('确定删除？')) deleteMutation.mutate(query.id); }} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Button size="sm" onClick={() => openQuery(query)} className="w-full h-7 bg-[#0e639c] hover:bg-[#1177bb]">
                <Filter className="w-3 h-3 mr-1" />可视化编辑
              </Button>
            </div>
          ))}
        </div>
        {filteredQueries.length === 0 && (
          <div className="text-center py-12 text-white/40"><Filter className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无查询</p></div>
        )}
      </div>
    </div>
  );
}