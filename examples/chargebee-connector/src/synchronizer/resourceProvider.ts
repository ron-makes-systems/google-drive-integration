import {Response} from "express";
import {logger} from "../infra/logger.js";
import {ResourceFn} from "../types/types.synchronizerData.js";
import {VizydropAccount} from "../types/types.authentication.js";
import {SynchronizerType} from "../types/types.synchronizerConfig.js";
import {streamInvoicePdf} from "./resourceProviders/invoice.js";
import {streamCreditNotePdf} from "./resourceProviders/creditNote.js";

const resourceProviders: Record<string, ResourceFn> = {
  [SynchronizerType.Invoice]: streamInvoicePdf,
  [SynchronizerType.CreditNote]: streamCreditNotePdf,
};

export const streamResource = async ({
  requestedType,
  out,
  account,
  pdfId,
}: {
  requestedType: SynchronizerType;
  out: Response;
  account: VizydropAccount;
  pdfId: string;
}) => {
  const getResourceForType = resourceProviders[requestedType];
  const timer = logger.startTimer();
  logger.info(`start fetching resource ${requestedType} with pdfId ${pdfId}`);
  try {
    await getResourceForType({
      out,
      account,
      requestedType,
      pdfId,
    });
    timer.done(`fetching of ${requestedType} has been completed with pdfId ${pdfId}`);
  } catch (err) {
    timer.done(`fetching of ${requestedType} has been failed with pdfId ${pdfId}.`, {
      err,
    });
    throw err;
  }
};
