import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatAnthropic } from '@langchain/anthropic';
import { EProvider, LLMModuleOptions } from './types';
import { ChatOpenAI } from '@langchain/openai';

export const makeLLM = (options: LLMModuleOptions): BaseChatModel => {
  const provider = options.provider;

  if (!provider || !Object.values(EProvider).includes(provider) || !options[provider]) {
    throw new Error('Invalid LLM provider configuration');
  }

  const { apiKey, model } = options[provider];

  switch (provider) {
    case EProvider.Anthropic:
      return new ChatAnthropic({ apiKey, model });
    case EProvider.OpenAI: {
      return new ChatOpenAI({ apiKey, model });
    }
    case EProvider.OpenRouter:
      return new ChatOpenAI({
        apiKey,
        model,
        configuration: {
          baseURL: options[EProvider.OpenRouter].baseURL,
        },
      });
    default:
      throw new Error('Unknown LLM provider configuration');
  }
};
