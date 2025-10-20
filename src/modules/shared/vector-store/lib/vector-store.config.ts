import { registerAs } from '@nestjs/config';
import { VectorStoreModuleOptions } from './types';

export const VectorStoreConfig = (options: VectorStoreModuleOptions) =>
  registerAs('vectorStore', () => {
    return {
      url: options.url,
      collectionName: options.collectionName,
    } as VectorStoreModuleOptions;
  });
