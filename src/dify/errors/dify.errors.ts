/**
 * Dify API 错误类定义
 */

export class DifyError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = "DifyError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DifyNetworkError extends DifyError {
  constructor(message: string, details?: any) {
    super(message, undefined, "NETWORK_ERROR", details);
    this.name = "DifyNetworkError";
  }
}

export class DifyStreamError extends DifyError {
  constructor(message: string, details?: any) {
    super(message, undefined, "STREAM_ERROR", details);
    this.name = "DifyStreamError";
  }
}

export class DifyAuthError extends DifyError {
  constructor(message: string = "认证失败") {
    super(message, 401, "AUTH_ERROR");
    this.name = "DifyAuthError";
  }
}

export class DifyRateLimitError extends DifyError {
  constructor(message: string = "请求频率超限") {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "DifyRateLimitError";
  }
}
