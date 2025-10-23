import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import * as jwt from 'jsonwebtoken';
import { Public } from '@/common/guard/jwt-auth.guard';
import { ApiConfigService } from './config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ApiConfigService,
  ) {}

  @Get()
  getHello(): Promise<any> {
    console.log('new', new Date(new Date().toLocaleString()));
    return this.appService.getHello();
  }

  @Public()
  @Post()
  login() {
    const { secret, expiresIn } = this.configService.jwtConfig;
    const payload = { id: '1', userCode: 'admin' };
    const token = jwt.sign(payload, secret, {
      expiresIn,
    });
    return { access_token: token };
  }
}
