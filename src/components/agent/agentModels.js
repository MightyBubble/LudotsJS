export const AGENT_MODELS = [
  { value: 'automatic', label: '自动选型' },
  { value: 'gpt_5_mini', label: 'GPT-5 mini' },
  { value: 'gpt_5_4', label: 'GPT-5.4' },
  { value: 'gpt_5_6_sol', label: 'GPT-5.6 Sol' },
  { value: 'gpt_5_6_luna', label: 'GPT-5.6 Luna' },
  { value: 'gemini_3_flash', label: 'Gemini 3 Flash（可联网）' },
  { value: 'gemini_3_1_pro', label: 'Gemini 3.1 Pro（可联网）' },
  { value: 'claude_sonnet_4_6', label: 'Claude Sonnet 4.6' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
  { value: 'claude_opus_4_6', label: 'Claude Opus 4.6' },
  { value: 'claude_opus_4_7', label: 'Claude Opus 4.7' },
  { value: 'claude_opus_4_8', label: 'Claude Opus 4.8' },
];

export const modelLabel = (value) =>
  AGENT_MODELS.find((m) => m.value === value)?.label || value;