"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresConfig = void 0;
const config_1 = require("@nestjs/config");
const config_2 = require("../../../config/src/index");
const PostgresConfig = (loader) => (0, config_1.registerAs)('postgres', () => {
    const cert = config_2.Env.optionalString('POSTGRES_CA_CERT');
    return {
        type: 'postgres',
        url: config_2.Env.string('POSTGRES_URL'),
        logging: config_2.Env.optionalBoolean('POSTGRES_LOGGING', false),
        migrations: loader(),
        autoLoadEntities: true,
        poolSize: 100,
        schema: config_2.Env.optionalString('POSTGRES_SCHEMA', 'public'),
        ssl: cert ? { ca: atob(cert) } : undefined,
        migrationsRun: config_2.Env.optionalBoolean('POSTGRES_RUN_MIGRATIONS', false),
    };
});
exports.PostgresConfig = PostgresConfig;
//# sourceMappingURL=postgres.config.js.map