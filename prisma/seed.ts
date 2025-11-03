import { PrismaClient } from "generated/prisma/client";
import {
  PermissionCreateManyInput,
  UserCreateManyInput,
} from "generated/prisma/models";
import bcrypt from "bcrypt";
import "dotenv/config";

const client = new PrismaClient();
async function main() {
  // 首先删除所有现有数据，注意删除顺序以避免外键约束冲突
  await client.rolePermission.deleteMany({});
  await client.userRole.deleteMany({});
  await client.permission.deleteMany({});
  await client.role.deleteMany({});
  await client.user.deleteMany({});

  // 定义权限菜单项
  const permissions = [
    // 一级菜单
    {
      permissionName: "系统管理",
      permissionCode: "p-system-manage",
      path: "/system",
      action: "manage",
      resourceType: "MENU",
      level: 1,
    },

    // 二级菜单 - 用户管理
    {
      permissionName: "用户管理",
      permissionCode: "p-user-manage",
      path: "/system/user",
      action: "manage",
      resourceType: "MENU",
      level: 2,
      parentPermissionCode: "p-system-manage",
    },
    // 用户管理相关API权限
    {
      permissionName: "用户查询",
      permissionCode: "p-user-query",
      path: "/api/users",
      action: "read",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-user-manage",
    },
    {
      permissionName: "用户创建",
      permissionCode: "p-user-create",
      path: "/api/users",
      action: "create",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-user-manage",
    },
    {
      permissionName: "用户编辑",
      permissionCode: "p-user-update",
      path: "/api/users/*",
      action: "update",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-user-manage",
    },
    {
      permissionName: "用户删除",
      permissionCode: "p-user-delete",
      path: "/api/users/*",
      action: "delete",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-user-manage",
    },

    // 二级菜单 - 角色管理
    {
      permissionName: "角色管理",
      permissionCode: "p-role-manage",
      path: "/system/role",
      action: "manage",
      resourceType: "MENU",
      level: 2,
      parentPermissionCode: "p-system-manage",
    },
    // 角色管理相关API权限
    {
      permissionName: "角色查询",
      permissionCode: "p-role-query",
      path: "/api/roles",
      action: "read",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-role-manage",
    },
    {
      permissionName: "角色创建",
      permissionCode: "p-role-create",
      path: "/api/roles",
      action: "create",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-role-manage",
    },
    {
      permissionName: "角色编辑",
      permissionCode: "p-role-update",
      path: "/api/roles/*",
      action: "update",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-role-manage",
    },
    {
      permissionName: "角色删除",
      permissionCode: "p-role-delete",
      path: "/api/roles/*",
      action: "delete",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-role-manage",
    },

    // 二级菜单 - 权限管理
    {
      permissionName: "权限管理",
      permissionCode: "p-permission-manage",
      path: "/system/permission",
      action: "manage",
      resourceType: "MENU",
      level: 2,
      parentPermissionCode: "p-system-manage",
    },
    // 权限管理相关API权限
    {
      permissionName: "权限查询",
      permissionCode: "p-permission-query",
      path: "/api/permissions",
      action: "read",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-permission-manage",
    },
    {
      permissionName: "权限创建",
      permissionCode: "p-permission-create",
      path: "/api/permissions",
      action: "create",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-permission-manage",
    },
    {
      permissionName: "权限编辑",
      permissionCode: "p-permission-update",
      path: "/api/permissions/*",
      action: "update",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-permission-manage",
    },
    {
      permissionName: "权限删除",
      permissionCode: "p-permission-delete",
      path: "/api/permissions/*",
      action: "delete",
      resourceType: "API",
      level: 3,
      parentPermissionCode: "p-permission-manage",
    },
  ] as PermissionCreateManyInput[];

  // 加密密码
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash("admin@123", saltRounds);
  const userPassword = await bcrypt.hash("user@123", saltRounds);

  // 定义角色
  const roles = [
    {
      roleName: "超级管理员",
      roleCode: "r-super-admin",
    },
    {
      roleName: "普通用户",
      roleCode: "r-user",
    },
  ];

  // 定义用户
  const users = [
    {
      userCode: "admin",
      userName: "管理员",
      email: "admin@example.com",
      password: adminPassword,
    },
    {
      userCode: "user",
      userName: "普通用户",
      email: "user@example.com",
      password: userPassword,
    },
  ] as UserCreateManyInput[];

  // 创建用户
  await client.user.createMany({
    data: users,
  });

  // 创建权限
  await client.permission.createMany({
    data: permissions,
  });

  // 创建角色
  await client.role.createMany({
    data: roles,
  });

  // 用户角色关联
  const userRoles = [
    {
      userCode: "admin",
      roleCode: "r-super-admin",
    },
    {
      userCode: "user",
      roleCode: "r-user",
    },
  ];

  await client.userRole.createMany({
    data: userRoles,
  });

  // 角色权限关联
  const rolePermissions = [
    // 超级管理员拥有所有权限
    ...permissions.map((permission) => ({
      roleCode: "r-super-admin",
      permissionCode: permission.permissionCode,
    })),
  ];

  await client.rolePermission.createMany({
    data: rolePermissions,
  });
}

main().then(() => {
  client.$disconnect();
});
