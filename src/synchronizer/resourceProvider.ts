import {Response} from "express";
import {IntegrationAccount} from "../types/types.authentication.js";
import {createGoogleDriveApi} from "../api/googleDrive.js";
import {logger} from "../infra/logger.js";

export const streamResource = async ({
  out,
  account,
  fileId,
}: {
  out: Response;
  account: IntegrationAccount;
  fileId: string;
}) => {
  const api = createGoogleDriveApi(account);
  const timer = logger.startTimer();
  logger.info(`start streaming file ${fileId}`);

  try {
    // Get file metadata for name, mimeType, and size
    const file = await api.getFileMetadata(fileId);
    const fileName = file.name || fileId;

    await api.streamFile(out, fileId, fileName, file.mimeType, file.size);
    timer.done(`streaming file ${fileId} completed`);
  } catch (err) {
    timer.done(`streaming file ${fileId} failed`, {err});
    throw err;
  }
};
