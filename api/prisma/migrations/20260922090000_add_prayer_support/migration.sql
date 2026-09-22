-- AlterTable
ALTER TABLE `user` ADD COLUMN `prayerPreferences` JSON NULL,
    ADD COLUMN `role` ENUM('MEMBRE', 'ACCOMPAGNATEUR', 'ADMINISTRATEUR') NOT NULL DEFAULT 'MEMBRE';

-- CreateTable
CREATE TABLE `prayer_request` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `followUp` VARCHAR(191) NOT NULL,
    `consentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('ENVOYEE', 'EN_ETUDE', 'PRECISION_DEMANDEE', 'EN_PREPARATION', 'DISPONIBLE', 'TERMINEE') NOT NULL DEFAULT 'ENVOYEE',
    `companionId` VARCHAR(191) NULL,
    `clarification` TEXT NULL,
    `reply` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prayer_request_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `prayer_request_companionId_status_idx`(`companionId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_program` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'PUBLIC',
    `requestId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `days` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prayer_program_kind_published_idx`(`kind`, `published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_progress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `steps` JSON NOT NULL,
    `position` VARCHAR(191) NULL,
    `positionAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prayer_progress_userId_programId_key`(`userId`, `programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_slot` (
    `id` VARCHAR(191) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `duration` INTEGER NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `contribution` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `prayer_slot_startsAt_active_idx`(`startsAt`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_appointment` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `slotId` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL,
    `companionId` VARCHAR(191) NULL,
    `zoomUrl` VARCHAR(191) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `prayer_appointment_requestId_key`(`requestId`),
    UNIQUE INDEX `prayer_appointment_slotId_key`(`slotId`),
    INDEX `prayer_appointment_userId_idx`(`userId`),
    INDEX `prayer_appointment_companionId_idx`(`companionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contribution_method` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `holder` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `bank` VARCHAR(191) NULL,
    `iban` VARCHAR(191) NULL,
    `swift` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL,
    `instructions` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contribution_proof` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `methodId` VARCHAR(191) NULL,
    `amount` DECIMAL(12, 2) NULL,
    `currency` VARCHAR(191) NULL,
    `reference` VARCHAR(191) NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mime` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RECUE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contribution_proof_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `resourceType` VARCHAR(191) NULL,
    `resourceId` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dedupeKey` VARCHAR(191) NOT NULL,
    `emailSentAt` DATETIME(3) NULL,
    `emailAttempts` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `prayer_notification_dedupeKey_key`(`dedupeKey`),
    INDEX `prayer_notification_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prayer_testimony` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `consent` BOOLEAN NOT NULL DEFAULT false,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `prayer_request` ADD CONSTRAINT `prayer_request_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_program` ADD CONSTRAINT `prayer_program_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `prayer_request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_progress` ADD CONSTRAINT `prayer_progress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_progress` ADD CONSTRAINT `prayer_progress_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `prayer_program`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_appointment` ADD CONSTRAINT `prayer_appointment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_appointment` ADD CONSTRAINT `prayer_appointment_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `prayer_request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_appointment` ADD CONSTRAINT `prayer_appointment_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `prayer_slot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution_proof` ADD CONSTRAINT `contribution_proof_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contribution_proof` ADD CONSTRAINT `contribution_proof_methodId_fkey` FOREIGN KEY (`methodId`) REFERENCES `contribution_method`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_notification` ADD CONSTRAINT `prayer_notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prayer_testimony` ADD CONSTRAINT `prayer_testimony_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
UPDATE `user` SET `role` = 'ADMINISTRATEUR' WHERE `isAdmin` = true;
