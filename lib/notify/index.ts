// Notification delivery (ADR-007): email (Resend) + WhatsApp (BSP).
// Until keys are configured, logs to the server console (dev fallback).

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "tickets@sattvickbeats.com", to, subject, text: body }),
  });
  return res.ok;
}

async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const url = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;
  if (!url || !token) return false;
  // Generic BSP shape — adjust to the chosen provider (AiSensy/Gupshup/Meta) when wiring keys.
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to, body }),
  });
  return res.ok;
}

export async function notify(opts: { email?: string; phone?: string; subject: string; body: string }): Promise<void> {
  let delivered = false;
  if (opts.email) delivered = (await sendEmail(opts.email, opts.subject, opts.body)) || delivered;
  if (opts.phone) delivered = (await sendWhatsApp(opts.phone, opts.body)) || delivered;
  if (!delivered) {
    console.log(`\n[DEV NOTIFY] to=${opts.email ?? opts.phone}\n  ${opts.subject}\n  ${opts.body}\n`);
  }
}
