import { HttpException, Inject, Injectable } from "@nestjs/common";
import { REDIS_DB } from "./constants";
import Redis from "ioredis";
import { PrismaService } from "./prisma/prisma.service";

@Injectable()
export class AppService {
  constructor(
    @Inject(REDIS_DB) private readonly redis: Redis,
    private prisma: PrismaService
  ) {}
  async getHello(): Promise<any> {
    await this.redis.set("mykey", "hello world");
    return {
      redisKey: await this.redis.get("mykey"),
      date: new Date().toLocaleString(),
    };
  }
}
