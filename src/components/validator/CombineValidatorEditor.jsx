import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CombineValidatorEditor({ config, onChange }) {
  const combineConfig = config || { logic_operator: 'AND', sub_validator_ids: [] };

  const { data: validators = [] } = useQuery({
    queryKey: ['validators'],
    queryFn: () => base44.entities.Validator.list(),
    initialData: [],
  });

  const handleUpdate = (field, value) => {
    onChange({ ...combineConfig, [field]: value });
  };

  const addValidator = () => {
    const ids = combineConfig.sub_validator_ids || [];
    onChange({ ...combineConfig, sub_validator_ids: [...ids, ''] });
  };

  const updateValidator = (index, value) => {
    const ids = [...(combineConfig.sub_validator_ids || [])];
    ids[index] = value;
    onChange({ ...combineConfig, sub_validator_ids: ids });
  };

  const removeValidator = (index) => {
    const ids = (combineConfig.sub_validator_ids || []).filter((_, i) => i !== index);
    onChange({ ...combineConfig, sub_validator_ids: ids });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1 block">逻辑操作符</label>
        <Select value={combineConfig.logic_operator} onValueChange={(val) => handleUpdate('logic_operator', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="AND" className="text-white text-xs">AND（与）</SelectItem>
            <SelectItem value="OR" className="text-white text-xs">OR（或）</SelectItem>
            <SelectItem value="NOT" className="text-white text-xs">NOT（非）</SelectItem>
            <SelectItem value="XOR" className="text-white text-xs">XOR（异或）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/70">子验证器</label>
          <Button size="sm" onClick={addValidator} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        {(combineConfig.sub_validator_ids || []).map((id, idx) => (
          <div key={idx} className="flex gap-2">
            <Select value={id} onValueChange={(val) => updateValidator(idx, val)}>
              <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs flex-1">
                <SelectValue placeholder="选择验证器" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                {validators.map(v => (
                  <SelectItem key={v.id} value={v.validator_id} className="text-white text-xs">{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button onClick={() => removeValidator(idx)} className="text-white/30 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(combineConfig.sub_validator_ids || []).length === 0 && (
          <div className="text-xs text-white/30 italic py-2">暂无子验证器</div>
        )}
      </div>
    </div>
  );
}