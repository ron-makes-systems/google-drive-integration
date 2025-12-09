import {ItemPrice} from "chargebee";

let itemPriceCounter = 0;

export const itemPriceBuilder = (overrides: Partial<ItemPrice> = {}): ItemPrice => {
  itemPriceCounter++;
  const id = overrides.id || `plan_${itemPriceCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    name: `Plan ${itemPriceCounter}`,
    item_id: `item_${itemPriceCounter}`,
    item_type: "plan",
    period: 1,
    period_unit: "month",
    price: 10000,
    currency_code: "USD",
    pricing_model: "flat_fee",
    status: "active",
    created_at: now - 86400 * 30,
    updated_at: now,
    ...overrides,
  } as ItemPrice;
};

export const resetItemPriceCounter = () => {
  itemPriceCounter = 0;
};
