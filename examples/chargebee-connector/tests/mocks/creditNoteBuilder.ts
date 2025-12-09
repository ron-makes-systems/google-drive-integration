import {CreditNote} from "chargebee";

let creditNoteCounter = 0;

export const creditNoteBuilder = (overrides: Partial<CreditNote> = {}): CreditNote => {
  creditNoteCounter++;
  const id = overrides.id || `cn_${creditNoteCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    customer_id: `cust_${creditNoteCounter}`,
    subscription_id: `sub_${creditNoteCounter}`,
    reference_invoice_id: `inv_${creditNoteCounter}`,
    type: "refundable",
    reason_code: "other",
    status: "refund_due",
    vat_number: `VAT${creditNoteCounter}`,
    date: now - 86400,
    price_type: "tax_exclusive",
    currency_code: "USD",
    total: 5000,
    amount_allocated: 0,
    amount_refunded: 0,
    amount_available: 5000,
    fractional_correction: 0,
    refunded_at: undefined,
    voided_at: undefined,
    updated_at: now,
    generated_at: now - 86400,
    channel: "web",
    sub_total: 4500,
    base_currency_code: "USD",
    deleted: false,
    exchange_rate: 1.0,
    allocations: [],
    ...overrides,
  } as CreditNote;
};

export const resetCreditNoteCounter = () => {
  creditNoteCounter = 0;
};
