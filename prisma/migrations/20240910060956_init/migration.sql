/*
  Warnings:

  - The primary key for the `Item` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Item` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Character` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[itemCode]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemCode` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Character` DROP FOREIGN KEY `Character_userId_fkey`;

-- AlterTable
ALTER TABLE `Character` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Item` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD COLUMN `itemCode` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Character_name_key` ON `Character`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `Item_itemCode_key` ON `Item`(`itemCode`);

-- CreateIndex
CREATE UNIQUE INDEX `Item_name_key` ON `Item`(`name`);

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
