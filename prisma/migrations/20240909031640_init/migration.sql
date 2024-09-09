/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Added the required column `health` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `money` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `power` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Character` ADD COLUMN `health` INTEGER NOT NULL,
    ADD COLUMN `money` INTEGER NOT NULL,
    ADD COLUMN `power` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `passwordHash`,
    ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `Equipment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
