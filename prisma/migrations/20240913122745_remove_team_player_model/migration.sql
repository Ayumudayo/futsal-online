/*
  Warnings:

  - You are about to drop the `TeamPlayer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `TeamPlayer` DROP FOREIGN KEY `TeamPlayer_teamId_fkey`;

-- DropForeignKey
ALTER TABLE `TeamPlayer` DROP FOREIGN KEY `TeamPlayer_userPlayerId_fkey`;

-- DropIndex
DROP INDEX `UserPlayer_playerId_fkey` ON `UserPlayer`;

-- AlterTable
ALTER TABLE `Team` ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `UserPlayer` ADD COLUMN `teamId` INTEGER NULL;

-- DropTable
DROP TABLE `TeamPlayer`;

-- AddForeignKey
ALTER TABLE `UserPlayer` ADD CONSTRAINT `UserPlayer_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPlayer` ADD CONSTRAINT `UserPlayer_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
