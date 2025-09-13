import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { Env } from '@libs/config';

export const PostgresConfig = (loader: () => string[]) =>
  registerAs('postgres', (): TypeOrmModuleOptions & DataSourceOptions => {
    const cert = Env.optionalString('POSTGRES_CA_CERT'); // Renamed for PostgreSQL context

    return {
      type: 'postgres',
      url: Env.string('POSTGRES_URL'), // Renamed from TIMESCALE_URL to POSTGRES_URL
      logging: Env.optionalBoolean('POSTGRES_LOGGING', false), // Updated variable name

      migrations: loader(),

      autoLoadEntities: true,
      poolSize: 100,
      schema: Env.optionalString('POSTGRES_SCHEMA', 'public'), // Updated schema variable name

      ssl: cert ? { ca: atob(cert) } : undefined, // SSL config if certificate is available
      migrationsRun: Env.optionalBoolean('POSTGRES_RUN_MIGRATIONS', false), // Updated variable name
    };
  });
