import {Subscription} from "chargebee";

let subscriptionCounter = 0;

export const subscriptionBuilder = (overrides: Partial<Subscription> = {}): Subscription => {
  subscriptionCounter++;
  const id = overrides.id || `sub_${subscriptionCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    customer_id: `cust_${subscriptionCounter}`,
    currency_code: "USD",
    started_at: now - 86400 * 365,
    cancelled_at: undefined,
    cancel_reason: undefined,
    next_billing_at: now + 86400 * 30,
    current_term_start: now - 86400 * 30,
    current_term_end: now + 86400 * 30,
    mrr: 10000,
    status: "active",
    auto_collection: "on",
    subscription_items: [
      {
        item_price_id: `plan_${subscriptionCounter}`,
        item_type: "plan",
        quantity: 1,
        unit_price: 10000,
        amount: 10000,
      },
    ] as Subscription.SubscriptionItem[],
    coupons: [],
    ...overrides,
  } as Subscription;
};

export const resetSubscriptionCounter = () => {
  subscriptionCounter = 0;
};
