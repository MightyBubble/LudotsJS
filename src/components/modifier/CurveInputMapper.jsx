import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export default function CurveInputMapper({ 
  curveGraphId, 
  dataGraphs, 
  attributes,
  mappings, 
  onChange 
}) {
  const selectedGraph = useMemo(() => {
    return dataGraphs.find(g => g.graph_id === curveGraphId);
  }, [dataGraphs, curveGraphId]);

  const publicBlackboardKeys = useMemo(() => {
    if (!selectedGraph) return [];
    
    try {
      const graphDef = typeof selectedGraph.graph_definition === 'string' 
        ? JSON.parse(selectedGraph.graph_definition) 
        : selectedGraph.graph_definition;
      
      const blackboard = graphDef?.blackboard || {};
      return Object.keys(blackboard).filter(key => blackboard[key]?.public === true);
    } catch {
      return [];
    }
  }, [selectedGraph]);

  const handleAddMapping = () => {
    const newKey = publicBlackboardKeys.find(k => !mappings.some(m => m.graph_blackboard_key === k)) || publicBlackboardKeys[0];
    if (!newKey) return;
    
    onChange([
      ...mappings,
      {
        graph_blackboard_key: newKey,
        source_type: 'constant',
        constant_value: 0,
        step_size: 1
      }
    ]);
  };

  const handleRemoveMapping = (index) => {
    onChange(mappings.filter((_, i) => i !== index));
  };

  const handleUpdateMapping = (index, field, value) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  if (!selectedGraph) {
    return (
      <div className="text-gray-500 text-xs p-2">
        请先选择曲线 Data Graph
      </div>
    );
  }

  if (publicBlackboardKeys.length === 0) {
    return (
      <div className="text-gray-500 text-xs p-2">
        所选 Data Graph 没有公共黑板变量
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">曲线输入映射</span>
        <Button 
          size="sm" 
          onClick={handleAddMapping}
          className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {mappings.map((mapping, index) => (
        <div key={index} className="border border-[#3d3d3d] rounded p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Select 
              value={mapping.graph_blackboard_key} 
              onValueChange={(val) => handleUpdateMapping(index, 'graph_blackboard_key', val)}
            >
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                {publicBlackboardKeys.map(key => (
                  <SelectItem key={key} value={key} className="text-white hover:bg-[#3d3d3d] text-xs">
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-gray-500 text-xs">←</span>
            
            <Select 
              value={mapping.source_type} 
              onValueChange={(val) => handleUpdateMapping(index, 'source_type', val)}
            >
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                <SelectItem value="tag_count" className="text-white hover:bg-[#3d3d3d] text-xs">
                  标签数量
                </SelectItem>
                <SelectItem value="attribute_key" className="text-white hover:bg-[#3d3d3d] text-xs">
                  属性键
                </SelectItem>
                <SelectItem value="constant" className="text-white hover:bg-[#3d3d3d] text-xs">
                  常量
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              size="sm" 
              onClick={() => handleRemoveMapping(index)}
              className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {mapping.source_type === 'tag_count' && (
            <div className="space-y-1">
              <Input
                value={mapping.tag_path || ''}
                onChange={(e) => handleUpdateMapping(index, 'tag_path', e.target.value)}
                placeholder="标签路径 (如: Status.Buff)"
                className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <Input
                type="number"
                value={mapping.step_size || 1}
                onChange={(e) => handleUpdateMapping(index, 'step_size', parseInt(e.target.value) || 1)}
                placeholder="步长"
                className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
          )}

          {mapping.source_type === 'attribute_key' && (
            <div className="flex gap-2">
              <Select 
                value={mapping.attribute_id || ''} 
                onValueChange={(val) => handleUpdateMapping(index, 'attribute_id', val)}
              >
                <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs flex-1">
                  <SelectValue placeholder="选择属性" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                  {attributes.map(attr => (
                    <SelectItem key={attr.id} value={attr.attribute_id} className="text-white hover:bg-[#3d3d3d] text-xs">
                      {attr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={mapping.attribute_key || ''}
                onChange={(e) => handleUpdateMapping(index, 'attribute_key', e.target.value)}
                placeholder="键名"
                className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white flex-1"
              />
            </div>
          )}

          {mapping.source_type === 'constant' && (
            <Input
              type="number"
              step="0.1"
              value={mapping.constant_value || 0}
              onChange={(e) => handleUpdateMapping(index, 'constant_value', parseFloat(e.target.value) || 0)}
              placeholder="常量值"
              className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            />
          )}
        </div>
      ))}
    </div>
  );
}