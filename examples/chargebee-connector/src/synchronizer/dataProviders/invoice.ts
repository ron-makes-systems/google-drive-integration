import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedInvoice} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, Invoice} from "../../api/chargebee.js";
import {centsToDollar, minToSec, parseIdWithVersion} from "../../utils/data.js";

const downloadInvoicePDF = (invoice: Invoice) => {
  return invoice.status && (invoice.status === "paid" || invoice.status === "voided");
};

const transform = ({
  site,
  versionNumber,
  invoice,
}: {
  site: string;
  versionNumber: number;
  invoice: Invoice;
}): Partial<SynchronizedInvoice> => {
  return {
    ...invoice,
    id: parseIdWithVersion(versionNumber, invoice.id),
    name: invoice.id,
    date: minToSec(invoice.date),
    status: _.startCase(invoice.status),
    price_type: _.startCase(invoice.price_type),
    due_date: minToSec(invoice.due_date),
    paid_at: minToSec(invoice.paid_at),
    next_retry_at: minToSec(invoice.next_retry_at),
    voided_at: minToSec(invoice.voided_at),
    updated_at: minToSec(invoice.updated_at),
    channel: _.startCase(invoice.channel),
    generated_at: minToSec(invoice.generated_at),
    expected_payment_date: minToSec(invoice.expected_payment_date),
    total: centsToDollar(invoice.total),
    amount_paid: centsToDollar(invoice.amount_paid),
    amount_adjusted: centsToDollar(invoice.amount_adjusted),
    write_off_amount: centsToDollar(invoice.write_off_amount),
    credits_applied: centsToDollar(invoice.credits_applied),
    amount_due: centsToDollar(invoice.amount_due),
    sub_total: centsToDollar(invoice.sub_total),
    tax: centsToDollar(invoice.tax),
    amount_to_collect: centsToDollar(invoice.amount_to_collect),
    original_url: `https://${site}.chargebee.com/d/invoices/${invoice.id}`,
    coupon_ids:
      invoice.line_item_discounts
        ?.filter((d) => d.discount_type === "item_level_coupon" || d.discount_type === "document_level_coupon")
        .map((d) => d.entity_id)
        .join(";") || "",
    pdf: downloadInvoicePDF(invoice) ? `app://resource?type=invoice&pdfId=${invoice.id}` : undefined,
  };
};

export const getInvoices: GetDataFn<SynchronizedInvoice, PaginationConfig> = async ({
  account,
  filter,
  versionNumber,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const invoiceResult = await chargebeeApi.getInvoices({
    limit: config.pageSize,
    offset: pagination?.offset,
    filter,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: invoiceResult.list.map((i) => transform({site: account.site, versionNumber, invoice: i})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(invoiceResult.next_offset),
      nextPageConfig: {offset: invoiceResult.next_offset},
    },
  };
};
