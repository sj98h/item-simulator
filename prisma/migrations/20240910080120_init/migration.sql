-- DropForeignKey
ALTER TABLE `Item` DROP FOREIGN KEY `Item_inventoryId_fkey`;

-- AlterTable
ALTER TABLE `Item` MODIFY `inventoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Item` ADD CONSTRAINT `Item_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
