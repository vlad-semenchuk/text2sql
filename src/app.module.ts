import { Module } from '@nestjs/common';
import { Text2SqlModule } from './modules/text2sql';

@Module({
  imports: [Text2SqlModule.forRootFromEnv()],
})
export class AppModule {}
