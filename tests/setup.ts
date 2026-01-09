// Set test environment variables before any app imports
process.env.GOOGLE_CLIENT_ID = "test_client_id";
process.env.GOOGLE_CLIENT_SECRET = "test_client_secret";

import nock from "nock";
import {afterAll, afterEach, beforeAll} from "vitest";

beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
});
