type SynchronizerTypeMeta = {
  id: SynchronizerType;
  name: string;
  default: boolean;
  isUser?: boolean;
};

type SynchronizerFilterMeta = {
  id: SynchronizerFilter;
  title: string;
  datalist?: boolean;
  secured?: boolean;
  optional: boolean;
  type: "bool" | "list" | "multidropdown" | "datebox";
  datalist_requires?: Array<SynchronizerFilter>;
  defaultValue?: unknown;
};

export type SynchronizerConfig = {
  types: Array<SynchronizerTypeMeta>;
  filters: Array<SynchronizerFilterMeta>;
  version: number;
};

export enum SynchronizerType {
  Invoice = "invoice",
  InvoiceLineItem = "invoice_line_item",
  Subscription = "subscription",
  Customer = "customer",
  Transaction = "transaction",
  CreditNote = "credit_note",
  Coupon = "coupon",
  CouponSet = "coupon_set",
  CouponCode = "coupon_code",
  SubscriptionPlan = "subscription_plan",
  Comment = "comment",
  PromotionalCredit = "promotional_credit",
}

export const customizableTypes = [SynchronizerType.Subscription, SynchronizerType.Customer];
export const resourceTypes = [SynchronizerType.Invoice, SynchronizerType.CreditNote];
export const commentEntities: string[] = [
  SynchronizerType.Subscription,
  SynchronizerType.Invoice,
  SynchronizerType.CreditNote,
  SynchronizerType.Coupon,
  SynchronizerType.Customer,
  SynchronizerType.Transaction,
];

export enum SynchronizerFilter {}
