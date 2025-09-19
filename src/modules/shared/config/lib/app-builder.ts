import {
  INestApplication,
  INestApplicationContext,
  Logger,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

export type BeforeStartHook<T = INestApplicationContext> = (app: T) => unknown | Promise<unknown>;

export class AppBuilder<T extends INestApplication = INestApplication> {
  private beforeStartHooks: BeforeStartHook<T>[] = [];

  constructor(private readonly module: unknown) {}

  static create(module: unknown) {
    return new AppBuilder(module);
  }

  beforeStart(hook: BeforeStartHook<T>): AppBuilder<T> {
    this.beforeStartHooks.push(hook);
    return this;
  }

  public launch() {
    this.start();
  }

  private async start(): Promise<T> {
    const app = await NestFactory.create(this.module as any);
    await this.runBeforeAppStartHooks(app);

    const port = process.env['PORT'] ?? 3000;

    await app.listen(port, '0.0.0.0');

    Logger.log(`App started listening on ${await app.getUrl()}`);

    return app as T;
  }

  private async runBeforeAppStartHooks(app: INestApplication) {
    for (const hook of this.beforeStartHooks) {
      await hook(app as T);
    }
  }

  enableValidation(options: ValidationPipeOptions = {}): AppBuilder<T> {
    return this.beforeStart((app) => {
      app.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: true,
          ...options,
        }),
      );
    });
  }

  enableStaticAssets(options: { path: string; staticPath: string }): AppBuilder<T> {
    return this.beforeStart((app) => {
      const expressApp = app as unknown as NestExpressApplication;
      const resolvedPath = path.resolve(options.staticPath);

      Logger.log(`Serving static files from ${resolvedPath} at ${options.path}`);
      expressApp.useStaticAssets(resolvedPath, {
        prefix: options.path,
      });
    });
  }
}
