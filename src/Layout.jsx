import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { NAV_GROUPS, ALL_NAV_ITEMS } from "@/components/layout/navConfig";
import NavGroupMenu from "@/components/layout/NavGroupMenu";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLabel = ALL_NAV_ITEMS.find(i => i.page === currentPageName)?.label || "Ludots";

  return (
    <div className="h-screen bg-[#0D0F14] flex flex-col">
      <style>{`
        body {
          background: #0D0F14;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #e5e5e5;
        }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: #15171C; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>

      {/* 桌面端：分组下拉导航，顶栏不再横向滚动 */}
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] hidden md:flex items-center px-4 gap-1 overflow-hidden">
        <span className="text-xs font-semibold text-[#E2D8B3] mr-2 whitespace-nowrap">Ludots</span>
        {NAV_GROUPS.map(group => (
          <NavGroupMenu key={group.label} group={group} currentPageName={currentPageName} />
        ))}
        <div className="flex-1" />
        <span className="text-[11px] text-gray-500 truncate max-w-[220px]">{currentLabel}</span>
      </div>

      {/* 移动端导航 */}
      <div className="h-14 bg-[#15171C] border-b border-[#2A2E37] md:hidden flex items-center px-4 justify-between">
        <span className="text-sm font-semibold text-[#e5e5e5]">{currentLabel}</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#15171C] border-b border-[#2A2E37] overflow-y-auto max-h-[60vh]">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <div className="px-4 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider bg-[#0D0F14] border-b border-[#2A2E37]">
                {group.label}
              </div>
              {group.items.map(item => (
                <Link
                  key={item.page + (item.search || '')}
                  to={`/${item.page}${item.search || ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[#2A2E37] text-sm ${
                    item.page === currentPageName ? "bg-[#D97706] text-black" : "text-gray-300"
                  }`}
                >
                  <item.icon className="w-4 h-4" />{item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}