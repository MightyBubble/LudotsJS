import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePageActionsSlot } from "@/components/shell/PageActions";
import { useI18n } from "@/i18n/I18nProvider";

const itemPath = (item) => `/${item.page}${item.search || ""}`;

export default function NavTabsBar({ groups, currentPageName, leading = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentGroup = groups.find(g => g.items.some(i => i.page === currentPageName));
  const [activeKey, setActiveKey] = useState(currentGroup?.key || groups[0]?.key);
  const setSlot = usePageActionsSlot();
  const { t } = useI18n();
  const lastVisited = useRef({});

  useEffect(() => {
    if (currentGroup) setActiveKey(currentGroup.key);
  }, [currentGroup?.key]);

  // 记住每个模块最后访问的条目
  useEffect(() => {
    if (!currentGroup) return;
    const match = currentGroup.items.find(
      i => i.page === currentPageName && (i.search || "") === (location.search || "")
    ) || currentGroup.items.find(i => i.page === currentPageName);
    if (match) lastVisited.current[currentGroup.key] = itemPath(match);
  }, [currentGroup?.key, currentPageName, location.search]);

  const active = groups.find(g => g.key === activeKey) || groups[0];

  const openGroup = (g) => {
    setActiveKey(g.key);
    const target = lastVisited.current[g.key] || (g.items[0] && itemPath(g.items[0]));
    if (target && target !== `${location.pathname}${location.search}`) navigate(target);
  };

  return (
    <>
      {/* 一级：工作区 + 模块 */}
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] hidden md:flex items-stretch px-2 gap-2 overflow-x-auto">
        {leading && <div className="flex items-center gap-2 shrink-0">{leading}</div>}
        <div className="w-px my-2 bg-[#2A2E37] shrink-0" />
        {groups.map(g => (
          <button
            key={g.key}
            onClick={() => openGroup(g)}
            className={`px-3 text-xs whitespace-nowrap border-b-2 transition-colors ${
              g.key === active?.key
                ? "border-[#D97706] text-[#E2D8B3]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            {g.isCustomLabel ? g.label : t(`nav.${g.key}`, g.label)}
          </button>
        ))}
      </div>

      {/* 二级：当前模块的条目（即页面标题） + 右侧当前页操作区 */}
      <div className="min-h-9 h-auto bg-[#0D0F14] border-b border-[#2A2E37] flex flex-wrap items-center gap-1 px-2 py-1 overflow-visible">
        {active?.items.map(item => {
          const isActive =
            item.page === currentPageName &&
            (item.search || "") === (location.search || "");
          return (
            <Link
              key={item.page + (item.search || "")}
              to={itemPath(item)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] whitespace-nowrap ${
                isActive
                  ? "bg-[#D97706] text-black"
                  : "text-gray-400 hover:bg-[#1E2128] hover:text-gray-200"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {t(`page.${item.page}${item.search || ''}`, item.label)}
            </Link>
          );
        })}
        <div ref={setSlot} className="order-last md:order-none w-full md:w-auto ml-0 md:ml-auto flex flex-wrap items-center gap-2 pt-1 md:pt-0 md:pl-3 shrink-0" />
      </div>
    </>
  );
}