import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  SetMetadata,
  Inject,
} from "@nestjs/common";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { Reflector } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { ApiConfigService } from "@/config";
import { REDIS_DB, REDIS_KEY } from "@/constants";
import Redis from "ioredis";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly clsService: ClsService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(REDIS_DB) private readonly redis: Redis
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return Promise.resolve(true);
    }

    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers["authorization"];
    const myToken = req.headers["accesstoken"];
    const xtraceId = req.headers["x-trace-id"];
    const uid = req.headers["uid"];

    console.log("mytoken", myToken);
    if (!auth && !myToken) {
      throw new UnauthorizedException("未提供认证信息");
    }

    if (myToken) {
      // 从 Redis 获取 token 对应的用户信息
      const userInfo = await this.redis.get(
        `${REDIS_KEY}${typeof myToken === "string" ? myToken : ""}`
      );

      if (!userInfo) {
        throw new UnauthorizedException("Token 无效或已过期");
      }
      const user = JSON.parse(userInfo);
      (req as any).user = user;
      this.clsService.set("userCode", user.memberId ?? user.id);
      this.clsService.set("user", user);
      return true;
    }
    if (auth) {
      const parts = auth.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer")
        throw new UnauthorizedException("无效的认证格式");
      const token = parts[1];

      try {
        const { secret } = this.apiConfigService.jwtConfig;
        const payload = jwt.verify(token, secret);
        (req as any).user = payload;
        this.clsService.set("userCode", payload.userCode ?? payload.id);
        this.clsService.set("user", payload);
        return Promise.resolve(true);
      } catch (error) {
        this.logger.error(error);
        throw new UnauthorizedException("无效或过期的 token");
      }
    }
    return Promise.resolve(true);
  }
}
