import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

export default function RecoveryConfigPanel({ config, keys, onChange }) {
  const recoveryConfig = config || { enabled: false };

  const handleChange = (field, value) => {
    onChange({ ...recoveryConfig, [field]: value });
  };

  return (
    <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white/90">回复行为</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={recoveryConfig.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-xs text-white/70">启用</span>
        </label>
      </div>

      {recoveryConfig.enabled && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-white/50 mb-1 block">目标键</label>
            <Select
              value={recoveryConfig.target_key || ''}
              onValueChange={(v) => handleChange('target_key', v)}
            >
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择要回复的键" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                {keys.map(k => (
                  <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/50 mb-1 block">回复速率/秒</label>
              <Input
                type="number"
                step="0.1"
                value={recoveryConfig.recovery_rate ?? 1}
                onChange={(e) => handleChange('recovery_rate', parseFloat(e.target.value) || 0)}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">延迟（秒）</label>
              <Input
                type="number"
                step="0.1"
                value={recoveryConfig.recovery_delay ?? 0}
                onChange={(e) => handleChange('recovery_delay', parseFloat(e.target.value) || 0)}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}