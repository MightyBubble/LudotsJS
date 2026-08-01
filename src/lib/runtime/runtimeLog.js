/** 运行时日志总线：正式 API，UI 控制台只是它的一个订阅者。 */
export function createRuntimeLog({ limit = 300 } = {}) {
  let entries = [];
  const listeners = new Set();

  // 异步派发：runtime 可以在渲染期间写日志，而不会同步驱动订阅者的 setState
  const emit = () => queueMicrotask(() => listeners.forEach(fn => fn(entries)));

  return {
    log(level, channel, message, data) {
      entries = [
        ...entries.slice(-(limit - 1)),
        { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, at: Date.now(), level, channel, message, data },
      ];
      emit();
    },
    info(channel, message, data) { this.log('info', channel, message, data); },
    warn(channel, message, data) { this.log('warn', channel, message, data); },
    error(channel, message, data) { this.log('error', channel, message, data); },
    clear() { entries = []; emit(); },
    getEntries: () => entries,
    subscribe(fn) { listeners.add(fn); fn(entries); return () => listeners.delete(fn); },
  };
}