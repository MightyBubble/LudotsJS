import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, Network, Code } from "lucide-react";

export default function DataGraphEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: graphs = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DataGraph.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      setCreatingNew(false);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataGraph.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataGraph.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
    },
  });

  const filteredGraphs = useMemo(() => {
    if (!searchQuery) return graphs;
    return graphs.filter(g => 
      g.graph_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.name && g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [graphs, searchQuery]);

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      graph_id: "",
      name: "",
      description: "",
      graph_type: "curve",
      input_parameters: [],
      graph_definition: {
        nodes: [],
        edges: []
      }
    });
  };

  const handleEdit = (graph) => {
    setEditingId(graph.id);
    setCreatingNew(false);
    setEditData({ ...graph });
  };

  const handleSave = () => {
    if (!editData.graph_id || !editData.name || !editData.graph_type) {
      alert('请填写必填项');
      return;
    }
    if (creatingNew) {
      createMutation.mutate(editData);
    } else {
      updateMutation.mutate({ id: editData.id, data: editData });
    }
  };

  const handleCancel = () => {
    setCreatingNew(false);
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除？')) {
      deleteMutation.mutate(id);
    }
  };

  const renderEditRow = () => {
    return (
      <tr className="border-b border-[#3d3d3d] bg-[#252526]">
        <td className="p-2">
          <Input
            value={editData.graph_id}
            onChange={(e) => setEditData({ ...editData, graph_id: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white font-mono"
            placeholder="linear_curve"
          />
        </td>
        <td className="p-2">
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="线性曲线"
          />
        </td>
        <td className="p-2">
          <Select
            value={editData.graph_type}
            onValueChange={(value) => setEditData({ ...editData, graph_type: value })}
          >
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="curve" className="text-white hover:bg-[#3d3d3d] text-xs">Curve (曲线)</SelectItem>
              <SelectItem value="attribute_calculation" className="text-white hover:bg-[#3d3d3d] text-xs">Attribute Calc (属性计算)</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <Textarea
            value={editData.description || ""}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="h-12 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white resize-none"
            placeholder="图的描述..."
          />
        </td>
        <td className="p-2">
          <Textarea
            value={JSON.stringify(editData.graph_definition, null, 2)}
            onChange={(e) => {
              try {
                setEditData({ ...editData, graph_definition: JSON.parse(e.target.value) });
              } catch (err) {
                // 忽略解析错误
              }
            }}
            className="h-20 bg-[#1e1e1e] border-[#3d3d3d] text-[10px] text-white resize-none font-mono"
            placeholder='{"nodes": [], "edges": []}'
          />
        </td>
        <td className="p-2">
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Network className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">Data Graph 编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredGraphs.length} 个</span>
        
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

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建图
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#2d2d2d] border-b border-[#3d3d3d]">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-300 w-40">Graph ID</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">类型</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-48">描述</th>
              <th className="text-left p-2 font-semibold text-gray-300">图定义</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && renderEditRow()}
            
            {filteredGraphs.map((graph) => {
              const isEditing = editingId === graph.id;
              
              if (isEditing && editData) {
                return <React.Fragment key={graph.id}>{renderEditRow()}</React.Fragment>;
              }
              
              return (
                <tr key={graph.id} className="border-b border-[#3d3d3d] hover:bg-[#252526]">
                  <td className="p-2 text-gray-300 font-mono">{graph.graph_id}</td>
                  <td className="p-2 text-gray-300">{graph.name}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      graph.graph_type === 'curve' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'
                    }`}>
                      {graph.graph_type === 'curve' ? 'Curve' : 'Attribute Calc'}
                    </span>
                  </td>
                  <td className="p-2 text-gray-500 text-[10px]">{graph.description || "-"}</td>
                  <td className="p-2">
                    <details className="text-[10px] text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-300">
                        <Code className="w-3 h-3 inline mr-1" />
                        {graph.graph_definition?.nodes?.length || 0} nodes
                      </summary>
                      <pre className="mt-1 p-2 bg-[#1e1e1e] rounded font-mono text-[9px] overflow-auto max-h-32">
                        {JSON.stringify(graph.graph_definition, null, 2)}
                      </pre>
                    </details>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(graph)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(graph.id)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredGraphs.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无 Data Graph 定义</div>
          </div>
        )}
      </div>
    </div>
  );
}