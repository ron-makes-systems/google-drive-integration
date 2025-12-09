import {AuthenticationType, VizydropAccount} from "./types.authentication.js";
import {SynchronizerType} from "./types.synchronizerConfig.js";
import {PaginationConfig} from "./types.synchronizerData.js";

export type AccountValidateRequestBody = {
  id: AuthenticationType;
  fields: VizydropAccount;
};

export type GetSynchronizerSchemaRequestBody = {
  account: VizydropAccount;
  types: Array<SynchronizerType>;
};

export type SynchronizerDataFilter = {
  ids?: Array<string>;
};

export type GetDataRequestBody = {
  account?: VizydropAccount;
  requestedType?: SynchronizerType;
  filter?: Partial<SynchronizerDataFilter>;
  lastSynchronizedAt?: string;
  pagination?: PaginationConfig;
  version?: string;
};

export type ResourceRequestBody = {
  account?: VizydropAccount;
  params?: {type?: SynchronizerType; pdfId?: string};
};
