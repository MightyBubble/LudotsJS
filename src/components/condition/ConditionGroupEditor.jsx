import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import PresetConditionEditor from './PresetConditionEditor';
import FunctionGraphConditionEditor from './FunctionGraphConditionEditor';

export default function ConditionGroupEditor({ config, onChange, depth = 0 }) {
  const groupConfig = config || { logic_operator: 'AND', sub_conditions: [] };
  const subConditions = typeof groupConfig.sub_conditions === 'string' 
    ? JSON.parse(groupConfig.sub_conditions || '[]') 
    : (groupConfig.sub_conditions || []);

  const [expandedIndices, setExpandedIndices] = useState(new Set());

  const handleAddCondition = (type) => {
    const newCondition = {
      condition_type: type,
      name: `子条件 ${subConditions.length + 1}`,
      ...(type === 'preset' && { preset_config: { preset_name: 'equals' } }),
      ...(type === 'function_graph' && { function_graph_config: { function_graph_id: '', input_mappings: [] } }),
      ...(type === 'group' && { group_config: { logic_operator: 'AND', sub_conditions: [] } })
    };
    const updated = [...subConditions, newCondition];
    onChange({ ...groupConfig, sub_conditions: JSON.stringify(updated) });
  };

  const handleUpdateCondition = (index, updatedCondition) => {
    const updated = [...subConditions];
    updated[index] = { ...updated[index], ...updatedCondition };
    onChange({ ...groupConfig, sub_conditions: JSON.stringify(updated) });
  };

  const handleRemoveCondition = (index) => {
    const updated = subConditions.filter((_, i) => i !== index);
    onChange({ ...groupConfig, sub_conditions: JSON.stringify(updated) });
  };

  const toggleExpand = (index) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (depth > 3) {
    return <div className="text-xs text-red-400">嵌套层级过深（最多4层）</div>;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1.5 block">逻辑操作符</label>
        <Select
          value={groupConfig.logic_operator}
          onValueChange={(val) => onChange({ ...groupConfig, logic_operator: val })}
        >
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="AND" className="text-white text-xs">AND（与）</SelectItem>
            <SelectItem value="OR" className="text-white text-xs">OR（或）</SelectItem>
            <SelectItem value="NOT" className="text-white text-xs">NOT（非）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/70">子条件</label>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => handleAddCondition('preset')}
              className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs"
            >
              预设
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddCondition('function_graph')}
              className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs"
            >
              函数
            </Button>
            {depth < 3 && (
              <Button
                size="sm"
                onClick={() => handleAddCondition('group')}
                className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs"
              >
                组
              </Button>
            )}
          </div>
        </div>

        {subConditions.map((condition, idx) => {
          const isExpanded = expandedIndices.has(idx);
          return (
            <div
              key={idx}
              className="p-2 bg-[#1e1e1e] rounded border border-[#3e3e42]"
              style={{ marginLeft: `${depth * 8}px` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleExpand(idx)} className="text-white/50 hover:text-white">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <span className="text-xs text-white/90">
                    {condition.condition_type === 'preset' ? '预设条件' : 
                     condition.condition_type === 'function_graph' ? '函数图条件' : '条件组'}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveCondition(idx)}
                  className="text-white/30 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {isExpanded && (
                <div className="pl-6">
                  {condition.condition_type === 'preset' && (
                    <PresetConditionEditor
                      config={condition.preset_config}
                      onChange={(val) => handleUpdateCondition(idx, { preset_config: val })}
                    />
                  )}

                  {condition.condition_type === 'function_graph' && (
                    <FunctionGraphConditionEditor
                      config={condition.function_graph_config}
                      onChange={(val) => handleUpdateCondition(idx, { function_graph_config: val })}
                    />
                  )}

                  {condition.condition_type === 'group' && (
                    <ConditionGroupEditor
                      config={condition.group_config}
                      onChange={(val) => handleUpdateCondition(idx, { group_config: val })}
                      depth={depth + 1}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {subConditions.length === 0 && (
          <div className="text-xs text-white/30 italic py-2">暂无子条件</div>
        )}
      </div>
    </div>
  );
}