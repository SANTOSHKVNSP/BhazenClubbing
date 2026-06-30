-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'pending', 'live', 'archived');

-- CreateEnum
CREATE TYPE "VenueTemplate" AS ENUM ('theatre', 'stadium');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('super_admin', 'city_admin', 'scanner');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "TicketState" AS ENUM ('held', 'sold', 'refunded', 'comp');

-- CreateEnum
CREATE TYPE "CheckinStatus" AS ENUM ('unused', 'used');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('none', 'flat', 'percent');

-- CreateEnum
CREATE TYPE "RefundPolicyType" AS ENUM ('none', 'self_service', 'admin_only');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('percent', 'flat');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "CheckinSource" AS ENUM ('online', 'offline_sync');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "heroMedia" TEXT,
    "intro" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "seo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "mapsEmbed" TEXT,
    "template" "VenueTemplate" NOT NULL,
    "layoutJson" JSONB NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Band" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" JSONB,
    "photoUrl" TEXT,
    "socials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandMember" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BandMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "venueId" TEXT,
    "description" JSONB,
    "heroMediaUrl" TEXT,
    "galleryJson" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "feeType" "FeeType" NOT NULL DEFAULT 'none',
    "feeValue" INTEGER NOT NULL DEFAULT 0,
    "gstRate" INTEGER NOT NULL DEFAULT 0,
    "gstInclusive" BOOLEAN NOT NULL DEFAULT false,
    "refundPolicyType" "RefundPolicyType" NOT NULL DEFAULT 'none',
    "refundWindowDays" INTEGER,
    "refundFeePct" INTEGER,
    "onSaleAt" TIMESTAMP(3),
    "doorsAt" TIMESTAMP(3),
    "seo" JSONB,
    "submittedById" TEXT,
    "approvedById" TEXT,
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBand" (
    "eventId" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,

    CONSTRAINT "EventBand_pkey" PRIMARY KEY ("eventId","bandId")
);

-- CreateTable
CREATE TABLE "Showtime" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Showtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketCategory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "basePrice" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "accessible" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "cityId" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "gst" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "promoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "showtimeId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "state" "TicketState" NOT NULL DEFAULT 'held',
    "qrToken" TEXT,
    "checkinStatus" "CheckinStatus" NOT NULL DEFAULT 'unused',
    "checkinAt" TIMESTAMP(3),
    "scannerDeviceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "tier" TEXT,
    "url" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "PromoType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "perUserLimit" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "razorpayRefundId" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "gstin" TEXT,
    "sac" TEXT,
    "pdfUrl" TEXT,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckinEvent" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "showtimeId" TEXT NOT NULL,
    "deviceId" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL,
    "source" "CheckinSource" NOT NULL DEFAULT 'online',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckinEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannerDevice" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "showtimeId" TEXT,
    "label" TEXT NOT NULL,
    "authTokenHash" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScannerDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "alt" TEXT,
    "ownerType" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "Venue_cityId_idx" ON "Venue"("cityId");

-- CreateIndex
CREATE INDEX "BandMember_bandId_idx" ON "BandMember"("bandId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_cityId_idx" ON "Event"("cityId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Showtime_eventId_idx" ON "Showtime"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketCategory_eventId_name_key" ON "TicketCategory"("eventId", "name");

-- CreateIndex
CREATE INDEX "Seat_showtimeId_idx" ON "Seat"("showtimeId");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_showtimeId_section_row_number_key" ON "Seat"("showtimeId", "section", "row", "number");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "StaffMembership_userId_idx" ON "StaffMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMembership_userId_role_cityId_eventId_key" ON "StaffMembership"("userId", "role", "cityId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_showtimeId_idx" ON "Order"("showtimeId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrToken_key" ON "Ticket"("qrToken");

-- CreateIndex
CREATE INDEX "Ticket_showtimeId_seatId_idx" ON "Ticket"("showtimeId", "seatId");

-- CreateIndex
CREATE INDEX "Ticket_orderId_idx" ON "Ticket"("orderId");

-- CreateIndex
CREATE INDEX "Ticket_expiresAt_idx" ON "Ticket"("expiresAt");

-- CreateIndex
CREATE INDEX "Partner_eventId_idx" ON "Partner"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Promo_eventId_code_key" ON "Promo"("eventId", "code");

-- CreateIndex
CREATE INDEX "Comp_eventId_idx" ON "Comp"("eventId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_externalId_key" ON "WebhookEvent"("externalId");

-- CreateIndex
CREATE INDEX "CheckinEvent_showtimeId_idx" ON "CheckinEvent"("showtimeId");

-- CreateIndex
CREATE INDEX "CheckinEvent_ticketId_idx" ON "CheckinEvent"("ticketId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BandMember" ADD CONSTRAINT "BandMember_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBand" ADD CONSTRAINT "EventBand_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBand" ADD CONSTRAINT "EventBand_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Showtime" ADD CONSTRAINT "Showtime_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketCategory" ADD CONSTRAINT "TicketCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMembership" ADD CONSTRAINT "StaffMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMembership" ADD CONSTRAINT "StaffMembership_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_showtimeId_fkey" FOREIGN KEY ("showtimeId") REFERENCES "Showtime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promo" ADD CONSTRAINT "Promo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comp" ADD CONSTRAINT "Comp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
