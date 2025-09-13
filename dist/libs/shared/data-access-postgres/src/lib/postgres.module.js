"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresModule = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const postgres_config_1 = require("./postgres.config");
class PostgresModule {
    static forRootFromEnv(migrationsLoader = () => []) {
        return typeorm_1.TypeOrmModule.forRootAsync((0, postgres_config_1.PostgresConfig)(migrationsLoader).asProvider());
    }
}
exports.PostgresModule = PostgresModule;
//# sourceMappingURL=postgres.module.js.map