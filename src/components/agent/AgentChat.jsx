import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { Send, Loader2 } from 'lucide-react';
import AgentMessageBubble from './AgentMessageBubble';
import AgentConversationList from './AgentConversationList';

const AGENT_NAME = 'config_copilot';

export default function AgentChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const doneToolsRef = useRef(0);
  const scrollRef = useRef(null);

  const loadConversations = async () => {
    const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
    const items = Array.isArray(list) ? list : (list?.conversations || []);
    setConversations(items);
    return items;
  };

  useEffect(() => {
    loadConversations().then((items) => {
      if (items.length && !activeId) setActiveId(items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let cancelled = false;
    base44.agents.getConversation(activeId).then((c) => {
      if (!cancelled) setMessages(c?.messages || []);
    });
    const unsubscribe = base44.agents.subscribeToConversation(activeId, (data) => {
      setMessages(data.messages || []);
      const done = (data.messages || []).reduce(
        (n, m) => n + (m.tool_calls || []).filter(t => ['completed', 'success'].includes(t.status)).length, 0);
      if (done !== doneToolsRef.current) {
        doneToolsRef.current = done;
        queryClientInstance.invalidateQueries();
      }
    });
    return () => { cancelled = true; unsubscribe && unsubscribe(); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const createConversation = async () => {
    const name = `会话 ${new Date().toLocaleString()}`;
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name, description: 'LudotsJS 配置助手会话' },
    });
    doneToolsRef.current = 0;
    await loadConversations();
    setActiveId(conv.id);
    return conv;
  };

  const renameConversation = async (c) => {
    const name = window.prompt('会话名称', c.metadata?.name || '');
    if (!name) return;
    await base44.agents.updateConversation(c.id, { metadata: { ...(c.metadata || {}), name } });
    loadConversations();
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    let conv = activeId ? await base44.agents.getConversation(activeId) : await createConversation();
    await base44.agents.addMessage(conv, { role: 'user', content: text });
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <AgentConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={createConversation}
        onRename={renameConversation}
      />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-[11px] text-gray-600">
            让助手帮你查看或填写配置，例如「把 MOBA 英雄面板的 6 个栏位补全语义绑定」。
          </p>
        )}
        {messages.map((m, i) => <AgentMessageBubble key={i} message={m} />)}
      </div>
      <div className="border-t border-[#2A2E37] p-2">
        <div className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={2}
            placeholder="描述你要查看或修改的配置…"
            className="flex-1 bg-[#0D0F14] border border-[#2A2E37] rounded text-xs text-gray-200 p-2 resize-none outline-none"
          />
          <button
            onClick={send}
            disabled={sending}
            className="h-8 px-2 rounded bg-[#242a32] border border-[#424a55] text-gray-200 hover:bg-[#303845] disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}