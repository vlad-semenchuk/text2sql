import { DynamicModule, Module } from '@nestjs/common';
import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddingFunction } from '@chroma-core/openai';
import { TerminusModule } from '@nestjs/terminus';
import { VectorStoreModuleOptions } from './types';
import { VECTOR_STORE } from './constants';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreHealthIndicator } from './vector-store.health';
import { Env } from '@modules/config';

@Module({})
export class VectorStoreModule {
  static forRoot(options: VectorStoreModuleOptions): DynamicModule {
    return {
      module: VectorStoreModule,
      global: true,
      imports: [TerminusModule],
      providers: [
        {
          provide: VECTOR_STORE,
          useFactory: async () => {
            const embeddingFunction = new OpenAIEmbeddingFunction({
              apiKey: options.openai.apiKey,
              modelName: options.openai.modelName,
            });

            const client = new ChromaClient({
              host: options.chroma.host,
              port: options.chroma.port,
              ssl: options.chroma.ssl,
            });

            return await client.getOrCreateCollection({
              name: options.chroma.collectionName,
              embeddingFunction: embeddingFunction,
            });
          },
        },
        {
          provide: VectorStoreService,
          inject: [VECTOR_STORE],
          useFactory: (collection: Collection) => {
            return new VectorStoreService(collection);
          },
        },
        VectorStoreHealthIndicator,
      ],
      exports: [VECTOR_STORE, VectorStoreService, VectorStoreHealthIndicator],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return VectorStoreModule.forRoot({
      chroma: {
        host: Env.string('CHROMA_HOST'),
        port: Env.number('CHROMA_PORT'),
        ssl: Env.boolean('CHROMA_SSL'),
        collectionName: Env.string('CHROMA_COLLECTION_NAME'),
      },
      openai: {
        apiKey: Env.string('OPENAI_API_KEY'),
        modelName: Env.optionalString('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
      },
    });
  }

  static forFeature(): DynamicModule {
    return {
      module: VectorStoreModule,
    };
  }
}
