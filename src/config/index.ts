import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface ApiConfig {
  swagger: {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    prefix: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  dify: {
    baseUrl: string;
    apiKey: string;
  };
}

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get difyConfig(): ApiConfig["dify"] {
    return {
      baseUrl: this.configService.get<string>("DIFY_BASE_URL", "DIFY_URL"),
      apiKey: this.configService.get<string>("DIFY_API_KEY", "DIFY_API_KEY"),
    };
  }

  get jwtConfig(): ApiConfig["jwt"] {
    return {
      secret: this.configService.get<string>("JWT_SECRET", "JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRES_IN", "7d"),
    };
  }

  get logLevel(): string {
    return this.configService.get<string>("LOG_LEVEL", "debug");
  }

  get port(): number {
    return this.configService.get<number>("PORT", 1110);
  }

  get swagger(): ApiConfig["swagger"] {
    return {
      enabled: this.getBoolean("SWAGGER_ENABLED", false),
      title: this.configService.get<string>("SWAGGER_TITLE", ""),
      prefix: this.configService.get<string>("SWAGGER_PREFIX", ""),
      description: this.configService.get<string>("SWAGGER_DESCRIPTION", ""),
      version: this.configService.get<string>("SWAGGER_VERSION", ""),
    };
  }

  get redis(): ApiConfig["redis"] {
    return {
      host: this.configService.get<string>("REDIS_HOST", ""),
      port: this.configService.get<number>("REDIS_PORT", 0),
      password: this.configService.get<string>("REDIS_PASSWORD", ""),
      db: this.configService.get<number>("REDIS_DB", 0),
    };
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key, String(defaultValue));
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    return Boolean(value);
  }
}
