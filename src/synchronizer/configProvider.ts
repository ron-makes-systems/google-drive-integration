import {config} from "../config.js";
import {SynchronizerConfig} from "../types/types.synchronizerConfig.js";

export const getSynchronizerConfig = (): SynchronizerConfig => {
  return {
    types: [
      // your-connector: define synced types here
    ],
    filters: [
      // your-connector: define type filters here (empty array is also possible)
    ],
    version: config.apiVersion,
  };
};
