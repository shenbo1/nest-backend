import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  SetMetadata,
} from "@nestjs/common";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { Reflector } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { ApiConfigService } from "@/config";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly clsService: ClsService,
    private readonly apiConfigService: ApiConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers["authorization"];

    if (!auth) {
      throw new UnauthorizedException("未提供认证信息");
    }
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
      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException("无效或过期的 token");
    }
  }
}
