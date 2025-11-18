/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test } from "@nestjs/testing";
import { ClsModule, ClsService } from "nestjs-cls";
import { PrismaService } from "./prisma.service";

// 这个测试是集成测试：
// - 需要可用的 DATABASE_URL 指向已迁移的 MySQL 数据库
// - 若未配置或连接失败，将跳过测试但不会失败

describe("PrismaService User audit & soft-delete", () => {
  let prisma: PrismaService;
  let cls: ClsService;
  let shouldSkip = false;

  const runAs = async <T>(userCode: string, fn: () => Promise<T>) => {
    return await cls.run(async () => {
      cls.set("user", { userCode });
      return await fn();
    });
  };

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      // 未配置数据库连接，跳过本套测试
      shouldSkip = true;
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [ClsModule.forRoot({ global: true })],
      providers: [PrismaService],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    cls = moduleRef.get(ClsService);

    try {
      await prisma.onModuleInit();
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      shouldSkip = true;
      return;
    }

    // 物理清理历史测试数据（绕过软删除）
    try {
      await prisma.$executeRaw`DELETE FROM users WHERE user_code LIKE 'test_%'`;
    } catch {
      // 如果表不存在，说明数据库未迁移，同样跳过
      shouldSkip = true;
    }
  }, 30000);

  afterAll(async () => {
    if (!shouldSkip) {
      try {
        await prisma.$executeRaw`DELETE FROM users WHERE user_code LIKE 'test_%'`;
      } catch {
        // ignore
      }
      await prisma.$disconnect();
    }
  });

  it("create should auto-fill createdBy/createdAt and deleted=false", async () => {
    if (shouldSkip) {
      console.log("Database not available/migrated; test skipped");
      return;
    }

    const userCode = `test_user_${Date.now()}`;
    const created = await runAs(
      "tester_create",
      async () =>
        await prisma.user.create({
          data: {
            userCode,
            userName: "Test User",
            email: `${userCode}@example.com`,
            password: "hashed",
          },
        }),
    );

    expect(created).toBeTruthy();
    expect(created.deleted).toBe(false);
    expect(created.createdAt).toBeTruthy();
    // createdBy 可能为 null（如果模型无该字段则不做断言），有字段时应为当前用户
    if (Object.prototype.hasOwnProperty.call(created, "createdBy")) {
      expect(created.createdBy).toBe("tester_create");
    }
  });

  it("update should auto-fill updatedBy/updatedAt", async () => {
    if (shouldSkip) {
      console.log("Database not available/migrated; test skipped");
      return;
    }
    const userCode = `test_user_${Date.now()}_upd`;
    const created = await runAs("tester_upd1", async () =>
      prisma.user.create({
        data: {
          userCode,
          userName: "To Update",
          email: `${userCode}@example.com`,
          password: "hashed",
        },
      }),
    );

    const updated = await runAs("tester_upd2", async () =>
      prisma.user.update({
        where: { id: created.id },
        data: { userName: "Updated Name" },
      }),
    );

    expect(updated.userName).toBe("Updated Name");
    if (Object.prototype.hasOwnProperty.call(updated, "updatedAt")) {
      expect(updated.updatedAt).toBeTruthy();
    }
    if (Object.prototype.hasOwnProperty.call(updated, "updatedBy")) {
      expect(updated.updatedBy).toBe("tester_upd2");
    }
  });

  it("delete should soft-delete and default queries exclude it; includeDeleted returns it", async () => {
    if (shouldSkip) {
      console.log("Database not available/migrated; test skipped");
      return;
    }
    const userCode = `test_user_${Date.now()}_del`;
    const created = await runAs("tester_del1", async () =>
      prisma.user.create({
        data: {
          userCode,
          userName: "To Delete",
          email: `${userCode}@example.com`,
          password: "hashed",
        },
      }),
    );

    const deleted = await runAs("tester_del2", async () =>
      prisma.user.delete({ where: { id: created.id } }),
    );

    // delete 拦截为软删除，返回的是 update 后的记录
    expect(deleted.deleted).toBe(true);
    if (Object.prototype.hasOwnProperty.call(deleted, "deletedAt")) {
      expect(deleted.deletedAt).toBeTruthy();
    }
    if (Object.prototype.hasOwnProperty.call(deleted, "deletedBy")) {
      expect(deleted.deletedBy).toBe("tester_del2");
    }

    // 默认查询应过滤掉
    const byUnique = await prisma.user.findUnique({
      where: { id: created.id },
    });
    expect(byUnique).toBeNull();

    const listed = await prisma.user.findMany({ where: { userCode } });
    expect(listed.length).toBe(0);

    // includeDeleted 绕过过滤
    const listedWithDeleted = await prisma.user.findMany({
      where: { userCode },
      includeDeleted: true,
    });
    expect(listedWithDeleted.length).toBe(1);
    expect(listedWithDeleted[0].deleted).toBe(true);
  });

  it("findUniqueOrThrow should throw error for soft-deleted record", async () => {
    if (shouldSkip) {
      console.log("Database not available/migrated; test skipped");
      return;
    }
    const userCode = `test_user_${Date.now()}_throw`;
    const created = await runAs("tester_throw", async () =>
      prisma.user.create({
        data: {
          userCode,
          userName: "To Throw Test",
          email: `${userCode}@example.com`,
          password: "hashed",
        },
      }),
    );

    // 软删除记录
    await runAs("tester_throw", async () =>
      prisma.user.delete({ where: { id: created.id } }),
    );

    // findUniqueOrThrow 应该抛出错误
    await expect(
      prisma.user.findUniqueOrThrow({ where: { id: created.id } }),
    ).rejects.toThrow();
  });

  it("hardDelete should physically delete record bypassing soft-delete", async () => {
    if (shouldSkip) {
      console.log("Database not available/migrated; test skipped");
      return;
    }
    const userCode = `test_user_${Date.now()}_hard`;
    const created = await runAs("tester_hard", async () =>
      prisma.user.create({
        data: {
          userCode,
          userName: "To Hard Delete",
          email: `${userCode}@example.com`,
          password: "hashed",
        },
      }),
    );

    // 硬删除记录 - 使用新的友好 API
    await prisma.user.hardDelete({ id: created.id });

    // 即使使用 includeDeleted 也找不到记录(因为已被物理删除)
    const notFound = await prisma.user.findUnique({
      where: { id: created.id },
      includeDeleted: true,
    });
    expect(notFound).toBeNull();

    // 使用原始查询验证记录确实被物理删除
    const rawResult = await prisma.$queryRaw`
      SELECT * FROM users WHERE id = ${created.id}
    `;
    expect((rawResult as any[]).length).toBe(0);
  });

  it("hardDeleteMany should physically delete multiple records", async () => {
    if (shouldSkip) {
      console.log("Database not available/migrated; test skipped");
      return;
    }
    const prefix = `test_hard_many_${Date.now()}`;

    // 创建多条测试记录
    await runAs("tester_hard_many", async () => {
      await prisma.user.createMany({
        data: [
          {
            userCode: `${prefix}_1`,
            userName: "Hard Delete 1",
            email: `${prefix}_1@example.com`,
            password: "hashed",
          },
          {
            userCode: `${prefix}_2`,
            userName: "Hard Delete 2",
            email: `${prefix}_2@example.com`,
            password: "hashed",
          },
        ],
      });
    });

    // 硬删除多条记录 - 使用新的友好 API
    const result = await prisma.user.hardDeleteMany({
      userCode: { startsWith: prefix },
    });
    expect(result.count).toBe(2);

    // 验证记录已被物理删除
    const remaining = await prisma.user.findMany({
      where: { userCode: { startsWith: prefix } },
      includeDeleted: true,
    });
    expect(remaining.length).toBe(0);
  });
});
