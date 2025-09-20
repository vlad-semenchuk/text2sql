export const LLM = Symbol('LLM_MODEL');

export enum EProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  OpenRouter = 'openrouter',
}

export type LLMProvider = EProvider.OpenAI | EProvider.Anthropic | EProvider.OpenRouter;

export type LLMModuleOptions = {
  provider: LLMProvider;
  [EProvider.OpenAI]: {
    model: string;
    apiKey: string;
  };
  [EProvider.Anthropic]: {
    model: string;
    apiKey: string;
  };
  [EProvider.OpenRouter]: {
    model: string;
    apiKey: string;
    baseURL: string;
  };
};
