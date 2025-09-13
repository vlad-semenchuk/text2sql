import { DynamicModule } from '@nestjs/common';
export declare class PostgresModule {
    static forRootFromEnv(migrationsLoader?: () => string[]): DynamicModule;
}
