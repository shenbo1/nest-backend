import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'code' in data &&
          'message' in data
        ) {
          return data as ResponseFormat<any>;
        }

        return {
          success: true,
          code: 200,
          message: 'OK',
          data,
        } as ResponseFormat<any>;
      }),
    );
  }
}
