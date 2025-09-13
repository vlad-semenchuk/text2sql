"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text2SqlModule = void 0;
const common_1 = require("@nestjs/common");
const root_controller_1 = require("./controllers/root.controller");
const data_access_postgres_1 = require("../../../shared/data-access-postgres/src/index");
let Text2SqlModule = class Text2SqlModule {
};
exports.Text2SqlModule = Text2SqlModule;
exports.Text2SqlModule = Text2SqlModule = __decorate([
    (0, common_1.Module)({
        imports: [data_access_postgres_1.PostgresModule.forRootFromEnv()],
        controllers: [root_controller_1.RootController],
        providers: [],
    })
], Text2SqlModule);
//# sourceMappingURL=text2sql.module.js.map