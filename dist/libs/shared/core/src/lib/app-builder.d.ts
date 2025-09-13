import { INestApplication, INestApplicationContext, ValidationPipeOptions } from '@nestjs/common';
export type BeforeStartHook<T = INestApplicationContext> = (app: T) => unknown | Promise<unknown>;
export declare class AppBuilder<T extends INestApplication = INestApplication> {
    private readonly module;
    private beforeStartHooks;
    constructor(module: unknown);
    static create(module: unknown): AppBuilder<INestApplication<any>>;
    beforeStart(hook: BeforeStartHook<T>): AppBuilder<T>;
    launch(): void;
    private start;
    private runBeforeAppStartHooks;
    enableValidation(options?: ValidationPipeOptions): AppBuilder<T>;
    enableStaticAssets(options: {
        path: string;
        staticPath: string;
    }): AppBuilder<T>;
}
