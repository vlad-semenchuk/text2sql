import { DynamicModule, Module } from '@nestjs/common';
import { Text2SqlService } from './services/text2sql.service';
import { Text2SqlController } from './controllers/text2sql.controller';
import { DatasourceModule, DataSourceModuleOptions } from '@modules/datasource';
import { Env } from '@modules/config';

export type Text2SqlModuleOptions = {
  datasource: DataSourceModuleOptions;
};

@Module({})
export class Text2SqlModule {
  static forRoot(options: Text2SqlModuleOptions): DynamicModule {
    return {
      module: Text2SqlModule,
      imports: [DatasourceModule.forRoot(options.datasource)],
      controllers: [Text2SqlController],
      providers: [Text2SqlService],
    };
  }

  static forRootFromEnv(): DynamicModule {
    return Text2SqlModule.forRoot({
      datasource: {
        type: Env.string('DATASOURCE_TYPE'),
        url: Env.string('DATASOURCE_URL'),
      },
    });
  }
}
