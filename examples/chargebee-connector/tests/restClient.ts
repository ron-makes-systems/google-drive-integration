import got from "got";
import {VizydropAccount} from "../src/types/types.authentication.js";
import {SynchronizerType} from "../src/types/types.synchronizerConfig.js";

export const getRestClient = (url: string) => {
  const fetch = got.extend({
    throwHttpErrors: false,
    responseType: "json",
  });

  return {
    getConnectorConfig() {
      return fetch(`${url}`);
    },
    getSyncConfig() {
      return fetch(`${url}/api/v1/synchronizer/config`, {method: `POST`});
    },
    getLogo() {
      return fetch(`${url}/logo`, {responseType: "text"});
    },
    status() {
      return fetch(`${url}/status`);
    },

    validate({site, apiKey}: {site: string; apiKey: string}) {
      return fetch(`${url}/validate`, {
        method: `POST`,
        json: {
          fields: {
            site,
            apiKey,
          },
        },
      });
    },

    getSyncSchema({types, account}: {types: SynchronizerType[]; account: VizydropAccount}) {
      return fetch(`${url}/api/v1/synchronizer/schema`, {
        method: `POST`,
        json: {
          types,
          account,
        },
      });
    },

    getSyncData({
      requestedType,
      account,
      filter = {},
      pagination,
      lastSynchronizedAt,
      version,
    }: {
      requestedType: SynchronizerType;
      account: VizydropAccount;
      filter?: Record<string, unknown>;
      pagination?: Record<string, unknown>;
      lastSynchronizedAt?: string;
      version?: string;
    }) {
      return fetch(`${url}/api/v1/synchronizer/data`, {
        method: `POST`,
        json: {
          account,
          requestedType,
          filter,
          pagination,
          lastSynchronizedAt,
          version,
        },
      });
    },

    getResource({
      account,
      pdfId,
      type,
    }: {
      account: VizydropAccount;
      pdfId: string;
      type: string;
    }) {
      return fetch(`${url}/api/v1/synchronizer/resource`, {
        method: `POST`,
        json: {
          account,
          params: {
            pdfId,
            type,
          },
        },
      });
    },

    validateFilter({filter, account}: {filter: Record<string, unknown>; account: VizydropAccount}) {
      return fetch(`${url}/api/v1/synchronizer/filter/validate`, {
        method: `POST`,
        responseType: "text",
        json: {
          account,
          filter,
        },
      });
    },
  };
};
