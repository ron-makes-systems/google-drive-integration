import {Response} from "express";
import {VizydropAccount} from "./types.authentication.js";
import {
  Invoice,
  Subscription,
  Customer,
  Transaction,
  CreditNote,
  Coupon,
  CouponSet,
  CouponCode,
  ItemPrice,
  Comment,
} from "chargebee";
import {SynchronizerType} from "./types.synchronizerConfig.js";
import {SynchronizerDataFilter} from "./types.requests.js";

type Override<T, U> = Omit<T, keyof U> & U;

export type SynchronizationDataType = `delta` | `full`;

export type SynchronizerPagination<P> = {
  hasNext: boolean;
  nextPageConfig?: P;
};

export type SynchronizerData<T, P = unknown> = {
  items: Array<Partial<T>>;
  synchronizationType?: SynchronizationDataType;
  pagination?: SynchronizerPagination<P>;
};

export type GetDataFn<T, P = unknown> = (p: {
  account: VizydropAccount;
  filter?: Partial<SynchronizerDataFilter>;
  versionNumber: number;
  lastSynchronizedAtMin?: string;
  pagination?: P;
}) => Promise<SynchronizerData<T, P>>;

export type ResourceFn = (p: {
  out: Response;
  requestedType: SynchronizerType;
  account: VizydropAccount;
  pdfId: string;
}) => Promise<unknown>;

export type PaginationConfig = {
  offset?: string;
  coupon_ids?: string;
};

// Synchronized types
export type SynchronizedInvoice = Override<
  Invoice,
  {
    name: string;
    status?: string;
    price_type?: string;
    channel?: string;
    coupon_ids?: string;
    pdf?: string;
    original_url: string;
  }
>;

export type SynchronizedInvoiceLineItem = Override<
  Invoice.LineItem,
  {
    name: string;
    invoice_id: string;
    entity_type: string;
    plan?: string;
  }
>;

export type SynchronizedSubscription = Override<
  Subscription,
  {
    ui_id: string;
    name: string;
    quantity?: number;
    coupon_ids?: string;
    plan?: string;
    original_url: string;
  }
>;

export type SynchronizedCustomer = Override<
  Customer,
  {
    name: string;
    auto_collection: boolean;
    offline_payment_method?: string;
    billing_email?: string;
    billing_company?: string;
    billing_phone?: string;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_address_line3?: string;
    billing_city?: string;
    billing_state_code?: string;
    billing_state?: string;
    billing_country?: string;
    billing_zip?: string;
    billing_validation_status?: string;
    original_url: string;
  }
>;

export type SynchronizedTransaction = Override<
  Transaction,
  {
    name: string;
    invoice_ids?: string;
    credit_note_ids?: string;
    payment_method: string;
    card_brand?: string;
    type: string;
    gateway: string;
    original_url: string;
  }
>;

export type SynchronizedPromotionalCredit = {
  id: string;
  name: string;
  description: string;
  amount: number;
  invoice_id: string;
};

export type SynchronizedCreditNote = Override<
  CreditNote,
  {
    name: string;
    type: string;
    reason_code?: string;
    status?: string;
    vat?: number;
    price_type?: string;
    channel?: string;
    allocated_invoice_ids?: string;
    refunded_transactions?: string;
    original_url: string;
    pdf: string;
  }
>;

export type SynchronizedCoupon = Override<
  Coupon,
  {
    name: string;
    discount_type: string;
    duration_type: string;
    status?: string;
    apply_on: string;
    period_unit?: string;
    original_url: string;
  }
>;

export type SynchronizedCouponSet = Override<
  CouponSet,
  {
    name: string;
  }
>;

export type SynchronizedCouponCode = Override<
  CouponCode,
  {
    id: string;
    name: string;
    status: string;
  }
>;

export type SynchronizedSubscriptionPlan = Override<
  ItemPrice,
  {
    period_unit?: string;
    original_url: string;
  }
>;

export type SynchronizedComment = Override<
  Comment,
  {
    name: string;
    type: string;
  }
>;
