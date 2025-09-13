import { Module } from '@nestjs/common';
import { Text2SqlModule } from '@libs/text2sql';

@Module({
  imports: [Text2SqlModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
