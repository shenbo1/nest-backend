/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient, Prisma } from "generated/prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import { ClsService } from "nestjs-cls";

// 审计信息接口
interface AuditInfo {
  hasDeleted: boolean;
  hasCreatedAt: boolean;
  hasCreatedBy: boolean;
  hasUpdatedAt: boolean;
  hasUpdatedBy: boolean;
  hasDeletedAt: boolean;
  hasDeletedBy: boolean;
}

// 动态获取可用的 Prisma model delegate 名称类型
type ModelDelegateName = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: any }
    ? K
    : never;
}[keyof PrismaClient];

// 辅助函数: 移除删除相关字段
function omitDeletedFields<T extends Record<string, any>>(
  record: T
): Omit<T, "deleted" | "deletedAt" | "deletedBy"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deleted, deletedAt, deletedBy, ...rest } = record;
  return rest;
}

// 辅助函数: 填充审计字段
function fillAuditFields(
  data: any,
  info: AuditInfo,
  type: "create" | "update" | "delete",
  actor: string
): any {
  const result = { ...data };
  const now = new Date();
  if (type === "create") {
    if (info.hasCreatedAt && result.createdAt === undefined) {
      result.createdAt = now;
    }
    if (info.hasCreatedBy && result.createdBy === undefined) {
      result.createdBy = actor;
    }
    if (info.hasDeleted && result.deleted === undefined) {
      result.deleted = false;
    }
  }

  if (type === "update" || type === "delete") {
    if (info.hasUpdatedAt && result.updatedAt === undefined) {
      result.updatedAt = now;
    }
    if (info.hasUpdatedBy && result.updatedBy === undefined) {
      result.updatedBy = actor;
    }
  }

  if (type === "delete") {
    if (info.hasDeleted) result.deleted = true;
    if (info.hasDeletedAt) result.deletedAt = now;
    if (info.hasDeletedBy) result.deletedBy = actor;
  }

  return result;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: PrismaClient;
  private static auditMapCache: Record<string, AuditInfo> | null = null;

  constructor(private readonly cls: ClsService) {
    this.client = this.createExtendedClient();
  }

  /**
   * 获取当前操作者
   */
  private getActor(): string {
    const u = this.cls.get<{ userCode?: string; id?: string }>("user");
    return u?.userCode ?? u?.id ?? "system";
  }

  /**
   * 软删除过滤（支持 includeDeleted 选项）
   * @param info 审计信息
   * @param args 查询参数
   * @param isUniqueQuery 是否是唯一查询(findUnique/findUniqueOrThrow)
   */
  private applySoftDeleteFilter(
    info: AuditInfo | undefined,
    args: any,
    isUniqueQuery = false
  ): any {
    if (!info?.hasDeleted) return args;
    if (args?.includeDeleted) {
      delete args.includeDeleted;
      return args;
    }
    if (!args.where || args.where.deleted === undefined) {
      // findUnique/findUniqueOrThrow 不能使用 AND,直接在 where 上添加 deleted 字段
      if (isUniqueQuery) {
        args.where = { ...args.where, deleted: false };
      } else {
        args.where = { AND: [args.where ?? {}, { deleted: false }] };
      }
    }
    return args;
  }

  /**
   * 创建带审计和软删除扩展的 Prisma Client
   */
  private createExtendedClient(): PrismaClient {
    const base = new PrismaClient();
    const auditMap = this.getOrBuildAuditMap();

    return base.$extends({
      query: {
        $allModels: {
          create: ({ model, args, query }: any) => {
            const info = auditMap[model];
            if (info) {
              args.data = fillAuditFields(
                args.data ?? {},
                info,
                "create",
                this.getActor()
              );
            }
            return query(args);
          },

          createMany: ({ model, args, query }: any) => {
            const info = auditMap[model];
            if (info && Array.isArray(args.data)) {
              const actor = this.getActor();
              args.data = args.data.map((d: any) =>
                fillAuditFields(d, info, "create", actor)
              );
            }
            return query(args);
          },

          update: ({ model, args, query }: any) => {
            const info = auditMap[model];
            if (info) {
              args.data = fillAuditFields(
                args.data ?? {},
                info,
                "update",
                this.getActor()
              );
            }
            return query(args);
          },

          updateMany: ({ model, args, query }: any) => {
            const info = auditMap[model];
            if (info) {
              args.data = fillAuditFields(
                args.data ?? {},
                info,
                "update",
                this.getActor()
              );
            }
            return query(args);
          },

          delete: ({ model, args, query }: any) => {
            const info = auditMap[model];
            if (!info?.hasDeleted) {
              return query(args);
            }
            const data = fillAuditFields({}, info, "delete", this.getActor());
            return (base as any)[model].update({
              where: args.where,
              data,
            });
          },

          deleteMany: ({ model, args, query }: any) => {
            const info = auditMap[model];
            if (!info?.hasDeleted) {
              return query(args);
            }
            const data = fillAuditFields({}, info, "delete", this.getActor());
            return (base as any)[model].updateMany({
              where: args.where,
              data,
            });
          },

          findMany: ({ model, args, query }: any) => {
            const info = auditMap[model];
            const shouldOmit = !args?.includeDeleted;
            const a = this.applySoftDeleteFilter(info, args);

            return query(a).then((records: any[]) => {
              if (!records || !Array.isArray(records)) return records;
              return shouldOmit && info?.hasDeleted
                ? records.map((record) => omitDeletedFields(record))
                : records;
            });
          },

          findFirst: ({ model, args, query }: any) => {
            const info = auditMap[model];
            const shouldOmit = !args?.includeDeleted;
            const a = this.applySoftDeleteFilter(info, args);

            return query(a).then((record: any) =>
              record && shouldOmit && info?.hasDeleted
                ? omitDeletedFields(record)
                : record
            );
          },

          findUnique: ({ model, args, query }: any) => {
            const info = auditMap[model];
            const shouldOmit = !args?.includeDeleted;
            const a = this.applySoftDeleteFilter(info, args, true);

            return query(a).then((record: any) =>
              record && shouldOmit && info?.hasDeleted
                ? omitDeletedFields(record)
                : record
            );
          },

          findUniqueOrThrow: ({ model, args, query }: any) => {
            const info = auditMap[model];
            const shouldOmit = !args?.includeDeleted;
            const a = this.applySoftDeleteFilter(info, args, true);

            return query(a).then((record: any) =>
              record && shouldOmit && info?.hasDeleted
                ? omitDeletedFields(record)
                : record
            );
          },

          count: ({ model, args, query }: any) => {
            const info = auditMap[model];
            return query(this.applySoftDeleteFilter(info, args));
          },

          aggregate: ({ model, args, query }: any) => {
            const info = auditMap[model];
            return query(this.applySoftDeleteFilter(info, args));
          },

          groupBy: ({ model, args, query }: any) => {
            const info = auditMap[model];
            return query(this.applySoftDeleteFilter(info, args));
          },
        },
      },
    }) as unknown as PrismaClient;
  }

  /**
   * 获取或构建审计字段映射表（带缓存）
   */
  private getOrBuildAuditMap(): Record<string, AuditInfo> {
    // 如果已有缓存，直接返回
    if (PrismaService.auditMapCache) {
      return PrismaService.auditMapCache;
    }

    const auditMap: Record<string, AuditInfo> = {};
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const modelsDir = path.join(process.cwd(), "prisma", "models");

    try {
      let raw = this.collectPrismaFiles(modelsDir);

      // 若 models 目录为空，则回退到主 schema.prisma
      if (!raw.trim().length) {
        try {
          raw = fs.readFileSync(schemaPath, "utf8");
        } catch (error) {
          this.logger.warn(
            `无法读取 schema.prisma: ${error instanceof Error ? error.message : String(error)}`
          );
          raw = "";
        }
      }

      // 解析所有 model
      const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/gms;
      for (const match of raw.matchAll(modelRegex)) {
        const name = match[1];
        const body = match[2];

        const hasField = (f: string) =>
          new RegExp(`^\\s*${f}\\s+`, "m").test(body);

        auditMap[name] = {
          hasDeleted: /\bdeleted\s+Boolean\b/.test(body),
          hasCreatedAt: hasField("createdAt"),
          hasCreatedBy: hasField("createdBy"),
          hasUpdatedAt: hasField("updatedAt"),
          hasUpdatedBy: hasField("updatedBy"),
          hasDeletedAt: hasField("deletedAt"),
          hasDeletedBy: hasField("deletedBy"),
        };
      }

      // 缓存结果
      PrismaService.auditMapCache = auditMap;
      this.logger.log(
        `成功解析 ${Object.keys(auditMap).length} 个 Prisma models`
      );
    } catch (error) {
      this.logger.error(
        `解析 Prisma schema 时出错: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return auditMap;
  }

  /**
   * 递归收集所有 .prisma 文件内容
   */
  private collectPrismaFiles(dir: string): string {
    let acc = "";
    if (!fs.existsSync(dir)) return acc;

    try {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          acc += "\n" + this.collectPrismaFiles(p);
        } else if (entry.isFile() && entry.name.endsWith(".prisma")) {
          try {
            acc += "\n" + fs.readFileSync(p, "utf8");
          } catch (error) {
            this.logger.warn(
              `无法读取文件 ${p}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `读取目录 ${dir} 时出错: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return acc;
  }

  async onModuleInit() {
    try {
      await this.client.$connect();
      this.logger.log("Prisma Client 连接成功");
    } catch (error) {
      this.logger.error(
        `Prisma Client 连接失败: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    this.logger.log("Prisma Client 已断开连接");
  }

  // Model 访问器
  get user() {
    return this.client.user;
  }
  get role() {
    return this.client.role;
  }
  get permission() {
    return this.client.permission;
  }
  get rolePermission() {
    return this.client.rolePermission;
  }
  get userRole() {
    return this.client.userRole;
  }
  get difyConversation() {
    return this.client.difyConversation;
  }
  get difyMessage() {
    return this.client.difyMessage;
  }

  // 动态获取任意 model delegate（带类型）
  getModel<K extends ModelDelegateName>(name: K): PrismaClient[K] {
    return (this.client as any)[name];
  }

  // Prisma 原生方法
  $transaction(...args: any[]) {
    return (this.client as any).$transaction(...args);
  }
  $queryRaw(...args: any[]) {
    return (this.client as any).$queryRaw(...args);
  }
  $executeRaw(...args: any[]) {
    return (this.client as any).$executeRaw(...args);
  }
  $disconnect() {
    return this.client.$disconnect();
  }
}
