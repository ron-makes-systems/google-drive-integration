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
