import {Coupon} from "chargebee";

let couponCounter = 0;

export const couponBuilder = (overrides: Partial<Coupon> = {}): Coupon => {
  couponCounter++;
  const id = overrides.id || `coupon_${couponCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    name: `Coupon ${couponCounter}`,
    invoice_name: `Coupon ${couponCounter} Invoice`,
    discount_type: "percentage",
    discount_percentage: 10,
    discount_amount: undefined,
    currency_code: "USD",
    duration_type: "forever",
    valid_till: now + 86400 * 365,
    max_redemptions: 100,
    status: "active",
    apply_on: "invoice_amount",
    created_at: now - 86400 * 30,
    archived_at: undefined,
    updated_at: now,
    period: undefined,
    period_unit: undefined,
    redemptions: 5,
    invoice_notes: `Notes for coupon ${couponCounter}`,
    ...overrides,
  } as Coupon;
};

export const resetCouponCounter = () => {
  couponCounter = 0;
};
