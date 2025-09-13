import { Module } from '@nestjs/common';
import { RootController } from './controllers/root.controller';
import { PostgresModule } from '@libs/data-access-postgres';

@Module({
  imports: [PostgresModule.forRootFromEnv()],
  controllers: [RootController],
  providers: [],
})
export class Text2SqlModule {}
