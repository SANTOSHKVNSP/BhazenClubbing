import { createHmac } from "node:crypto";

export const razorpayConfigured = () =>
  !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Create a Razorpay order via REST (no SDK dependency). Dev fallback when no keys.
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string> = {}
): Promise<{ id: string; dev: boolean }> {
  if (!razorpayConfigured()) return { id: `dev_order_${receipt}`, dev: true };

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id, dev: false };
}

export async function createRazorpayRefund(
  paymentId: string,
  amountPaise: number
): Promise<{ id: string; dev: boolean }> {
  if (!razorpayConfigured() || paymentId.startsWith("dev_")) {
    return { id: `dev_refund_${paymentId}`, dev: true };
  }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountPaise }),
  });
  if (!res.ok) throw new Error(`Razorpay refund failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id, dev: false };
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}
