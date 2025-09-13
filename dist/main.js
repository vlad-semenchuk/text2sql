"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./libs/shared/core/src/index");
const app_module_1 = require("./app.module");
core_1.AppBuilder.create(app_module_1.AppModule).enableValidation().launch();
//# sourceMappingURL=main.js.map