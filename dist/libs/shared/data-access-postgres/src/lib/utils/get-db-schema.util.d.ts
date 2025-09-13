import { DataSource } from 'typeorm';
export declare function getDbSchema({ connection }: {
    connection: DataSource;
}): string;
