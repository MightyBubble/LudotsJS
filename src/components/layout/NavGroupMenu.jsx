import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** 单个分组下拉：触发按钮在组内页面被选中时高亮 */
export default function NavGroupMenu({ group, currentPageName }) {
  const active = group.items.some(i => i.page === currentPageName);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
            active ? 'bg-[#D97706] text-black' : 'text-gray-400 hover:bg-[#2A2E37] hover:text-white'
          }`}
        >
          {group.label}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-[#15171C] border-[#2A2E37] text-gray-300 min-w-44">
        {group.items.map(item => (
          <DropdownMenuItem key={item.page + (item.search || '')} asChild className="focus:bg-[#2A2E37] focus:text-white cursor-pointer">
            <Link to={`/${item.page}${item.search || ''}`} className="flex items-center gap-2 text-xs">
              <item.icon className={`w-3.5 h-3.5 ${item.page === currentPageName ? 'text-[#D97706]' : ''}`} />
              <span className={item.page === currentPageName ? 'text-[#D97706]' : ''}>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}