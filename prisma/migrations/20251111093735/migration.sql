-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `permission_code` VARCHAR(31) NOT NULL,
    `permission_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `parent_permission_code` VARCHAR(31) NULL,
    `level` INTEGER NULL,
    `icon` VARCHAR(191) NULL,
    `path` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `resourceType` ENUM('MENU', 'API') NOT NULL DEFAULT 'MENU',
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(31) NULL,
    `updated_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(31) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(31) NULL,

    UNIQUE INDEX `permissions_permission_code_key`(`permission_code`),
    INDEX `permissions_deleted_idx`(`deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleCode` VARCHAR(31) NOT NULL,
    `permissionCode` VARCHAR(31) NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(31) NULL,
    `updated_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(31) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(31) NULL,

    INDEX `role_permission_roleCode_idx`(`roleCode`),
    INDEX `role_permission_deleted_idx`(`deleted`),
    UNIQUE INDEX `role_permission_roleCode_permissionCode_key`(`roleCode`, `permissionCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_code` VARCHAR(31) NOT NULL,
    `role_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(31) NULL,
    `updated_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(31) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(31) NULL,

    UNIQUE INDEX `roles_role_code_key`(`role_code`),
    INDEX `roles_deleted_idx`(`deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userCode` VARCHAR(31) NOT NULL,
    `roleCode` VARCHAR(31) NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(31) NULL,
    `updated_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(31) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(31) NULL,

    INDEX `user_role_deleted_idx`(`deleted`),
    UNIQUE INDEX `user_role_userCode_roleCode_key`(`userCode`, `roleCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_code` VARCHAR(31) NOT NULL,
    `user_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(31) NULL,
    `updated_at` DATETIME(3) NULL,
    `updated_by` VARCHAR(31) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(31) NULL,

    UNIQUE INDEX `users_user_code_key`(`user_code`),
    INDEX `users_deleted_idx`(`deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dify_conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `message_count` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(100) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(100) NULL,

    UNIQUE INDEX `dify_conversations_conversation_id_key`(`conversation_id`),
    INDEX `dify_conversations_conversation_id_idx`(`conversation_id`),
    INDEX `dify_conversations_user_id_idx`(`user_id`),
    INDEX `dify_conversations_status_idx`(`status`),
    INDEX `dify_conversations_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dify_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` VARCHAR(255) NOT NULL,
    `message_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(100) NOT NULL,
    `role` ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    `content_type` ENUM('TEXT', 'IMAGE', 'CARD', 'RECOMMEND', 'FILE') NOT NULL DEFAULT 'TEXT',
    `content` TEXT NOT NULL,
    `status` ENUM('PENDING', 'STREAMING', 'COMPLETED', 'FAILED', 'STOPPED') NOT NULL DEFAULT 'COMPLETED',
    `parent_message_id` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `tokens` INTEGER NULL,
    `latency` INTEGER NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by` VARCHAR(100) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by` VARCHAR(100) NULL,
    `deleted_at` DATETIME(3) NULL,
    `deleted_by` VARCHAR(100) NULL,

    UNIQUE INDEX `dify_messages_message_id_key`(`message_id`),
    INDEX `dify_messages_conversation_id_idx`(`conversation_id`),
    INDEX `dify_messages_user_id_idx`(`user_id`),
    INDEX `dify_messages_message_id_idx`(`message_id`),
    INDEX `dify_messages_created_at_idx`(`created_at`),
    INDEX `dify_messages_parent_message_id_idx`(`parent_message_id`),
    INDEX `dify_messages_content_type_idx`(`content_type`),
    INDEX `dify_messages_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permission` ADD CONSTRAINT `role_permission_roleCode_fkey` FOREIGN KEY (`roleCode`) REFERENCES `roles`(`role_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permission` ADD CONSTRAINT `role_permission_permissionCode_fkey` FOREIGN KEY (`permissionCode`) REFERENCES `permissions`(`permission_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_userCode_fkey` FOREIGN KEY (`userCode`) REFERENCES `users`(`user_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_role` ADD CONSTRAINT `user_role_roleCode_fkey` FOREIGN KEY (`roleCode`) REFERENCES `roles`(`role_code`) ON DELETE CASCADE ON UPDATE CASCADE;
