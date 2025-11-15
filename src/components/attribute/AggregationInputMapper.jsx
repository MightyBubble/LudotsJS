import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export default function AggregationInputMapper({ 
  dataGraphId, 
  dataGraphs, 
  aggregationKeys,
  mappings, 
  onChange 
}) {
  const selectedGraph = useMemo(() => {
    return dataGraphs.find(g => g.graph_id === dataGraphId);
  }, [dataGraphs, dataGraphId]);

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
    const newKey = publicBlackboardKeys.find(k => !mappings[k]) || publicBlackboardKeys[0];
    if (!newKey) return;
    
    onChange({
      ...mappings,
      [newKey]: aggregationKeys[0] || ''
    });
  };

  const handleRemoveMapping = (key) => {
    const newMappings = { ...mappings };
    delete newMappings[key];
    onChange(newMappings);
  };

  const handleChangeGraphKey = (oldKey, newKey) => {
    const newMappings = { ...mappings };
    const value = newMappings[oldKey];
    delete newMappings[oldKey];
    newMappings[newKey] = value;
    onChange(newMappings);
  };

  const handleChangeAggKey = (graphKey, aggKey) => {
    onChange({
      ...mappings,
      [graphKey]: aggKey
    });
  };

  if (!selectedGraph) {
    return (
      <div className="text-gray-500 text-xs p-2">
        请先选择 Data Graph
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
        <span className="text-xs text-gray-400">Graph 黑板键 → 属性聚合键</span>
        <Button 
          size="sm" 
          onClick={handleAddMapping}
          className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {Object.entries(mappings).map(([graphKey, aggKey]) => (
        <div key={graphKey} className="flex items-center gap-2">
          <Select value={graphKey} onValueChange={(val) => handleChangeGraphKey(graphKey, val)}>
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
          
          <span className="text-gray-500">→</span>
          
          <Select value={aggKey} onValueChange={(val) => handleChangeAggKey(graphKey, val)}>
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {aggregationKeys.map(key => (
                <SelectItem key={key} value={key} className="text-white hover:bg-[#3d3d3d] text-xs">
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            size="sm" 
            onClick={() => handleRemoveMapping(graphKey)}
            className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}