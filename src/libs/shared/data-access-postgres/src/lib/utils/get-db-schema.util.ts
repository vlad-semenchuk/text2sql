import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export function getDbSchema({ connection }: { connection: DataSource }): string {
  return (connection.options as PostgresConnectionOptions).schema ?? 'public';
}
