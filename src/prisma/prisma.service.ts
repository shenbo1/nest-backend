/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "generated/prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import { ClsService } from "nestjs-cls";

// 辅助函数:移除删除相关字段
function omitDeletedFields<T extends Record<string, any>>(
  record: T
): Omit<T, "deleted" | "deletedAt" | "deletedBy"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deleted, deletedAt, deletedBy, ...rest } = record;
  return rest;
}

// 基于 Prisma v6 的扩展实现:使用 $extends 包装查询,自动注入 deleted=false (如果调用方未显式指定 deleted 条件)
@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: PrismaClient;

  constructor(private readonly cls: ClsService) {
    const base = new PrismaClient();
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    interface AuditInfo {
      hasDeleted: boolean;
      hasCreatedAt: boolean;
      hasCreatedBy: boolean;
      hasUpdatedAt: boolean;
      hasUpdatedBy: boolean;
      hasDeletedAt: boolean;
      hasDeletedBy: boolean;
    }
    const auditMap: Record<string, AuditInfo> = {};
    // 定义 models 目录与收集工具
    const modelsDir = path.join(process.cwd(), "prisma", "models");
    const collectPrismaFiles = (dir: string): string => {
      let acc = "";
      if (!fs.existsSync(dir)) return acc;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) acc += "\n" + collectPrismaFiles(p);
        else if (entry.isFile() && entry.name.endsWith(".prisma")) {
          try {
            acc += "\n" + fs.readFileSync(p, "utf8");
          } catch {
            // ignore
          }
        }
      }
      return acc;
    };
    try {
      let raw = collectPrismaFiles(modelsDir);
      // 若 models 目录为空，则回退到主 schema.prisma
      if (!raw.trim().length) {
        try {
          raw = fs.readFileSync(schemaPath, "utf8");
        } catch {
          raw = "";
        }
      }
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
    } catch {
      // 忽略读取错误,保持空表
    }

    const now = () => new Date();
    const actor = () => {
      const u = this.cls.get<{ userCode?: string; id?: string }>("user");
      return u?.userCode ?? u?.id ?? "system";
    };

    const extended = base.$extends({
      query: {
        $allModels: {
          create({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (info) {
              const data: any = args.data ?? {};
              if (info.hasCreatedAt && data.createdAt === undefined) {
                data.createdAt = now();
              }
              if (info.hasCreatedBy && data.createdBy === undefined) {
                data.createdBy = actor();
              }
              if (info.hasDeleted && data.deleted === undefined) {
                data.deleted = false;
              }
              args.data = data;
            }
            return query(args);
          },
          createMany({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (info && Array.isArray(args.data)) {
              args.data = args.data.map((d: any) => {
                const data = { ...d };
                if (info.hasCreatedAt && data.createdAt === undefined) {
                  data.createdAt = now();
                }
                if (info.hasCreatedBy && data.createdBy === undefined) {
                  data.createdBy = actor();
                }
                if (info.hasDeleted && data.deleted === undefined) {
                  data.deleted = false;
                }
                return data;
              });
            }
            return query(args);
          },
          update({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (info) {
              const data: any = args.data ?? {};
              if (info.hasUpdatedAt && data.updatedAt === undefined) {
                data.updatedAt = now();
              }
              if (info.hasUpdatedBy && data.updatedBy === undefined) {
                data.updatedBy = actor();
              }
              args.data = data;
            }
            return query(args);
          },
          updateMany({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (info) {
              const data: any = args.data ?? {};
              if (info.hasUpdatedAt && data.updatedAt === undefined) {
                data.updatedAt = now();
              }
              if (info.hasUpdatedBy && data.updatedBy === undefined) {
                data.updatedBy = actor();
              }
              args.data = data;
            }
            return query(args);
          },
          delete({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (!info?.hasDeleted) {
              return query(args);
            }
            const data: any = {};
            if (info.hasDeleted) data.deleted = true;
            if (info.hasDeletedAt) data.deletedAt = now();
            if (info.hasDeletedBy) data.deletedBy = actor();
            if (info.hasUpdatedAt) data.updatedAt = now();
            if (info.hasUpdatedBy) data.updatedBy = actor();
            // 使用 base client 直接调用 update,避免扩展递归
            return (base as any)[model].update({
              where: args.where,
              data,
            });
          },
          deleteMany({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (!info?.hasDeleted) {
              return query(args);
            }
            const data: any = {};
            if (info.hasDeleted) data.deleted = true;
            if (info.hasDeletedAt) data.deletedAt = now();
            if (info.hasDeletedBy) data.deletedBy = actor();
            if (info.hasUpdatedAt) data.updatedAt = now();
            if (info.hasUpdatedBy) data.updatedBy = actor();
            // 使用 base client 直接调用 updateMany,避免扩展递归
            return (base as any)[model].updateMany({
              where: args.where,
              data,
            });
          },
          findMany({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (!info?.hasDeleted) return query(args);
            const a: any = args;
            if (a?.includeDeleted) {
              delete a.includeDeleted;
              return query(a);
            }
            if (!a.where || a.where.deleted === undefined) {
              a.where = { AND: [a.where ?? {}, { deleted: false }] };
            }
            return query(a).then((records: any[]) => {
              if (!records || !Array.isArray(records)) return records;
              return records.map((record) => omitDeletedFields(record));
            });
          },
          findFirst({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (!info?.hasDeleted) return query(args);
            const a: any = args;
            if (a?.includeDeleted) {
              delete a.includeDeleted;
              return query(a);
            }
            if (!a.where || a.where.deleted === undefined) {
              a.where = { AND: [a.where ?? {}, { deleted: false }] };
            }
            return query(a).then((record: any) => {
              if (!record) return record;
              return omitDeletedFields(record);
            });
          },
          findUnique({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (!info?.hasDeleted) return query(args);
            const a: any = args;
            if (a?.includeDeleted) {
              delete a.includeDeleted;
              return query(a);
            }
            return query(a).then((record: any) => {
              if (record && record.deleted === true && !a.where?.deleted) {
                return null;
              }
              if (!record) return record;
              return omitDeletedFields(record);
            });
          },
          findUniqueOrThrow({
            model,
            args,
            query,
          }: {
            model: string;
            args: any;
            query: any;
          }) {
            const info = auditMap[model];
            if (!info?.hasDeleted) return query(args);
            const a: any = args;
            if (a?.includeDeleted) {
              delete a.includeDeleted;
              return query(a);
            }
            return query(a).then((record: any) => {
              if (record && record.deleted === true && !a.where?.deleted) {
                throw new Error(`${model} record is soft-deleted`);
              }
              if (!record) return record;
              return omitDeletedFields(record);
            });
          },
        },
      },
    });
    // 将扩展实例断言为 PrismaClient，以保持对外 API 类型
    this.client = extended as unknown as PrismaClient;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  // 暴露原生 delegate,兼容现有使用方式
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
  /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  $transaction(...args: any[]) {
    return (this.client as any).$transaction(...args);
  }
  $queryRaw(...args: any[]) {
    return (this.client as any).$queryRaw(...args);
  }
  $executeRaw(...args: any[]) {
    return (this.client as any).$executeRaw(...args);
  }
  /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  $disconnect() {
    return this.client.$disconnect();
  }
}
