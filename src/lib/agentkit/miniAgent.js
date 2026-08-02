import { base44 } from '@/api/base44Client';
import { AGENT_TOOLS, toolManual } from './tools';

const STEP_SCHEMA = {
  type: 'object',
  properties: {
    thought: { type: 'string', description: '一句话说明你打算做什么' },
    action: { type: 'string', enum: ['tool', 'final'] },
    tool: { type: 'string', description: 'action=tool 时的工具名' },
    args_json: { type: 'string', description: 'action=tool 时的参数，JSON 字符串' },
    answer: { type: 'string', description: 'action=final 时的最终发言（中文，Markdown，200 字内）' },
  },
  required: ['thought', 'action'],
};

const safeParse = (s) => { try { return JSON.parse(s || '{}'); } catch { return {}; } };
const clip = (v, n = 2500) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s.length > n ? s.slice(0, n) + '…(已截断)' : s; };

/**
 * 极简 agentic 线程：单模型自主循环「思考 → 调用只读工具 → 观察」直到给出结论。
 * onStep(step) 用于实时渲染；返回 { answer, steps }。
 */
export async function runMiniAgent({ model, role, task, maxSteps = 4, onStep }) {
  const steps = [];
  const scratch = [];

  for (let i = 0; i < maxSteps; i++) {
    const last = i === maxSteps - 1;
    const res = await base44.integrations.Core.InvokeLLM({
      model,
      response_json_schema: STEP_SCHEMA,
      prompt: `你是「${role}」，正在参与一场关于游戏配置编辑器的多方讨论。你拥有只读工具，可以先查证真实配置数据，再表达观点。

可用工具：
${toolManual()}

规则：
- 每次只输出一步。需要取证时 action=tool；证据足够或无需取证时 action=final。
- final 的 answer 用中文 Markdown，200 字内，基于真实数据表达观点，可明确反驳他人。
- 禁止编造数据；工具没查到就说没查到。${last ? '\n- 这是最后一步，必须 action=final。' : ''}

任务与讨论上下文：
${task}

你已经完成的步骤：
${scratch.length ? scratch.join('\n') : '（还没有）'}`,
    });

    if (res.action === 'tool' && AGENT_TOOLS[res.tool] && !last) {
      const args = safeParse(res.args_json);
      let observation;
      try {
        observation = clip(await AGENT_TOOLS[res.tool].run(args));
      } catch (e) {
        observation = `工具出错：${e.message}`;
      }
      const step = { kind: 'tool', thought: res.thought, tool: res.tool, args, observation };
      steps.push(step);
      onStep?.(step);
      scratch.push(`步骤${i + 1}｜思考：${res.thought}｜调用 ${res.tool}(${JSON.stringify(args)})｜结果：${observation}`);
      continue;
    }

    const answer = res.answer || res.thought || '（无输出）';
    const step = { kind: 'final', thought: res.thought, answer };
    steps.push(step);
    onStep?.(step);
    return { answer, steps };
  }

  return { answer: '（未得出结论）', steps };
}