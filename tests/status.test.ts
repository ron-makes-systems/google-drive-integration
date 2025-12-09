import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient, RestClient} from "./restClient.js";
import {createTestApp, TestApp} from "./testApp.js";

describe("GET /status", () => {
  let app: TestApp;
  let restClient: RestClient;

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it("should return status ok", async () => {
    const res = await restClient.status();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      ok: true,
    });
  });

  afterAll(async () => {
    await app.destroy();
  });
});
