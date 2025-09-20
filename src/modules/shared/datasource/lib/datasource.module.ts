import { DynamicModule, Module } from '@nestjs/common';
import { DataSourceModuleOptions } from './types';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourceConfig } from './datasource.config';
import { SQL_DATASOURCE } from './constants';
import { DataSource } from 'typeorm';
import { SqlDatabase } from 'langchain/sql_db';
import { Env } from '@modules/config';

@Module({})
export class DatasourceModule {
  static forRoot(options: DataSourceModuleOptions): DynamicModule {
    return {
      module: DatasourceModule,
      imports: [TypeOrmModule.forRootAsync(DatasourceConfig(options).asProvider())],
      providers: [
        {
          provide: SQL_DATASOURCE,
          inject: [DataSource],
          useFactory: async (ds: DataSource) => {
            if (!ds.isInitialized) {
              await ds.initialize();
            }

            return SqlDatabase.fromDataSourceParams({ appDataSource: ds });
          },
        },
      ],
      exports: [SQL_DATASOURCE],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return DatasourceModule.forRoot({
      type: Env.string('DATASOURCE_TYPE'),
      url: Env.string('DATASOURCE_URL'),
    });
  }
}
