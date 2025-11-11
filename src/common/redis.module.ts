import { Module } from "@nestjs/common";
import { REDIS_DB } from "@/constants";
import Redis from "ioredis";
import { ApiConfigService } from "@/config";

@Module({
  providers: [
    ApiConfigService,
    {
      provide: REDIS_DB,
      inject: [ApiConfigService],
      useFactory: (config: ApiConfigService) => {
        const redis = config.redis;
        return new Redis({
          port: redis.port,
          host: redis.host,
          password: redis.password,
          db: redis.db,
        });
      },
    },
  ],
  exports: [REDIS_DB],
})
export class RedisModule {}
