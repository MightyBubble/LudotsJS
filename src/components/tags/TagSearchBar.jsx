import React from "react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

export default function TagSearchBar({ value, onChange, filterCategory, onFilterChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="搜索标签..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
        />
      </div>

      <Select value={filterCategory} onValueChange={onFilterChange}>
        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部</SelectItem>
          <SelectItem value="ability">能力</SelectItem>
          <SelectItem value="state">状态</SelectItem>
          <SelectItem value="effect">效果</SelectItem>
          <SelectItem value="item">道具</SelectItem>
          <SelectItem value="event">事件</SelectItem>
          <SelectItem value="ui">界面</SelectItem>
          <SelectItem value="audio">音频</SelectItem>
          <SelectItem value="gameplay">玩法</SelectItem>
          <SelectItem value="other">其他</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}