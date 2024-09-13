-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `cash` INTEGER NOT NULL DEFAULT 10000,
    `leaguePoint` INTEGER NOT NULL DEFAULT 1000,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `draws` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Player` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `speed` INTEGER NOT NULL,
    `goalScoring` INTEGER NOT NULL,
    `shotPower` INTEGER NOT NULL,
    `defense` INTEGER NOT NULL,
    `stamina` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPlayer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `playerId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamPlayer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamId` INTEGER NOT NULL,
    `userPlayerId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `playerAId` INTEGER NOT NULL,
    `playerBId` INTEGER NOT NULL,
    `scoreA` INTEGER NOT NULL,
    `scoreB` INTEGER NOT NULL,
    `result` ENUM('WIN', 'LOSE', 'DRAW') NOT NULL,
    `playedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserPlayer` ADD CONSTRAINT `UserPlayer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPlayer` ADD CONSTRAINT `UserPlayer_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamPlayer` ADD CONSTRAINT `TeamPlayer_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamPlayer` ADD CONSTRAINT `TeamPlayer_userPlayerId_fkey` FOREIGN KEY (`userPlayerId`) REFERENCES `UserPlayer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_playerAId_fkey` FOREIGN KEY (`playerAId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_playerBId_fkey` FOREIGN KEY (`playerBId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
