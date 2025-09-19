import { Module } from '@nestjs/common';
import { RootController } from './controllers/root.controller';
import { DatabaseModule } from './database';
import { Text2SqlService } from './text2sql.service';
import { Text2SqlController } from './controllers/text2sql.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [RootController, Text2SqlController],
  providers: [Text2SqlService],
})
export class Text2SqlModule {}
