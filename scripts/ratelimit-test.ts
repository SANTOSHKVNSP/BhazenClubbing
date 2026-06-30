import { rateLimit } from "../lib/ratelimit";

let lastOk = true;
for (let i = 0; i < 6; i++) lastOk = rateLimit("k", 5, 60_000).ok; // limit 5 → 6th blocked
const sixthBlocked = !lastOk;
const freshKeyOk = rateLimit("other", 5, 60_000).ok; // independent key still allowed
console.log(`6th-call-blocked=${sixthBlocked} fresh-key-ok=${freshKeyOk} ${sixthBlocked && freshKeyOk ? "✅ PASS" : "❌ FAIL"}`);
if (!(sixthBlocked && freshKeyOk)) process.exitCode = 1;
