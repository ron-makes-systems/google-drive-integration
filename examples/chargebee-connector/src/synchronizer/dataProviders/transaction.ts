import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedTransaction} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, Transaction} from "../../api/chargebee.js";
import {centsToDollar, parseIdWithVersion} from "../../utils/data.js";

const transform = ({
  site,
  versionNumber,
  transaction,
}: {
  site: string;
  versionNumber: number;
  transaction: Transaction;
}): Partial<SynchronizedTransaction> => {
  return {
    ...transaction,
    name: transaction.id,
    payment_method: _.startCase(transaction.payment_method),
    card_brand: JSON.parse(transaction.payment_method_details || "{}").card?.brand,
    type: _.startCase(transaction.type),
    gateway: _.startCase(transaction.gateway),
    amount: centsToDollar(transaction.amount),
    invoice_ids: transaction.linked_invoices?.map((li) => parseIdWithVersion(versionNumber, li.invoice_id)).join(";"),
    credit_note_ids: transaction.linked_credit_notes
      ?.map((li) => parseIdWithVersion(versionNumber, li.cn_id))
      .join(";"),
    original_url: `https://${site}.chargebee.com/d/transactions/${transaction.id}`,
  };
};

export const getTransactions: GetDataFn<SynchronizedTransaction, PaginationConfig> = async ({
  account,
  versionNumber,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const transactionResult = await chargebeeApi.getTransactions({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: transactionResult.list.map((t) => transform({site: account.site, versionNumber, transaction: t})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(transactionResult.next_offset),
      nextPageConfig: {offset: transactionResult.next_offset},
    },
  };
};
