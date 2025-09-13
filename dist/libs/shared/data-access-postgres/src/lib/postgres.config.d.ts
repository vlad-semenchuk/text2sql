import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
export declare const PostgresConfig: (loader: () => string[]) => (() => TypeOrmModuleOptions & DataSourceOptions) & import("@nestjs/config").ConfigFactoryKeyHost<({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/mysql/MysqlConnectionOptions.js").MysqlConnectionOptions> & import("typeorm/driver/mysql/MysqlConnectionOptions.js").MysqlConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/postgres/PostgresConnectionOptions.js").PostgresConnectionOptions> & import("typeorm/driver/postgres/PostgresConnectionOptions.js").PostgresConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/cockroachdb/CockroachConnectionOptions.js").CockroachConnectionOptions> & import("typeorm/driver/cockroachdb/CockroachConnectionOptions.js").CockroachConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/sqlite/SqliteConnectionOptions.js").SqliteConnectionOptions> & import("typeorm/driver/sqlite/SqliteConnectionOptions.js").SqliteConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/sqlserver/SqlServerConnectionOptions.js").SqlServerConnectionOptions> & import("typeorm/driver/sqlserver/SqlServerConnectionOptions.js").SqlServerConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/sap/SapConnectionOptions.js").SapConnectionOptions> & import("typeorm/driver/sap/SapConnectionOptions.js").SapConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/oracle/OracleConnectionOptions.js").OracleConnectionOptions> & import("typeorm/driver/oracle/OracleConnectionOptions.js").OracleConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/cordova/CordovaConnectionOptions.js").CordovaConnectionOptions> & import("typeorm/driver/cordova/CordovaConnectionOptions.js").CordovaConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/nativescript/NativescriptConnectionOptions.js").NativescriptConnectionOptions> & import("typeorm/driver/nativescript/NativescriptConnectionOptions.js").NativescriptConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/react-native/ReactNativeConnectionOptions.js").ReactNativeConnectionOptions> & import("typeorm/driver/react-native/ReactNativeConnectionOptions.js").ReactNativeConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/sqljs/SqljsConnectionOptions.js").SqljsConnectionOptions> & import("typeorm/driver/sqljs/SqljsConnectionOptions.js").SqljsConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/mongodb/MongoConnectionOptions.js").MongoConnectionOptions> & import("typeorm/driver/mongodb/MongoConnectionOptions.js").MongoConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions.js").AuroraMysqlConnectionOptions> & import("typeorm/driver/aurora-mysql/AuroraMysqlConnectionOptions.js").AuroraMysqlConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions.js").AuroraPostgresConnectionOptions> & import("typeorm/driver/aurora-postgres/AuroraPostgresConnectionOptions.js").AuroraPostgresConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/expo/ExpoConnectionOptions.js").ExpoConnectionOptions> & import("typeorm/driver/expo/ExpoConnectionOptions.js").ExpoConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions.js").BetterSqlite3ConnectionOptions> & import("typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions.js").BetterSqlite3ConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/capacitor/CapacitorConnectionOptions.js").CapacitorConnectionOptions> & import("typeorm/driver/capacitor/CapacitorConnectionOptions.js").CapacitorConnectionOptions) | ({
    retryAttempts?: number;
    retryDelay?: number;
    toRetry?: (err: any) => boolean;
    autoLoadEntities?: boolean;
    verboseRetryLog?: boolean;
    manualInitialization?: boolean;
} & Partial<import("typeorm/driver/spanner/SpannerConnectionOptions.js").SpannerConnectionOptions> & import("typeorm/driver/spanner/SpannerConnectionOptions.js").SpannerConnectionOptions)>;
