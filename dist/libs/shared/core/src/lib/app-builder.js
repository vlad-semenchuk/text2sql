"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppBuilder = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path = __importStar(require("path"));
class AppBuilder {
    module;
    beforeStartHooks = [];
    constructor(module) {
        this.module = module;
    }
    static create(module) {
        return new AppBuilder(module);
    }
    beforeStart(hook) {
        this.beforeStartHooks.push(hook);
        return this;
    }
    launch() {
        this.start();
    }
    async start() {
        const app = await core_1.NestFactory.create(this.module);
        await this.runBeforeAppStartHooks(app);
        const port = process.env['PORT'] ?? 3000;
        await app.listen(port, '0.0.0.0');
        common_1.Logger.log(`App started listening on ${await app.getUrl()}`);
        return app;
    }
    async runBeforeAppStartHooks(app) {
        for (const hook of this.beforeStartHooks) {
            await hook(app);
        }
    }
    enableValidation(options = {}) {
        return this.beforeStart((app) => {
            app.useGlobalPipes(new common_1.ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                forbidUnknownValues: true,
                ...options,
            }));
        });
    }
    enableStaticAssets(options) {
        return this.beforeStart((app) => {
            const expressApp = app;
            const resolvedPath = path.resolve(options.staticPath);
            common_1.Logger.log(`Serving static files from ${resolvedPath} at ${options.path}`);
            expressApp.useStaticAssets(resolvedPath, {
                prefix: options.path,
            });
        });
    }
}
exports.AppBuilder = AppBuilder;
//# sourceMappingURL=app-builder.js.map