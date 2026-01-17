-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "displayOrder" INTEGER;

-- CreateIndex
CREATE INDEX "tasks_userId_displayOrder_idx" ON "tasks"("userId", "displayOrder");
