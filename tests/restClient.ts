import {ConnectorConfig} from "../src/types/types.connectorConfig.js";
import {SynchronizerConfig} from "../src/types/types.synchronizerConfig.js";
import {SynchronizerData} from "../src/types/types.synchronizerData.js";
import {SynchronizerSchema} from "../src/types/types.synchronizerSchema.js";
import {IntegrationAccount} from "../src/types/types.authentication.js";
import {
  DatalistRequestBody,
  SynchronizerDataFilter,
  GetDataRequestBody,
} from "../src/types/types.requests.js";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

const request = async <T>(url: string, options: RequestOptions = {}): Promise<{statusCode: number; body: T}> => {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = (await response.json().catch(() => ({}))) as T;

  return {
    statusCode: response.status,
    body,
  };
};

export interface RestClient {
  getConnectorConfig(): Promise<{statusCode: number; body: ConnectorConfig}>;
  getSyncConfig(account: IntegrationAccount): Promise<{statusCode: number; body: SynchronizerConfig}>;
  getLogo(): Promise<{statusCode: number; body: string}>;
  status(): Promise<{statusCode: number; body: {ok: boolean}}>;
  validate(fields: IntegrationAccount): Promise<{statusCode: number; body: {valid: boolean; message?: string}}>;
  getSyncDatalist(params: DatalistRequestBody): Promise<{statusCode: number; body: unknown}>;
  getSyncData(params: GetDataRequestBody): Promise<{statusCode: number; body: SynchronizerData<unknown>}>;
  getSyncSchema(params: {
    types: string[];
    account: IntegrationAccount;
    filter?: Partial<SynchronizerDataFilter>;
  }): Promise<{statusCode: number; body: SynchronizerSchema}>;
  validateFilter(params: {
    filter: Partial<SynchronizerDataFilter>;
    account: IntegrationAccount;
  }): Promise<{statusCode: number; body: {valid: boolean; message?: string}}>;
}

export const getRestClient = (url: string): RestClient => {
  return {
    getConnectorConfig() {
      return request<ConnectorConfig>(`${url}`);
    },
    getSyncConfig(account: IntegrationAccount) {
      return request<SynchronizerConfig>(`${url}/api/v1/synchronizer/config`, {
        method: "POST",
        body: {account},
      });
    },
    getLogo() {
      return request<string>(`${url}/logo`);
    },
    status() {
      return request<{ok: boolean}>(`${url}/status`);
    },
    validate(fields: IntegrationAccount) {
      return request<{valid: boolean; message?: string}>(`${url}/validate`, {
        method: "POST",
        body: {fields},
      });
    },
    getSyncDatalist(params: DatalistRequestBody) {
      return request<unknown>(`${url}/api/v1/synchronizer/datalist`, {
        method: "POST",
        body: params,
      });
    },
    getSyncData(params: GetDataRequestBody) {
      return request<SynchronizerData<unknown>>(`${url}/api/v1/synchronizer/data`, {
        method: "POST",
        body: params,
      });
    },
    getSyncSchema({types, account, filter = {}}) {
      return request<SynchronizerSchema>(`${url}/api/v1/synchronizer/schema`, {
        method: "POST",
        body: {
          account,
          types,
          filter,
        },
      });
    },
    validateFilter({filter, account}) {
      return request<{valid: boolean; message?: string}>(`${url}/validate/filter`, {
        method: "POST",
        body: {
          account,
          filter,
        },
      });
    },
  };
};
