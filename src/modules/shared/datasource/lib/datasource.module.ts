import { DynamicModule, Module } from '@nestjs/common';
import { DataSourceModuleOptions } from './types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
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
      imports: [TypeOrmModule.forRootAsync(DatasourceConfig(options).asProvider()), TerminusModule],
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
      host: Env.optionalString('POSTGRES_HOST', 'localhost'),
      port: Env.optionalNumber('POSTGRES_PORT', 5432),
      user: Env.string('POSTGRES_USER'),
      password: Env.string('POSTGRES_PASSWORD'),
      database: Env.optionalString('POSTGRES_DB', 'dvdrental'),
      schema: Env.optionalString('POSTGRES_SCHEMA', 'public'),
    });
  }

  static forFeature(): DynamicModule {
    return {
      module: DatasourceModule,
    };
  }
}
