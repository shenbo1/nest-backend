import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";

@Injectable()
export class LogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LogInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const ip = request.ip;
    const body = request.body as Record<string, any>;
    const query = request.query;
    const params = request.params;
    const userAgent = request.get("user-agent") || "";
    const now = Date.now();

    // 记录请求信息
    this.logger.log(
      `请求开始 - ${method} ${url} - IP: ${ip} - UserAgent: ${userAgent}`
    );

    // 记录请求参数
    if (params && Object.keys(params).length > 0) {
      this.logger.debug(`路由参数: ${JSON.stringify(params)}`);
    }

    if (query && Object.keys(query).length > 0) {
      this.logger.debug(`查询参数: ${JSON.stringify(query)}`);
    }

    if (body && Object.keys(body).length > 0) {
      this.logger.debug(`请求体: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>();
          const { statusCode } = response;
          const delay = Date.now() - now;

          this.logger.log(
            `请求完成 - ${method} ${url} - 状态码: ${statusCode} - 耗时: ${delay}ms`
          );

          // 记录响应数据
          if (data) {
            this.logger.debug(`响应数据: ${JSON.stringify(data)}`);
          }
        },
        error: (error: Error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `请求失败 - ${method} ${url} - 错误: ${error.message} - 耗时: ${delay}ms`
          );
        },
      })
    );
  }
}
