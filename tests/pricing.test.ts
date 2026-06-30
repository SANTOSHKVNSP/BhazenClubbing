import { describe, it, expect } from "vitest";
import { computePricing } from "../lib/pricing";

describe("computePricing", () => {
  it("face value (no fee, no gst)", () => {
    expect(computePricing({ subtotal: 100000, feeType: "none", feeValue: 0, gstRate: 0 })).toEqual({
      subtotal: 100000,
      fee: 0,
      gst: 0,
      total: 100000,
    });
  });

  it("flat fee", () => {
    expect(computePricing({ subtotal: 100000, feeType: "flat", feeValue: 5000, gstRate: 0 })).toEqual({
      subtotal: 100000,
      fee: 5000,
      gst: 0,
      total: 105000,
    });
  });

  it("percent fee (2.5%)", () => {
    expect(computePricing({ subtotal: 100000, feeType: "percent", feeValue: 250, gstRate: 0 }).fee).toBe(2500);
  });

  it("additive GST 18% on subtotal+fee", () => {
    const r = computePricing({ subtotal: 100000, feeType: "flat", feeValue: 5000, gstRate: 1800 });
    expect(r.gst).toBe(18900);
    expect(r.total).toBe(123900);
  });

  it("inclusive GST extracts tax (total unchanged)", () => {
    const r = computePricing({ subtotal: 118000, feeType: "none", feeValue: 0, gstRate: 1800, gstInclusive: true });
    expect(r.total).toBe(118000);
    expect(r.gst).toBe(18000);
  });

  it("free event (zero subtotal) stays free", () => {
    expect(computePricing({ subtotal: 0, feeType: "percent", feeValue: 250, gstRate: 1800 })).toEqual({
      subtotal: 0,
      fee: 0,
      gst: 0,
      total: 0,
    });
  });

  it("always returns whole paise", () => {
    const r = computePricing({ subtotal: 33333, feeType: "percent", feeValue: 250, gstRate: 1800 });
    expect(Number.isInteger(r.fee)).toBe(true);
    expect(Number.isInteger(r.gst)).toBe(true);
    expect(Number.isInteger(r.total)).toBe(true);
  });
});
