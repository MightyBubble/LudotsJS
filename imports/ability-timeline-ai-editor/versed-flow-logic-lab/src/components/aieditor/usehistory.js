// 撤销/重做共享 hook（全部编辑器统一，对齐 React Flow 官方 Undo/Redo Pro 模式）。
// 用法：useUndoRedo(getSnapshot, applySnapshot, watch)
//   getSnapshot() → 当前数据快照（JSON 字符串）
//   applySnapshot(s) → 把快照写回编辑器状态
//   watch = [被监听的 state]：变化时自动把"变化前的快照"压栈
// 拖拽在 dragStop 才写回数据模型 → 一次拖动天然合并为一条记录；
// 撤销/重做自身引发的变化自动跳过，不会污染历史。
// 快捷键：Ctrl/Cmd+Z 撤销 · Ctrl/Cmd+Y 或 Ctrl/Cmd+Shift+Z 重做（输入框聚焦时不拦截）。
import { useCallback, useEffect, useRef, useState } from 'react';

const LIMIT = 60;

export function useUndoRedo(getSnapshot, applySnapshot, watch) {
  const hist = useRef({ past: [], future: [] });
  const last = useRef(null);      // 上次记录的快照
  const applying = useRef(false); // 本次变化由 undo/redo 引起
  const [, setVer] = useState(0);
  const bump = () => setVer((v) => v + 1);

  // 自动压栈：watch 变化时，把变化前的快照压入 past
  useEffect(() => {
    const snap = getSnapshot();
    if (snap == null) return; // 数据未就绪（null）时不记录
    if (last.current === null) { last.current = snap; return; }
    if (applying.current) { applying.current = false; last.current = snap; return; }
    if (last.current !== snap) {
      hist.current.past.push(last.current);
      if (hist.current.past.length > LIMIT) hist.current.past.shift();
      hist.current.future = [];
      last.current = snap;
      bump();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, watch);

  const undo = useCallback(() => {
    const h = hist.current;
    if (!h.past.length) return;
    applying.current = true;
    h.future.push(getSnapshot());
    const s = h.past.pop();
    last.current = s;
    applySnapshot(s);
    bump();
  }, [getSnapshot, applySnapshot]);

  const redo = useCallback(() => {
    const h = hist.current;
    if (!h.future.length) return;
    applying.current = true;
    h.past.push(getSnapshot());
    const s = h.future.pop();
    last.current = s;
    applySnapshot(s);
    bump();
  }, [getSnapshot, applySnapshot]);

  // 切换文档/清空数据时调用：历史与基线一并重置
  const clear = useCallback(() => {
    hist.current = { past: [], future: [] };
    last.current = null;
    bump();
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo]);

  return { undo, redo, clear, canUndo: hist.current.past.length > 0, canRedo: hist.current.future.length > 0 };
}
