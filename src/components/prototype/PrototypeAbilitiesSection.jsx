import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Section } from "@/components/ludots/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SLOT_LABELS = ["槽位 0 (Q)", "槽位 1 (W)", "槽位 2 (E)", "槽位 3 (R)"];
const inputCls = "h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white";

export default function PrototypeAbilitiesSection({ abilityIds = [], formSetRef = "", abilities = [], onChange }) {
  const setList = (list) => onChange({ ability_ids: list });
  const move = (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= abilityIds.length) return;
    const list = [...abilityIds];
    [list[index], list[next]] = [list[next], list[index]];
    setList(list);
  };

  return (
    <Section title="技能授予">
      <div className="space-y-2">
        {abilityIds.map((abilityId, index) => (
          <div key={index} className="grid grid-cols-[92px_1fr_auto] gap-2 items-center">
            <span className="text-[10px] text-gray-500 font-mono">{SLOT_LABELS[index] || `槽位 ${index}`}</span>
            <Select value={abilityId} onValueChange={(value) => { const list = [...abilityIds]; list[index] = value; setList(list); }}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="选择技能" /></SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {abilities.map((a) => <SelectItem key={a.id} value={a.ability_id}>{a.ability_id}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex">
              <Button size="sm" variant="ghost" onClick={() => move(index, -1)} className="h-7 w-7 p-0 text-gray-400"><ChevronUp className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => move(index, 1)} className="h-7 w-7 p-0 text-gray-400"><ChevronDown className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setList(abilityIds.filter((_, i) => i !== index))} className="h-7 w-7 p-0 text-red-400"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" onClick={() => setList([...abilityIds, ""])} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加技能</Button>

      <div className="pt-2">
        <label className="block text-xs text-gray-400 mb-1">技能组引用 (form set id)</label>
        <Input value={formSetRef || ""} onChange={(e) => onChange({ ability_form_set_ref: e.target.value })} placeholder="留空表示无形态切换" className={inputCls} />
        <p className="text-[10px] text-gray-500 mt-1">对应 AbilityFormSetRef.formSetId；技能组本体（routes / slotOverrides）为独立资源，尚未建编辑器。</p>
      </div>
    </Section>
  );
}