import {config} from "../config.js";
import {SynchronizerConfig, SynchronizerType} from "../types/types.synchronizerConfig.js";

export const getSynchronizerConfig = (): SynchronizerConfig => {
  return {
    types: [
      {
        id: SynchronizerType.Invoice,
        name: "Invoice",
        default: true,
      },
      {
        id: SynchronizerType.InvoiceLineItem,
        name: "Invoice Line Item",
        default: true,
      },
      {
        id: SynchronizerType.SubscriptionPlan,
        name: "Subscription Plan",
        default: true,
      },
      {
        id: SynchronizerType.Subscription,
        name: "Subscription",
        default: true,
      },
      {
        id: SynchronizerType.Customer,
        name: "Customer",
        default: true,
      },
      {
        id: SynchronizerType.Transaction,
        name: "Transaction",
        default: true,
      },
      {
        id: SynchronizerType.PromotionalCredit,
        name: "Promotional Credit",
        default: true,
      },
      {
        id: SynchronizerType.CreditNote,
        name: "Credit Note",
        default: true,
      },
      {
        id: SynchronizerType.Comment,
        name: "Comment",
        default: true,
      },
      {
        id: SynchronizerType.Coupon,
        name: "Coupon",
        default: true,
      },
      {
        id: SynchronizerType.CouponSet,
        name: "Coupon Set",
        default: true,
      },
      {
        id: SynchronizerType.CouponCode,
        name: "Coupon Code",
        default: false,
      },
    ],
    filters: [],
    version: config.apiVersion,
  };
};
