-- AlterTable
ALTER TABLE `user` ADD COLUMN `premiumEndAt` DATETIME(3) NULL,
    ADD COLUMN `premiumStartAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `meditation` ADD COLUMN `isPremium` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `premium_code` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `duration` INTEGER NOT NULL,
    `durationUnit` ENUM('DAYS', 'MONTHS', 'YEARS') NOT NULL DEFAULT 'DAYS',
    `status` ENUM('AVAILABLE', 'USED', 'EXPIRED', 'DISABLED') NOT NULL DEFAULT 'AVAILABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `usedById` VARCHAR(191) NULL,

    UNIQUE INDEX `premium_code_code_key`(`code`),
    INDEX `premium_code_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `premium_activation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `premiumCodeId` VARCHAR(191) NOT NULL,
    `activatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `previousPremiumEndAt` DATETIME(3) NULL,
    `newPremiumEndAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `premium_activation_premiumCodeId_key`(`premiumCodeId`),
    INDEX `premium_activation_userId_activatedAt_idx`(`userId`, `activatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `premium_code` ADD CONSTRAINT `premium_code_usedById_fkey` FOREIGN KEY (`usedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `premium_activation` ADD CONSTRAINT `premium_activation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `premium_activation` ADD CONSTRAINT `premium_activation_premiumCodeId_fkey` FOREIGN KEY (`premiumCodeId`) REFERENCES `premium_code`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

