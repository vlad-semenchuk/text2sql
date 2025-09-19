import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.alternative',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'alternative-host',
      port: 5433,
      username: 'alt_user',
      password: 'alt_pass',
      database: 'alternative_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
