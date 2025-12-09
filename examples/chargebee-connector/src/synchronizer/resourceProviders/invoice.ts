import {createChargebeeApi} from "../../api/chargebee.js";
import {logger} from "../../infra/logger.js";
import {AppError} from "../../errors/errors.js";
import {ResourceFn} from "../../types/types.synchronizerData.js";

export const streamInvoicePdf: ResourceFn = async ({out, requestedType, account, pdfId}) => {
  try {
    const chargebeeApi = createChargebeeApi(account);
    const downloadUrl = await chargebeeApi.getInvoicePdfUrl(pdfId);
    return await chargebeeApi.streamPdf(out, downloadUrl, requestedType, pdfId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    logger.error(`Failed to stream invoice ${pdfId}`, {data: e});
    throw new AppError({
      statusCode: e.response?.statusCode || e.statusCode || 400,
      message: `Failed to stream invoice ${pdfId}`,
    });
  }
};
