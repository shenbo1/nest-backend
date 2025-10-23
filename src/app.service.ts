import { HttpException, Inject, Injectable } from '@nestjs/common';
import { REDIS_DB } from './constants';
import Redis from 'ioredis';

@Injectable()
export class AppService {
  constructor(@Inject(REDIS_DB) private readonly redis: Redis) {}
  async getHello(): Promise<any> {
    await this.redis.set('mykey', 'hello world');
    return {
      redisKey: await this.redis.get('mykey'),
      date: new Date().toLocaleString(),
    };
  }
}
