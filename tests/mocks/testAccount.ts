import {IntegrationAccount} from "../../src/types/types.authentication.js";

export const createTestAccount = (): IntegrationAccount => ({
  auth: "oauth2",
  access_token: "test_access_token",
  refresh_token: "test_refresh_token",
});
