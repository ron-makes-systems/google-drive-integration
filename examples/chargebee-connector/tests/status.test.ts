import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";

describe(`GET /status`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it(`should get status`, async () => {
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
