import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // 获取HTTP请求上下文
    const request = ctx.switchToHttp().getRequest();
    // 返回挂载在req上的用户信息（由JwtStrategy的validate方法设置）
    return request.user;
  }
);
