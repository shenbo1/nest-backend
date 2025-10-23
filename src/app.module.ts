import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ApiConfigService } from '@/config';
import { RedisModule } from '@/common/redis.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/common/guard/jwt-auth.guard';
import { ClsModule } from 'nestjs-cls';

const envFilePath = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV}`
  : '.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath,
      isGlobal: true,
      load: [],
    }),
    RedisModule,
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ApiConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
