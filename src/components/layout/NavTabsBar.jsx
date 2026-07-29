import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavTabsBar({ groups, currentPageName, leading = null }) {
  const location = useLocation();
  const currentGroup = groups.find(g => g.items.some(i => i.page === currentPageName));
  const [activeKey, setActiveKey] = useState(currentGroup?.key || groups[0]?.key);

  useEffect(() => {
    if (currentGroup) setActiveKey(currentGroup.key);
  }, [currentGroup?.key]);

  const active = groups.find(g => g.key === activeKey) || groups[0];

  return (
    <>
      {/* 第一行：工作区 + 顶层模块 Tab */}
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] hidden md:flex items-stretch px-2 gap-2 overflow-x-auto">
        {leading && <div className="flex items-center gap-2 shrink-0">{leading}</div>}
        <div className="w-px my-2 bg-[#2A2E37] shrink-0" />
        {groups.map(g => (
          <button
            key={g.key}
            onClick={() => setActiveKey(g.key)}
            className={`px-3 text-xs whitespace-nowrap border-b-2 transition-colors ${
              g.key === active?.key
                ? "border-[#D97706] text-[#E2D8B3]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* 第二行：当前模块下的条目 Tab */}
      <div className="h-8 bg-[#0D0F14] border-b border-[#2A2E37] hidden md:flex items-center gap-1 px-2 overflow-x-auto">
        {active?.items.map(item => {
          const isActive =
            item.page === currentPageName &&
            (item.search || "") === (location.search || "");
          return (
            <Link
              key={item.page + (item.search || "")}
              to={`/${item.page}${item.search || ""}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] whitespace-nowrap ${
                isActive
                  ? "bg-[#D97706] text-black"
                  : "text-gray-400 hover:bg-[#1E2128] hover:text-gray-200"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}