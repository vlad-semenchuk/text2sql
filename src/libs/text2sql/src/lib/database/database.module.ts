import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PostgresModule } from '@libs/data-access-postgres';

@Module({
  imports: [PostgresModule.forRootFromEnv()],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
