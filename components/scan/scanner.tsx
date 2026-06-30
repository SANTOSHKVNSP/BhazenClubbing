"use client";

import { useEffect, useRef, useState } from "react";
import { kvGet, kvSet } from "@/lib/scan/idb";

type Entry = { ticketId: string; qrHash: string; seat: string; category: string; checkedIn: boolean };
type Queued = { ticketId: string; scannedAt: number; deviceId: string };
type Result = { ok: boolean; label: string; sub?: string };
type Showtime = { id: string; label: string };

async function sha256hex(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function deviceId() {
  let id = localStorage.getItem("sb-scan-device");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("sb-scan-device", id); }
  return id;
}

export function Scanner({ showtimes }: { showtimes: Showtime[] }) {
  const [showtimeId, setShowtimeId] = useState(showtimes[0]?.id ?? "");
  const [token, setToken] = useState("scan");
  const [meta, setMeta] = useState<{ event?: string; count?: number; syncedAt?: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [counts, setCounts] = useState({ scanned: 0, queued: 0 });
  const [manual, setManual] = useState("");
  const [online, setOnline] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(false);

  const allow = useRef<Map<string, Entry>>(new Map());
  const used = useRef<Set<string>>(new Set());
  const queue = useRef<Queued[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const camRef = useRef(false);

  async function loadLocal(sid: string) {
    const [a, u, q, m] = await Promise.all([
      kvGet<Entry[]>(`allow:${sid}`), kvGet<string[]>(`used:${sid}`),
      kvGet<Queued[]>(`queue:${sid}`), kvGet<typeof meta>(`meta:${sid}`),
    ]);
    allow.current = new Map((a ?? []).map((e) => [e.qrHash, e]));
    used.current = new Set([...(u ?? []), ...(a ?? []).filter((e) => e.checkedIn).map((e) => e.qrHash)]);
    queue.current = q ?? [];
    setMeta(m); setReady((a ?? []).length > 0); setCounts({ scanned: 0, queued: (q ?? []).length });
  }

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => { if (showtimeId) loadLocal(showtimeId); }, [showtimeId]);

  async function sync() {
    setBusy(true);
    try {
      const res = await fetch(`/api/scan/sync?showtimeId=${encodeURIComponent(showtimeId)}&token=${encodeURIComponent(token)}`);
      if (!res.ok) { setResult({ ok: false, label: "Sync failed", sub: `HTTP ${res.status}` }); setBusy(false); return; }
      const data = await res.json();
      const entries: Entry[] = data.allowlist;
      await kvSet(`allow:${showtimeId}`, entries);
      await kvSet(`meta:${showtimeId}`, { event: data.event, count: data.count, syncedAt: Date.now() });
      allow.current = new Map(entries.map((e) => [e.qrHash, e]));
      used.current = new Set([...used.current, ...entries.filter((e) => e.checkedIn).map((e) => e.qrHash)]);
      setMeta({ event: data.event, count: data.count, syncedAt: Date.now() }); setReady(true);
      setResult({ ok: true, label: `Synced ${data.count} tickets`, sub: "Ready to scan offline" });
    } catch { setResult({ ok: false, label: "Sync error" }); }
    setBusy(false);
  }

  async function validate(raw: string) {
    const value = raw.trim();
    if (!value) return;
    const hash = await sha256hex(value);
    const entry = allow.current.get(hash);
    if (!entry) return setResult({ ok: false, label: "✗ Not valid", sub: "Unknown ticket / wrong show" });
    if (used.current.has(hash)) return setResult({ ok: false, label: "✗ Already used", sub: `Seat ${entry.seat}` });
    used.current.add(hash);
    queue.current.push({ ticketId: entry.ticketId, scannedAt: Date.now(), deviceId: deviceId() });
    await kvSet(`used:${showtimeId}`, [...used.current]);
    await kvSet(`queue:${showtimeId}`, queue.current);
    setCounts((c) => ({ scanned: c.scanned + 1, queued: queue.current.length }));
    setResult({ ok: true, label: "✓ Admit", sub: `Seat ${entry.seat} · ${entry.category}` });
  }

  async function pushCheckins() {
    if (queue.current.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/scan/checkin`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-scanner-token": token },
        body: JSON.stringify({ showtimeId, checkins: queue.current }),
      });
      if (res.ok) { queue.current = []; await kvSet(`queue:${showtimeId}`, []); setCounts((c) => ({ ...c, queued: 0 })); setResult({ ok: true, label: "Check-ins synced to server" }); }
      else setResult({ ok: false, label: "Push failed", sub: `HTTP ${res.status}` });
    } catch { setResult({ ok: false, label: "Offline — will retry when online" }); }
    setBusy(false);
  }

  async function startCam() {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!BD) return setResult({ ok: false, label: "Camera scan unsupported", sub: "Use manual entry" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const det = new BD({ formats: ["qr_code"] });
      camRef.current = true; setCam(true);
      let last = "";
      const loop = async () => {
        if (!camRef.current || !videoRef.current) return;
        try { const codes = await det.detect(videoRef.current); if (codes[0] && codes[0].rawValue !== last) { last = codes[0].rawValue; await validate(codes[0].rawValue); } } catch {}
        if (camRef.current) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch { setResult({ ok: false, label: "Camera unavailable" }); }
  }
  function stopCam() {
    camRef.current = false; setCam(false);
    const s = videoRef.current?.srcObject as MediaStream | null;
    s?.getTracks().forEach((t) => t.stop());
  }

  return (
    <main className="min-h-screen bg-purple-deep px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Scanner</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs ${online ? "bg-green-500/20 text-green-300" : "bg-orange/20 text-orange"}`}>{online ? "online" : "offline"}</span>
        </div>

        {/* Config */}
        <div className="mt-4 space-y-2 rounded-xl bg-white/5 p-4">
          <select value={showtimeId} onChange={(e) => setShowtimeId(e.target.value)} className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm">
            {showtimes.map((s) => <option key={s.id} value={s.id} className="text-ink">{s.label}</option>)}
            {showtimes.length === 0 && <option className="text-ink">No live showtimes</option>}
          </select>
          <div className="flex gap-2">
            <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="scanner token" className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm" />
            <button onClick={sync} disabled={busy || !showtimeId} className="rounded-lg bg-gradient-to-br from-orange to-orange-2 px-4 py-2 text-sm font-bold disabled:opacity-50">Sync</button>
          </div>
          {meta && <p className="text-xs text-white/60">{meta.event} · {meta.count} tickets · synced {meta.syncedAt ? new Date(meta.syncedAt).toLocaleTimeString() : "—"}</p>}
        </div>

        {/* Result banner */}
        {result && (
          <div className={`mt-4 rounded-xl p-6 text-center ${result.ok ? "bg-green-500/20" : "bg-red-500/25"}`}>
            <p className="font-display text-3xl font-extrabold">{result.label}</p>
            {result.sub && <p className="mt-1 text-sm text-white/80">{result.sub}</p>}
          </div>
        )}

        {/* Scan */}
        {ready ? (
          <div className="mt-4 space-y-3">
            <video ref={videoRef} className={`w-full rounded-xl ${cam ? "block" : "hidden"}`} muted playsInline />
            <div className="flex gap-2">
              {!cam ? <button onClick={startCam} className="flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold">📷 Camera scan</button>
                    : <button onClick={stopCam} className="flex-1 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold">Stop camera</button>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); validate(manual); setManual(""); }} className="flex gap-2">
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="paste QR token (manual)" className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm" />
              <button className="rounded-lg bg-white/15 px-4 py-2 text-sm font-bold">Check</button>
            </form>
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-sm">
              <span>Scanned: <b>{counts.scanned}</b> · Queued: <b className={counts.queued ? "text-orange" : ""}>{counts.queued}</b></span>
              <button onClick={pushCheckins} disabled={busy || counts.queued === 0} className="rounded-lg bg-gradient-to-br from-orange to-orange-2 px-3 py-1.5 text-xs font-bold disabled:opacity-40">Sync check-ins</button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-white/60">Select a showtime and tap <b>Sync</b> to download the ticket list — then you can scan fully offline.</p>
        )}
      </div>
    </main>
  );
}
