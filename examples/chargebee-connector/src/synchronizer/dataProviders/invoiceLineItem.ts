import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedInvoiceLineItem} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, InvoiceLineItemWithInvoiceId} from "../../api/chargebee.js";
import {centsToDollar, minToSec, parseIdWithVersion} from "../../utils/data.js";

const transform = (
  versionNumber: number,
  line_item: InvoiceLineItemWithInvoiceId,
): Partial<SynchronizedInvoiceLineItem> => {
  return {
    ...line_item,
    name: line_item.description,
    invoice_id: parseIdWithVersion(versionNumber, line_item.invoice_id),
    date_from: minToSec(line_item.date_from),
    date_to: minToSec(line_item.date_to),
    entity_type: _.startCase(line_item.entity_type),
    unit_amount: centsToDollar(line_item.unit_amount),
    amount: centsToDollar(line_item.amount),
    tax_amount: centsToDollar(line_item.tax_amount),
    discount_amount: centsToDollar(line_item.discount_amount),
    plan: line_item.entity_type === "plan_item_price" ? line_item.entity_id : undefined,
  };
};

export const getInvoiceLineItems: GetDataFn<SynchronizedInvoiceLineItem, PaginationConfig> = async ({
  account,
  filter,
  versionNumber,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const invoiceLineItemResult = await chargebeeApi.getInvoiceLineItems({
    limit: config.pageSize,
    offset: pagination?.offset,
    filter,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: invoiceLineItemResult.list.map((li) => transform(versionNumber, li)),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(invoiceLineItemResult.next_offset),
      nextPageConfig: {offset: invoiceLineItemResult.next_offset},
    },
  };
};
