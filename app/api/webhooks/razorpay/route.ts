import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { fulfillOrder } from "@/lib/booking/checkout";

// Razorpay webhook — the source of truth for fulfillment (ADR-005).
// Signature-verified + idempotent. Inert until RAZORPAY_WEBHOOK_SECRET is set.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; notes?: { orderId?: string } } } };
  };
  const externalId = event.payload?.payment?.entity?.id ?? `evt_${signature.slice(0, 16)}`;

  // idempotency
  const seen = await prisma.webhookEvent.findUnique({ where: { externalId } }).catch(() => null);
  if (seen) return NextResponse.json({ ok: true, deduped: true });

  await prisma.webhookEvent.create({
    data: { provider: "razorpay", externalId, type: event.event ?? null, payload: event, processedAt: new Date() },
  });

  if (event.event === "payment.captured") {
    const orderId = event.payload?.payment?.entity?.notes?.orderId;
    const paymentId = event.payload?.payment?.entity?.id;
    if (orderId) await fulfillOrder(orderId, paymentId);
  }

  return NextResponse.json({ ok: true });
}
