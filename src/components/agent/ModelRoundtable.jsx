import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { Loader2, Send } from 'lucide-react';
import { AGENT_MODELS, modelLabel } from './agentModels';
import { runMiniAgent } from '@/lib/agentkit/miniAgent';
import AgentThreadSteps from './AgentThreadSteps';

export default function ModelRoundtable() {
  const [selected, setSelected] = useState(['gpt_5_4', 'claude_sonnet_4_6']);
  const [rounds, setRounds] = useState(1);
  const [input, setInput] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [running, setRunning] = useState(false);

  const toggle = (v) =>
    setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const run = async () => {
    const topic = input.trim();
    if (!topic || !selected.length || running) return;
    setRunning(true);
    setInput('');
    let log = [...transcript, { model: null, role: 'user', content: topic }];
    setTranscript(log);
    for (let r = 0; r < rounds; r++) {
      for (const model of selected) {
        const history = log
          .map((m) => (m.role === 'user' ? `【用户】${m.content}` : `【${modelLabel(m.model)}】${m.content}`))
          .join('\n\n');
        log = [...log, { model, role: 'assistant', content: '', round: r + 1, steps: [] }];
        const idx = log.length - 1;
        setTranscript(log);
        const { answer, steps } = await runMiniAgent({
          model,
          role: modelLabel(model),
          task: `请针对以下讨论表达你的观点，可补充或明确反驳其他模型。\n\n讨论记录：\n${history}`,
          onStep: (step) => {
            log = log.map((m, i) => (i === idx ? { ...m, steps: [...m.steps, step] } : m));
            setTranscript(log);
          },
        });
        log = log.map((m, i) => (i === idx ? { ...m, content: answer, steps } : m));
        setTranscript(log);
      }
    }
    setRunning(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-[#2A2E37] p-2 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">参与模型（可多选）</div>
        <div className="flex flex-wrap gap-1">
          {AGENT_MODELS.filter((m) => m.value !== 'automatic').map((m) => (
            <button
              key={m.value}
              onClick={() => toggle(m.value)}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${selected.includes(m.value) ? 'bg-[#303845] border-[#cbd3dc] text-gray-100' : 'bg-[#0D0F14] border-[#2A2E37] text-gray-500'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[10px] text-gray-400">
          讨论轮数
          <input
            type="number"
            min={1}
            max={4}
            value={rounds}
            onChange={(e) => setRounds(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
            className="w-14 bg-[#0D0F14] border border-[#2A2E37] rounded px-1.5 py-0.5 text-gray-200"
          />
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {transcript.length === 0 && (
          <p className="text-[11px] text-gray-600">选好模型，提出一个设计议题，让它们交叉讨论并互相反驳。</p>
        )}
        {transcript.map((m, i) => (
          <div key={i} className={`rounded px-2.5 py-2 text-xs ${m.role === 'user' ? 'bg-[#242a32] text-gray-100' : 'bg-[#15171C] border border-[#2A2E37] text-gray-200'}`}>
            <div className="text-[10px] text-gray-500 mb-1">
              {m.role === 'user' ? '你' : `${modelLabel(m.model)} · 第 ${m.round} 轮`}
            </div>
            {m.role !== 'user' && <AgentThreadSteps steps={m.steps} />}
            {m.role === 'user'
              ? <p className="whitespace-pre-wrap">{m.content}</p>
              : <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-xs">{m.content}</ReactMarkdown>}
          </div>
        ))}
        {running && <div className="flex items-center gap-1.5 text-[10px] text-gray-500"><Loader2 className="w-3 h-3 animate-spin" />讨论进行中…</div>}
      </div>

      <div className="border-t border-[#2A2E37] p-2 flex items-end gap-1.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
          rows={2}
          placeholder="提出议题，或对上一轮继续追问…"
          className="flex-1 bg-[#0D0F14] border border-[#2A2E37] rounded text-xs text-gray-200 p-2 resize-none outline-none"
        />
        <button
          onClick={run}
          disabled={running}
          className="h-8 px-2 rounded bg-[#242a32] border border-[#424a55] text-gray-200 hover:bg-[#303845] disabled:opacity-50"
        >
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}