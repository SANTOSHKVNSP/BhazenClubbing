// Pricing engine (ADR-005). All money in integer paise.
// feeValue: paise (flat) or percent*100 (percent, e.g. 250 = 2.5%).
// gstRate: percent*100 (e.g. 1800 = 18%).

export type FeeType = "none" | "flat" | "percent";

export type PricingInput = {
  subtotal: number;
  feeType: FeeType;
  feeValue: number;
  gstRate: number;
  gstInclusive?: boolean;
};

export type Pricing = { subtotal: number; fee: number; gst: number; total: number };

export function computeFee(subtotal: number, feeType: FeeType, feeValue: number): number {
  if (feeType === "flat") return Math.max(0, Math.round(feeValue));
  if (feeType === "percent") return Math.max(0, Math.round((subtotal * feeValue) / 10000));
  return 0;
}

export function computePricing(input: PricingInput): Pricing {
  const subtotal = Math.max(0, Math.round(input.subtotal));
  const fee = computeFee(subtotal, input.feeType, input.feeValue);
  const base = subtotal + fee;

  let gst = 0;
  let total = base;

  if (input.gstRate > 0 && base > 0) {
    if (input.gstInclusive) {
      gst = base - Math.round((base * 10000) / (10000 + input.gstRate));
      total = base;
    } else {
      gst = Math.round((base * input.gstRate) / 10000);
      total = base + gst;
    }
  }

  return { subtotal, fee, gst, total };
}
