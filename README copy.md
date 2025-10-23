// ...existing code...

# nest-backend

简单的 NestJS 后端示例项目，包含 Redis 集成、JWT 登录示例和基本的开发脚本。

## 主要文件

- 控制器与登录逻辑：[`AppController`](src/app.controller.ts) — [src/app.controller.ts](src/app.controller.ts)
- 服务（包含 Redis 使用）：[`AppService`](src/app.service.ts) — [src/app.service.ts](src/app.service.ts)
- 配置类型：[`ApiConfig`](src/config/index.ts) — [src/config/index.ts](src/config/index.ts)
- 常量（依赖注入符号）：[`REDIS_DB`](src/constants/index.ts) — [src/constants/index.ts](src/constants/index.ts)
- 环境示例：`.env.development` — [.env.development](.env.development)
- 依赖锁文件：`pnpm-lock.yaml` — [pnpm-lock.yaml](pnpm-lock.yaml)
- package.json（脚本） — [package.json](package.json)

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 启动服务

```bash
pnpm run start:dev
```

3. 生产构建与运行

```bash
pnpm run build
pnpm run start:prod
```
