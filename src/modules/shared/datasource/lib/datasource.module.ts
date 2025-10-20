import { DynamicModule, Module } from '@nestjs/common';
import { DataSourceModuleOptions } from './types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourceConfig } from './datasource.config';
import { SQL_DATABASE } from './constants';
import { DataSource } from 'typeorm';
import { Env } from '@modules/config';
import { Database } from './database';
import { DatasourceService } from './datasource.service';
import { DatasourceHealthIndicator } from './datasource.health';

@Module({})
export class DatasourceModule {
  static forRoot(options: DataSourceModuleOptions): DynamicModule {
    return {
      module: DatasourceModule,
      global: true,
      imports: [TypeOrmModule.forRootAsync(DatasourceConfig(options).asProvider())],
      providers: [
        DatasourceService,
        DatasourceHealthIndicator,
        {
          provide: SQL_DATABASE,
          inject: [DataSource, DatasourceService],
          useFactory: async (ds: DataSource, dsService: DatasourceService) => {
            if (!ds.isInitialized) {
              await ds.initialize();
            }

            return new Database({ appDataSource: ds }, dsService);
          },
        },
      ],
      exports: [SQL_DATABASE, DatasourceHealthIndicator],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return DatasourceModule.forRoot({
      url: Env.string('POSTGRES_URL'),
      schema: Env.optionalString('POSTGRES_SCHEMA', 'public'),
    });
  }

  static forFeature(): DynamicModule {
    return {
      module: DatasourceModule,
    };
  }
}
