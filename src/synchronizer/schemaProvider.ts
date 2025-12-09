import {SynchronizerSchema} from "../types/types.synchronizerSchema.js";
import {SynchronizerType} from "../types/types.synchronizerConfig.js";
import {IntegrationAccount} from "../types/types.authentication.js";

const schema: SynchronizerSchema = {
  // your-connector: define what schema each sync type has (if they are static)
};

export const getSchema = async (
  types: Array<SynchronizerType>,
  _account: IntegrationAccount,
): Promise<SynchronizerSchema> => {
  const result: SynchronizerSchema = {};

  for (const type of types) {
    if (schema[type]) {
      result[type] = schema[type];
    }
  }

  return result;
};
