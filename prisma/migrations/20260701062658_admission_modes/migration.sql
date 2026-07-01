-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('reserved', 'general');

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_seatId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "ticketCategoryId" TEXT,
ALTER COLUMN "seatId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TicketCategory" ADD COLUMN     "admission" "AdmissionType" NOT NULL DEFAULT 'reserved',
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "maxPerOrder" INTEGER;

-- CreateTable
CREATE TABLE "GaInventory" (
    "id" TEXT NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "ticketCategoryId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "reserved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GaInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GaInventory_showtimeId_idx" ON "GaInventory"("showtimeId");

-- CreateIndex
CREATE UNIQUE INDEX "GaInventory_showtimeId_ticketCategoryId_key" ON "GaInventory"("showtimeId", "ticketCategoryId");

-- CreateIndex
CREATE INDEX "Ticket_ticketCategoryId_idx" ON "Ticket"("ticketCategoryId");

-- AddForeignKey
ALTER TABLE "GaInventory" ADD CONSTRAINT "GaInventory_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GaInventory" ADD CONSTRAINT "GaInventory_ticketCategoryId_fkey" FOREIGN KEY ("ticketCategoryId") REFERENCES "TicketCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketCategoryId_fkey" FOREIGN KEY ("ticketCategoryId") REFERENCES "TicketCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
