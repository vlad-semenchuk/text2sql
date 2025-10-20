import { DynamicModule, Module } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
import { VectorStoreModuleOptions } from './types';
import { VECTOR_STORE } from './constants';
import { VectorStoreService } from './vector-store.service';
import { Env } from '@modules/config';

@Module({})
export class VectorStoreModule {
  static forRoot(options: VectorStoreModuleOptions): DynamicModule {
    return {
      module: VectorStoreModule,
      global: true,
      imports: [],
      providers: [
        {
          provide: VECTOR_STORE,
          useFactory: async () => {
            const embeddingFunction = new OpenAIEmbeddingFunction({
              apiKey: process.env.OPENAI_API_KEY,
              modelName: 'text-embedding-3-small',
            });

            const client = new ChromaClient({
              path: options.url,
            });

            // Get or create the collection with the embedding function
            const collection = await client.getOrCreateCollection({
              name: options.collectionName,
              embeddingFunction: embeddingFunction,
            });

            return collection;
          },
        },
        {
          provide: VectorStoreService,
          inject: [VECTOR_STORE],
          useFactory: (collection: Collection) => {
            return new VectorStoreService(collection);
          },
        },
      ],
      exports: [VECTOR_STORE, VectorStoreService],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return VectorStoreModule.forRoot({
      url: Env.string('CHROMA_URL'),
      collectionName: Env.string('CHROMA_COLLECTION_NAME'),
    });
  }

  static forFeature(): DynamicModule {
    return {
      module: VectorStoreModule,
    };
  }
}
