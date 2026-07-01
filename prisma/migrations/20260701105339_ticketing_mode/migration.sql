-- CreateEnum
CREATE TYPE "TicketingMode" AS ENUM ('internal', 'external');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "ticketingMode" "TicketingMode" NOT NULL DEFAULT 'internal';

-- AlterTable
ALTER TABLE "TicketCategory" ADD COLUMN     "bookingUrl" TEXT;
