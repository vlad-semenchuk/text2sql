import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { DataSourceModuleOptions } from '@modules/datasource';

export const DatasourceConfig = (options: DataSourceModuleOptions) =>
  registerAs('datasource', (): TypeOrmModuleOptions & DataSourceOptions => {
    return {
      type: 'postgres',
      host: options.host,
      port: options.port,
      username: options.user,
      password: options.password,
      database: options.database,
      schema: options.schema,
      ssl: false,
      synchronize: false,
      autoLoadEntities: false,
    } as TypeOrmModuleOptions & DataSourceOptions;
  });
