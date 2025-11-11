import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = 500;
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        // Nest's HttpException often returns object with message and error
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message = res.message || res.error || message;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        errors = res.errors || res;
      }
      code = status;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseBody = {
      success: false,
      code,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      errors,
    };

    this.logger.error(
      `${request.method} ${request.url} -> ${message}`,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (exception as any)?.stack,
    );

    response.status(status).json(responseBody);
  }
}
