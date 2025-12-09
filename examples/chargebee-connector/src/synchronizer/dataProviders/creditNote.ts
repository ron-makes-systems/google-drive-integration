import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedCreditNote} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, CreditNote} from "../../api/chargebee.js";
import {centsToDollar, minToSec, parseIdWithVersion} from "../../utils/data.js";

const transform = ({
  site,
  versionNumber,
  creditNote,
}: {
  site: string;
  versionNumber: number;
  creditNote: CreditNote;
}): Partial<SynchronizedCreditNote> => {
  return {
    ...creditNote,
    id: parseIdWithVersion(versionNumber, creditNote.id),
    reference_invoice_id: parseIdWithVersion(versionNumber, creditNote.reference_invoice_id),
    name: creditNote.id,
    type: _.startCase(creditNote.type),
    reason_code: _.startCase(creditNote.reason_code),
    status: _.startCase(creditNote.status),
    vat: centsToDollar(_.get(creditNote.taxes?.filter((tax) => tax.name === "VAT"), "[0].amount")),
    date: minToSec(creditNote.date),
    price_type: _.startCase(creditNote.price_type),
    refunded_at: minToSec(creditNote.refunded_at),
    voided_at: minToSec(creditNote.voided_at),
    updated_at: minToSec(creditNote.updated_at),
    channel: _.startCase(creditNote.channel),
    generated_at: minToSec(creditNote.generated_at),
    allocated_invoice_ids: creditNote.allocations
      ?.map((allocation) => parseIdWithVersion(versionNumber, allocation.invoice_id))
      .join(";"),
    refunded_transactions: creditNote.linked_refunds?.map((refund) => refund.txn_id).join(";"),
    total: centsToDollar(creditNote.total),
    amount_allocated: centsToDollar(creditNote.amount_allocated),
    amount_refunded: centsToDollar(creditNote.amount_refunded),
    amount_available: centsToDollar(creditNote.amount_available),
    fractional_correction: centsToDollar(creditNote.fractional_correction),
    sub_total: centsToDollar(creditNote.sub_total),
    original_url: `https://${site}.chargebee.com/d/credit_notes/${creditNote.id}`,
    pdf: `app://resource?type=credit_note&pdfId=${creditNote.id}`,
  };
};

export const getCreditNotes: GetDataFn<SynchronizedCreditNote, PaginationConfig> = async ({
  account,
  versionNumber,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const creditNoteResult = await chargebeeApi.getCreditNotes({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: creditNoteResult.list.map((cn) => transform({site: account.site, versionNumber, creditNote: cn})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(creditNoteResult.next_offset),
      nextPageConfig: {offset: creditNoteResult.next_offset},
    },
  };
};
