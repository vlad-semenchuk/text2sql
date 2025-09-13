"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbSchema = getDbSchema;
function getDbSchema({ connection }) {
    return connection.options.schema ?? 'public';
}
//# sourceMappingURL=get-db-schema.util.js.map