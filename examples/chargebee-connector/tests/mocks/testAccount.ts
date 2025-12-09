import {VizydropAccount} from "../../src/types/types.authentication.js";

export const createTestAccount = (overrides: Partial<VizydropAccount> = {}): VizydropAccount => {
  return {
    auth: "token",
    site: "test-site",
    apiKey: "test_api_key",
    ...overrides,
  };
};
