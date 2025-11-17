import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ParameterSourceEditor from './ParameterSourceEditor';

export default function FunctionGraphConditionEditor({ config, onChange }) {
  const functionConfig = config || { function_graph_id: '', input_mappings: [] };

  const { data: functionGraphs = [] } = useQuery({
    queryKey: ['functionGraphs'],
    queryFn: () => base44.entities.FunctionGraph.list(),
    initialData: [],
  });

  const booleanGraphs = functionGraphs.filter(g => g.return_type === 'boolean');

  const selectedGraph = booleanGraphs.find(g => g.graph_id === functionConfig.function_graph_id);
  const graphDef = selectedGraph ? (typeof selectedGraph.graph_definition === 'string' 
    ? JSON.parse(selectedGraph.graph_definition) 
    : selectedGraph.graph_definition) : null;
  const blackboard = graphDef?.blackboard || {};
  const publicKeys = Object.keys(blackboard).filter(k => blackboard[k]?.public);

  const handleAddMapping = () => {
    const newMapping = {
      graph_blackboard_key: publicKeys[0] || '',
      source_type: 'literal',
      literal_value: ''
    };
    onChange({
      ...functionConfig,
      input_mappings: [...(functionConfig.input_mappings || []), newMapping]
    });
  };

  const handleUpdateMapping = (index, field, value) => {
    const mappings = [...(functionConfig.input_mappings || [])];
    mappings[index] = { ...mappings[index], [field]: value };
    onChange({ ...functionConfig, input_mappings: mappings });
  };

  const handleRemoveMapping = (index) => {
    onChange({
      ...functionConfig,
      input_mappings: (functionConfig.input_mappings || []).filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1.5 block">函数图（返回布尔值）</label>
        <Select
          value={functionConfig.function_graph_id}
          onValueChange={(val) => onChange({ ...functionConfig, function_graph_id: val, input_mappings: [] })}
        >
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择函数图" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {booleanGraphs.map(g => (
              <SelectItem key={g.id} value={g.graph_id} className="text-white text-xs">
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {functionConfig.function_graph_id && publicKeys.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/70">输入映射</label>
            <Button
              size="sm"
              onClick={handleAddMapping}
              className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {(functionConfig.input_mappings || []).map((mapping, idx) => (
            <div key={idx} className="p-2 bg-[#1e1e1e] rounded border border-[#3e3e42] space-y-2">
              <div className="flex items-center justify-between">
                <Select
                  value={mapping.graph_blackboard_key}
                  onValueChange={(val) => handleUpdateMapping(idx, 'graph_blackboard_key', val)}
                >
                  <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                    {publicKeys.map(k => (
                      <SelectItem key={k} value={k} className="text-white text-xs">
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => handleRemoveMapping(idx)}
                  className="text-white/30 hover:text-red-400 ml-2"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <ParameterSourceEditor
                label="映射值"
                value={mapping}
                onChange={(val) => {
                  const { source_type, ...rest } = val;
                  handleUpdateMapping(idx, 'source_type', source_type);
                  Object.keys(rest).forEach(k => handleUpdateMapping(idx, k, rest[k]));
                }}
                allowEntityTag={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}