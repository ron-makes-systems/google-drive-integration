import _ from "lodash";
import axios from "axios";
import {Response} from "express";
import {VizydropAccount} from "../types/types.authentication.js";
import chargebee, {
  Invoice,
  CreditNote,
  Subscription,
  Customer,
  Transaction,
  Coupon,
  CouponSet,
  CouponCode,
  ItemPrice,
  ChargebeeRequest,
  Comment,
} from "chargebee";
import {AppError} from "../errors/errors.js";
import pLimit from "p-limit";
import {SynchronizerType} from "../types/types.synchronizerConfig.js";
import {config} from "../config.js";
import {SynchronizerDataFilter} from "../types/types.requests.js";
import {minToSec} from "../utils/data.js";

const limit = pLimit(config.maxConcurrentConnections);

export const createChargebeeApi = (vizydropAccount: VizydropAccount) => {
  chargebee.configure({
    site: vizydropAccount.site,
    api_key: vizydropAccount.apiKey,
  });

  const call = async <T>(operation: ChargebeeRequest<T>) => {
    try {
      return await limit(async () => await operation.request());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new AppError({
        statusCode: e.http_code || e.http_status_code || 400,
        message: e.message || e.toString(),
        tryLater: e.http_code === 429 || e.http_status_code === 429, // Handle retry in case of rate limits
      });
    }
  };

  const validate = async () => {
    await call<Invoice.ListResponse>(chargebee.invoice.list({limit: 1}));
  };

  const getInvoices = async ({
    limit,
    offset,
    filter,
    date_from,
  }: {
    limit: number;
    offset?: string;
    filter?: Partial<SynchronizerDataFilter>;
    date_from?: string;
  }) => {
    const res = await call<Invoice.ListResponse>(
      chargebee.invoice.list({
        limit,
        offset,
        ...(!_.isEmpty(filter?.ids) && {id: {in: JSON.stringify(filter?.ids)}}),
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.invoice),
      next_offset: res.next_offset,
    };
  };

  const getInvoiceLineItems = async ({
    limit,
    offset,
    filter,
    date_from,
  }: {
    limit: number;
    offset?: string;
    filter?: Partial<SynchronizerDataFilter>;
    date_from?: string;
  }) => {
    const res = await call<Invoice.ListResponse>(
      chargebee.invoice.list({
        limit,
        offset,
        ...(!_.isEmpty(filter?.ids) && {id: {in: JSON.stringify(filter?.ids)}}),
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.flatMap((i) =>
        (i.invoice?.line_items ?? []).map((lineItem) => ({
          ...lineItem,
          invoice_id: i.invoice?.id,
        })),
      ) as InvoiceLineItemWithInvoiceId[],
      next_offset: res.next_offset,
    };
  };

  const getCreditNotes = async ({limit, offset, date_from}: {limit: number; offset?: string; date_from?: string}) => {
    const res = await call<CreditNote.ListResponse>(
      chargebee.credit_note.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.credit_note),
      next_offset: res.next_offset,
    };
  };

  const getSubscriptions = async ({limit, offset, date_from}: {limit: number; offset?: string; date_from?: string}) => {
    const res = await call<Subscription.ListResponse>(
      chargebee.subscription.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => ({
        ...i.subscription,
        auto_collection: i.subscription.auto_collection || i.customer.auto_collection,
      })),
      next_offset: res.next_offset,
    };
  };

  const getCustomers = async ({limit, offset, date_from}: {limit: number; offset?: string; date_from?: string}) => {
    const res = await call<Customer.ListResponse>(
      chargebee.customer.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.customer),
      next_offset: res.next_offset,
    };
  };

  const getTransactions = async ({limit, offset, date_from}: {limit: number; offset?: string; date_from?: string}) => {
    const res = await call<Transaction.ListResponse>(
      chargebee.transaction.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.transaction),
      next_offset: res.next_offset,
    };
  };

  const getPromotionalCredits = async ({
    limit,
    offset,
    date_from,
  }: {
    limit: number;
    offset?: string;
    date_from?: string;
  }) => {
    const res = await call<Invoice.ListResponse>(
      chargebee.invoice.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.flatMap((i) =>
        (i.invoice?.discounts ?? [])
          .filter((discountItem) => discountItem.entity_type === "promotional_credits")
          .map((discountItem) => ({
            ...discountItem,
            invoice_id: i.invoice?.id,
          })),
      ) as DiscountWithInvoiceId[],
      next_offset: res.next_offset,
    };
  };

  const getCoupons = async ({limit, offset, date_from}: {limit: number; offset?: string; date_from?: string}) => {
    const res = await call<Coupon.ListResponse>(
      chargebee.coupon.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.coupon),
      next_offset: res.next_offset,
    };
  };

  const getAllCouponIds = async ({limit, date_from}: {limit: number; date_from?: string}) => {
    const allCouponIds: string[] = [];
    let offset = undefined;
    const previousDateFrom = date_from ? parseInt(date_from) * 1000 : 0;
    do {
      const couponIds = await getCoupons({limit, offset, date_from});
      offset = couponIds.next_offset;
      allCouponIds.push(
        ...couponIds.list
          .filter(
            (c) => minToSec(c.created_at) || 0 > previousDateFrom || minToSec(c.updated_at) || 0 > previousDateFrom,
          )
          .map((c) => c.id),
      );
    } while (!_.isEmpty(offset));
    return JSON.stringify(allCouponIds);
  };

  const getCouponSets = async ({
    limit,
    offset,
    couponIds = "[]",
  }: {
    limit: number;
    offset?: string;
    couponIds?: string;
  }) => {
    const res = await call<CouponSet.ListResponse>(
      chargebee.coupon_set.list({
        limit,
        offset,
        coupon_id: {in: couponIds},
      }),
    );
    return {
      list: res.list.map((i) => i.coupon_set),
      next_offset: res.next_offset,
    };
  };

  const getCouponCodes = async ({
    limit,
    offset,
    couponIds = "[]",
  }: {
    limit: number;
    offset?: string;
    couponIds?: string;
  }) => {
    const res = await call<{list: {coupon_code: CouponCode}[]; next_offset: string}>(
      // eslint-disable-next-line
      // @ts-ignore
      chargebee.coupon_code.list({
        limit,
        offset,
        coupon_id: {in: couponIds},
      }),
    );
    return {
      list: res.list.map((i) => i.coupon_code),
      next_offset: res.next_offset,
    };
  };

  const getSubscriptionPlans = async ({
    limit,
    offset,
    date_from,
  }: {
    limit: number;
    offset?: string;
    date_from?: string;
  }) => {
    const res = await call<ItemPrice.ListResponse>(
      chargebee.item_price.list({
        limit,
        offset,
        item_type: {is: "plan"},
        ...(!_.isEmpty(date_from) && {updated_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.item_price),
      next_offset: res.next_offset,
    };
  };

  const getComments = async ({limit, offset, date_from}: {limit: number; offset?: string; date_from?: string}) => {
    const res = await call<Comment.ListResponse>(
      chargebee.comment.list({
        limit,
        offset,
        ...(!_.isEmpty(date_from) && {created_at: {after: date_from}}),
      }),
    );
    return {
      list: res.list.map((i) => i.comment),
      next_offset: res.next_offset,
    };
  };

  const typeToGetMethod = {
    [SynchronizerType.Invoice]: getInvoices,
    [SynchronizerType.InvoiceLineItem]: getInvoiceLineItems,
    [SynchronizerType.CreditNote]: getCreditNotes,
    [SynchronizerType.Subscription]: getSubscriptions,
    [SynchronizerType.Customer]: getCustomers,
    [SynchronizerType.Transaction]: getTransactions,
    [SynchronizerType.PromotionalCredit]: getPromotionalCredits,
    [SynchronizerType.Coupon]: getCoupons,
    [SynchronizerType.CouponSet]: getCouponSets,
    [SynchronizerType.CouponCode]: getCouponCodes,
    [SynchronizerType.SubscriptionPlan]: getSubscriptionPlans,
    [SynchronizerType.Comment]: getComments,
  };

  const getCustomFieldsForType = async (type: SynchronizerType) => {
    const res = await typeToGetMethod[type]({limit: 1});

    if (res.list.length === 0) {
      return [];
    }

    return Object.keys(res.list[0]).filter((k) => k.startsWith("cf_"));
  };

  const getInvoicePdfUrl = async (invoiceId: string) => {
    const res = await call<Invoice.PdfResponse>(chargebee.invoice.pdf(invoiceId));
    return res.download.download_url;
  };

  const getCreditNotePdfUrl = async (creditNoteId: string) => {
    const res = await call<CreditNote.PdfResponse>(chargebee.credit_note.pdf(creditNoteId));
    return res.download.download_url;
  };

  const streamPdf = async (out: Response, url: string, type: string, pdfId: string) => {
    const pdfStream = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    // Set appropriate headers
    out.setHeader("Content-Type", "application/pdf");
    out.setHeader("Content-Disposition", `attachment; filename="${type}-${pdfId}.pdf"`);

    // If Content-Length is available, set it
    if (pdfStream.headers["content-length"]) {
      out.setHeader("Content-Length", pdfStream.headers["content-length"]);
    }

    // Pipe the PDF stream to the response
    pdfStream.data.pipe(out);

    // Handle errors during streaming
    pdfStream.data.on("error", (error: Error) => {
      console.error(`Error streaming PDF for ${type} ${pdfId}:`, error);
      // Only send error if headers haven't been sent yet
      if (!out.headersSent) {
        out.status(500).json({error: "Error streaming PDF"});
      }
    });

    return new Promise((resolve, reject) => {
      out.on("finish", resolve);
      out.on("error", reject);
      pdfStream.data.on("error", reject);
    });
  };

  return {
    validate,
    getInvoices,
    getInvoiceLineItems,
    getCreditNotes,
    getSubscriptions,
    getCustomers,
    getTransactions,
    getPromotionalCredits,
    getCoupons,
    getCouponSets,
    getCouponCodes,
    getSubscriptionPlans,
    getComments,
    getCustomFieldsForType,
    getInvoicePdfUrl,
    streamPdf,
    getCreditNotePdfUrl,
    getAllCouponIds,
  };
};

export type {
  Invoice,
  CreditNote,
  Subscription,
  Customer,
  Transaction,
  PromotionalCredit,
  Coupon,
  CouponSet,
  CouponCode,
  ItemPrice,
  Comment,
} from "chargebee";
export type InvoiceLineItemWithInvoiceId = Invoice.LineItem & {
  invoice_id?: string;
};
export type DiscountWithInvoiceId = Invoice.Discount & {
  invoice_id: string;
};
export type ChargebeeApi = ReturnType<typeof createChargebeeApi>;
