import { registerAs } from '@nestjs/config';
import { VectorStoreModuleOptions } from './types';

export const VectorStoreConfig = (options: VectorStoreModuleOptions) =>
  registerAs('vectorStore', () => {
    return {
      chroma: {
        host: options.chroma.host,
        port: options.chroma.port,
        ssl: options.chroma.ssl,
        collectionName: options.chroma.collectionName,
      },
      openai: {
        apiKey: options.openai.apiKey,
        modelName: options.openai.modelName,
      },
    } as VectorStoreModuleOptions;
  });
