import { ChatOpenAI } from '@langchain/openai';

const llmProviders = {
  deepseek: new ChatOpenAI({
    openAIApiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: 'https://api.deepseek.com',
    },
    model: 'deepseek-chat',
    temperature: 0.3,
  }),

  yandex: new ChatOpenAI({
    openAIApiKey: process.env.YANDEX_API_KEY,
    configuration: {
      baseURL: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    },
    model: 'yandexgpt/latest',
    temperature: 0.3,
  }),
};

// Fallback chain: DeepSeek → Yandex GPT
export const getLLM = () => {
  const provider = process.env.LLM_PROVIDER || 'deepseek';
  return provider === 'yandex' ? llmProviders.yandex : llmProviders.deepseek;
};
