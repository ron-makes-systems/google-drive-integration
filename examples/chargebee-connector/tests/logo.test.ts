import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";

describe(`GET /logo`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it(`should respond with 200 and SVG content type`, async () => {
    const res = await restClient.getLogo();

    expect(res.statusCode).toEqual(200);
    expect(res.headers["content-type"]).toEqual("image/svg+xml");
  });

  afterAll(async () => {
    await app.destroy();
  });
});
