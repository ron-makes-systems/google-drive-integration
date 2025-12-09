import {Invoice} from "chargebee";

let invoiceCounter = 0;

export const invoiceBuilder = (overrides: Partial<Invoice> = {}): Invoice => {
  invoiceCounter++;
  const id = overrides.id || `inv_${invoiceCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    po_number: `PO-${invoiceCounter}`,
    customer_id: `cust_${invoiceCounter}`,
    subscription_id: `sub_${invoiceCounter}`,
    recurring: true,
    status: "paid",
    vat_number: `VAT${invoiceCounter}`,
    price_type: "tax_exclusive",
    date: now - 86400,
    due_date: now + 86400 * 30,
    net_term_days: 30,
    exchange_rate: 1.0,
    currency_code: "USD",
    base_currency_code: "USD",
    total: 10000,
    amount_paid: 10000,
    amount_adjusted: 0,
    write_off_amount: 0,
    credits_applied: 0,
    amount_due: 0,
    paid_at: now,
    voided_at: undefined,
    updated_at: now,
    sub_total: 9000,
    tax: 1000,
    first_invoice: invoiceCounter === 1,
    term_finalized: true,
    generated_at: now - 86400,
    expected_payment_date: now + 86400 * 7,
    amount_to_collect: 0,
    channel: "web",
    deleted: false,
    line_items: [
      {
        id: `li_${invoiceCounter}_1`,
        date_from: now - 86400 * 30,
        date_to: now,
        unit_amount: 5000,
        quantity: 2,
        amount: 10000,
        is_taxed: true,
        tax_amount: 1000,
        discount_amount: 0,
        entity_type: "plan_item_price",
        description: `Line item ${invoiceCounter}`,
      },
    ] as Invoice.LineItem[],
    line_item_discounts: [],
    ...overrides,
  } as Invoice;
};

export const resetInvoiceCounter = () => {
  invoiceCounter = 0;
};
