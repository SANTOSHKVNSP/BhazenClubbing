-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "holdToken" TEXT;

-- CreateIndex
CREATE INDEX "Ticket_holdToken_idx" ON "Ticket"("holdToken");
