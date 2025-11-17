import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RequirementNodeEditor({ config, onChange }) {
  const nodeConfig = config || { logic_operator: 'AND', sub_requirements: [] };

  const { data: validators = [] } = useQuery({
    queryKey: ['validators'],
    queryFn: () => base44.entities.Validator.list(),
    initialData: [],
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list(),
    initialData: [],
  });

  const handleUpdate = (field, value) => {
    onChange({ ...nodeConfig, [field]: value });
  };

  const addSubRequirement = (type) => {
    const subs = nodeConfig.sub_requirements || [];
    const newSub = {
      type,
      negate: false,
      ...(type === 'validator' && { validator_id: '' }),
      ...(type === 'requirement' && { requirement_id: '' })
    };
    onChange({ ...nodeConfig, sub_requirements: [...subs, newSub] });
  };

  const updateSubRequirement = (index, field, value) => {
    const subs = [...(nodeConfig.sub_requirements || [])];
    subs[index] = { ...subs[index], [field]: value };
    onChange({ ...nodeConfig, sub_requirements: subs });
  };

  const removeSubRequirement = (index) => {
    const subs = (nodeConfig.sub_requirements || []).filter((_, i) => i !== index);
    onChange({ ...nodeConfig, sub_requirements: subs });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1 block">逻辑操作符</label>
        <Select value={nodeConfig.logic_operator} onValueChange={(val) => handleUpdate('logic_operator', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="AND" className="text-white text-xs">AND（与）</SelectItem>
            <SelectItem value="OR" className="text-white text-xs">OR（或）</SelectItem>
            <SelectItem value="XOR" className="text-white text-xs">XOR（异或）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/70">子需求</label>
          <Button size="sm" onClick={() => addSubRequirement('validator')} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
            验证器
          </Button>
          <Button size="sm" onClick={() => addSubRequirement('requirement')} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
            需求
          </Button>
        </div>

        {(nodeConfig.sub_requirements || []).map((sub, idx) => (
          <div key={idx} className="p-2 bg-[#1e1e1e] rounded border border-[#3e3e42] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">{sub.type === 'validator' ? '验证器' : '需求'}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <Checkbox 
                    checked={sub.negate || false}
                    onCheckedChange={(checked) => updateSubRequirement(idx, 'negate', checked)}
                    className="h-3 w-3"
                  />
                  <span className="text-xs text-white/50">取反</span>
                </label>
              </div>
              <button onClick={() => removeSubRequirement(idx)} className="text-white/30 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>

            {sub.type === 'validator' && (
              <Select value={sub.validator_id || ''} onValueChange={(val) => updateSubRequirement(idx, 'validator_id', val)}>
                <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
                  <SelectValue placeholder="选择验证器" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                  {validators.map(v => (
                    <SelectItem key={v.id} value={v.validator_id} className="text-white text-xs">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {sub.type === 'requirement' && (
              <Select value={sub.requirement_id || ''} onValueChange={(val) => updateSubRequirement(idx, 'requirement_id', val)}>
                <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
                  <SelectValue placeholder="选择需求" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                  {requirements.map(r => (
                    <SelectItem key={r.id} value={r.requirement_id} className="text-white text-xs">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}

        {(nodeConfig.sub_requirements || []).length === 0 && (
          <div className="text-xs text-white/30 italic py-2">暂无子需求</div>
        )}
      </div>
    </div>
  );
}