import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, Loader2, Check, X } from 'lucide-react';

const isFailed = (tc, parsed) =>
  ['failed', 'error'].includes(tc.status) ||
  (typeof tc.results === 'string' && /error|failed/i.test(tc.results)) ||
  parsed?.success === false;

const parse = (r) => {
  if (r && typeof r === 'object') return r;
  try { return JSON.parse(r); } catch { return r; }
};

function ToolCallRow({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const parsed = parse(toolCall.results);
  const running = ['pending', 'running', 'in_progress'].includes(toolCall.status);
  const failed = isFailed(toolCall, parsed);
  const proj = toolCall.display_projection || {};
  const hidden = proj.hide_details && proj.details_redacted;
  const label = running ? (proj.active_label || '执行中') : failed ? (proj.error_label || '失败') : (proj.label || '完成');

  return (
    <div className="mt-1.5 text-[10px] font-mono">
      <button
        onClick={() => !hidden && setExpanded(!expanded)}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-200"
      >
        {running ? <Loader2 className="w-3 h-3 animate-spin" />
          : failed ? <X className="w-3 h-3 text-red-400" />
          : <Check className="w-3 h-3 text-emerald-400" />}
        <span>{toolCall.name}</span>
        <span className="text-gray-600">· {label}</span>
        {!hidden && <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />}
      </button>
      {expanded && !hidden && (
        <div className="mt-1 space-y-1 bg-[#0D0F14] border border-[#2A2E37] rounded p-2 overflow-x-auto">
          <div className="text-gray-600">参数</div>
          <pre className="text-gray-400 whitespace-pre-wrap">{JSON.stringify(parse(toolCall.arguments_string), null, 2)}</pre>
          <div className="text-gray-600">结果</div>
          <pre className="text-gray-400 whitespace-pre-wrap max-h-40 overflow-y-auto">{typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function AgentMessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`max-w-[92%] rounded px-2.5 py-2 text-xs ${isUser ? 'bg-[#242a32] text-gray-100' : 'bg-[#15171C] border border-[#2A2E37] text-gray-200'}`}>
        {message.content && (isUser
          ? <p className="whitespace-pre-wrap">{message.content}</p>
          : <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-xs">{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((tc, i) => <ToolCallRow key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}