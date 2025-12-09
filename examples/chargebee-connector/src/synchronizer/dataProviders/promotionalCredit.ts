import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedPromotionalCredit} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, DiscountWithInvoiceId} from "../../api/chargebee.js";
import {centsToDollar, parseIdWithVersion} from "../../utils/data.js";

const transform = ({
  promotionalCredit,
  versionNumber,
}: {
  promotionalCredit: DiscountWithInvoiceId;
  versionNumber: number;
}): Partial<SynchronizedPromotionalCredit> => {
  const id = `${promotionalCredit.invoice_id}-${promotionalCredit.amount}`;
  return {
    id: id,
    name: `Promotional Credit for Invoice ${promotionalCredit.invoice_id}`,
    description: promotionalCredit.description,
    amount: centsToDollar(promotionalCredit.amount),
    invoice_id: parseIdWithVersion(versionNumber, promotionalCredit.invoice_id),
  };
};

export const getPromotionalCredits: GetDataFn<SynchronizedPromotionalCredit, PaginationConfig> = async ({
  account,
  versionNumber,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const promotionalCreditResult = await chargebeeApi.getPromotionalCredits({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: promotionalCreditResult.list.map((pc) => transform({promotionalCredit: pc, versionNumber})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(promotionalCreditResult.next_offset),
      nextPageConfig: {offset: promotionalCreditResult.next_offset},
    },
  };
};
