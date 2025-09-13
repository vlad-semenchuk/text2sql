import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConfig } from './postgres.config';
import { DynamicModule } from '@nestjs/common';

export class PostgresModule {
  static forRootFromEnv(migrationsLoader: () => string[] = () => []): DynamicModule {
    return TypeOrmModule.forRootAsync(PostgresConfig(migrationsLoader).asProvider());
  }
}
