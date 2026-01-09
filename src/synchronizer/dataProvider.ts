import {logger} from "../infra/logger.js";
import {ValidationError} from "../errors/errors.js";
import {SynchronizerType} from "../types/types.synchronizerConfig.js";
import {GetDataFn, PaginationConfig, SynchronizerData} from "../types/types.synchronizerData.js";
import {IntegrationAccount} from "../types/types.authentication.js";
import {SynchronizerDataFilter} from "../types/types.requests.js";
import {getDrives} from "./dataProviders/drive.js";
import {getFolders} from "./dataProviders/folder.js";
import {getFiles} from "./dataProviders/file.js";
import {getUsers} from "./dataProviders/user.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataProviders: Record<SynchronizerType, GetDataFn<unknown, any>> = {
  [SynchronizerType.Drive]: getDrives,
  [SynchronizerType.Folder]: getFolders,
  [SynchronizerType.File]: getFiles,
  [SynchronizerType.User]: getUsers,
};

export const getData = async ({
  account,
  requestedType,
  filter,
  lastSynchronizedAt,
  pagination,
}: {
  account: IntegrationAccount;
  requestedType: SynchronizerType;
  filter?: Partial<SynchronizerDataFilter>;
  lastSynchronizedAt?: string;
  pagination?: PaginationConfig;
}): Promise<SynchronizerData<unknown>> => {
  const getDataForType = dataProviders[requestedType];
  if (!getDataForType) {
    throw new ValidationError(`invalid "requestedType" ${requestedType}`);
  }

  const timer = logger.startTimer();
  logger.info(
    `start fetching data ${requestedType} with pagination ${JSON.stringify(
      pagination,
    )}. lastSynchronizedAt: ${lastSynchronizedAt}`,
  );
  try {
    const data = await getDataForType({
      account,
      filter,
      lastSynchronizedAt,
      pagination,
    });
    timer.done(
      `fetching of ${requestedType} has been completed with pagination ${JSON.stringify(pagination)}. fetched items: ${
        data.items.length
      }, sync type: ${data.synchronizationType}`,
    );
    return data;
  } catch (err) {
    timer.done(`fetching of ${requestedType} has been failed with pagination ${JSON.stringify(pagination)}.`, {
      err,
    });
    throw err;
  }
};
