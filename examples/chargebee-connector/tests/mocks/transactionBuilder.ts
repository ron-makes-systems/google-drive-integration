import {Transaction} from "chargebee";

let transactionCounter = 0;

export const transactionBuilder = (overrides: Partial<Transaction> = {}): Transaction => {
  transactionCounter++;
  const id = overrides.id || `txn_${transactionCounter}`;
  const now = Math.floor(Date.now() / 1000);

  return {
    id,
    customer_id: `cust_${transactionCounter}`,
    payment_method: "card",
    amount: 10000,
    currency_code: "USD",
    type: "payment",
    gateway: "stripe",
    gateway_account_id: `gw_${transactionCounter}`,
    id_at_gateway: `ch_${transactionCounter}`,
    date: now,
    status: "success",
    linked_invoices: [
      {
        invoice_id: `inv_${transactionCounter}`,
        applied_amount: 10000,
        applied_at: now,
      },
    ] as Transaction.LinkedInvoice[],
    linked_credit_notes: [],
    ...overrides,
  } as Transaction;
};

export const resetTransactionCounter = () => {
  transactionCounter = 0;
};
