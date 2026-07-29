import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

const Ctx = createContext(null);

/** 提供二级 Tab 行右侧的「当前页操作区」插槽 */
export function PageActionsProvider({ children }) {
  const [node, setNode] = useState(null);
  return <Ctx.Provider value={{ node, setNode }}>{children}</Ctx.Provider>;
}

/** 供 NavTabsBar 挂载插槽容器 */
export function usePageActionsSlot() {
  return useContext(Ctx)?.setNode;
}

/** 页面把自己的操作（搜索 / 新建 / 保存…）投递到二级 Tab 行右侧 */
export default function PageActions({ children }) {
  const ctx = useContext(Ctx);
  if (!ctx?.node) return null;
  return createPortal(<div className="flex items-center gap-2">{children}</div>, ctx.node);
}