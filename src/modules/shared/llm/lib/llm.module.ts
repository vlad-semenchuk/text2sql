import { DynamicModule, Module } from '@nestjs/common';
import { EProvider, LLM, LLMModuleOptions } from './types';
import { makeLLM } from './llm.config';
import { Env } from '@modules/config';

@Module({})
export class LLMModule {
  static forRoot(options: LLMModuleOptions): DynamicModule {
    return {
      module: LLMModule,
      global: true,
      providers: [{ provide: LLM, useValue: makeLLM(options) }],
      exports: [LLM],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return LLMModule.forRoot({
      provider: Env.optionalString('LLM_PROVIDER', 'openai') as EProvider,
      [EProvider.Anthropic]: {
        apiKey: Env.string('ANTHROPIC_API_KEY'),
        model: Env.string('ANTHROPIC_MODEL'),
      },
      [EProvider.OpenAI]: {
        apiKey: Env.string('OPENAI_API_KEY'),
        model: Env.string('OPENAI_MODEL'),
      },
      [EProvider.OpenRouter]: {
        apiKey: Env.string('OPENROUTER_API_KEY'),
        model: Env.string('OPENROUTER_MODEL'),
        baseURL: Env.string('OPENROUTER_BASE_URL'),
      },
    });
  }

  static forFeature(): DynamicModule {
    return {
      module: LLMModule,
    };
  }
}
