import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

export default function ExtraKeysEditor({ extraKeys, dataGraphs, onChange }) {
  const handleAddKey = () => {
    onChange([
      ...(extraKeys || []),
      {
        key: '',
        value_type: 'constant',
        constant_value: 0
      }
    ]);
  };

  const handleRemoveKey = (index) => {
    onChange(extraKeys.filter((_, i) => i !== index));
  };

  const handleUpdateKey = (index, field, value) => {
    const updated = [...extraKeys];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const curveGraphs = dataGraphs.filter(g => g.graph_type === 'curve');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">额外键值配置</span>
        <Button 
          size="sm" 
          onClick={handleAddKey}
          className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {(extraKeys || []).map((item, index) => (
        <div key={index} className="border border-[#3d3d3d] rounded p-2 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={item.key}
              onChange={(e) => handleUpdateKey(index, 'key', e.target.value)}
              placeholder="键名 (如: max_value)"
              className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white flex-1"
            />
            
            <Select 
              value={item.value_type} 
              onValueChange={(val) => handleUpdateKey(index, 'value_type', val)}
            >
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                <SelectItem value="constant" className="text-white hover:bg-[#3d3d3d] text-xs">
                  常量
                </SelectItem>
                <SelectItem value="data_graph" className="text-white hover:bg-[#3d3d3d] text-xs">
                  Data Graph
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              size="sm" 
              onClick={() => handleRemoveKey(index)}
              className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {item.value_type === 'constant' && (
            <Input
              type="number"
              step="0.1"
              value={item.constant_value || 0}
              onChange={(e) => handleUpdateKey(index, 'constant_value', parseFloat(e.target.value) || 0)}
              placeholder="常量值"
              className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            />
          )}

          {item.value_type === 'data_graph' && (
            <Select 
              value={item.data_graph_id || ''} 
              onValueChange={(val) => handleUpdateKey(index, 'data_graph_id', val)}
            >
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                <SelectValue placeholder="选择 Data Graph" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                {curveGraphs.map(g => (
                  <SelectItem key={g.id} value={g.graph_id} className="text-white hover:bg-[#3d3d3d] text-xs">
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}