import {IntegrationAccount} from "./types.authentication.js";
import {SynchronizerDataFilter} from "./types.requests.js";

export type SynchronizationDataType = "delta" | "full";

export type SynchronizerPagination<P> = {
  hasNext: boolean;
  nextPageConfig?: P;
};

export type SynchronizerData<T, P = unknown> = {
  items: Array<Partial<T>>;
  synchronizationType?: SynchronizationDataType;
  pagination?: SynchronizerPagination<P>;
};

export type GetDataFn<T, P = unknown> = (p: {
  account: IntegrationAccount;
  filter?: Partial<SynchronizerDataFilter>;
  lastSynchronizedAt?: string;
  pagination?: P;
}) => Promise<SynchronizerData<T, P>>;

export type PaginationConfig = {
  cursor?: string;
};

// your-connector: define synchronized types
