import nock from "nock";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";
import {invoiceBuilder} from "./mocks/invoiceBuilder.js";

describe(`POST /validate`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;
  const site = "test-site";
  const apiKey = "test_api_key";

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it(`should validate account successfully`, async () => {
    const invoice = invoiceBuilder();

    nock(`https://${site}.chargebee.com`)
      .get(`/api/v2/invoices`)
      .query({limit: 1})
      .reply(200, {
        list: [{invoice}],
      });

    const res = await restClient.validate({site, apiKey});

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      name: site,
    });
  });

  it(`should return error for invalid credentials`, async () => {
    nock(`https://${site}.chargebee.com`)
      .get(`/api/v2/invoices`)
      .query({limit: 1})
      .reply(401, {
        message: "API key is invalid",
        api_error_code: "unauthorized",
      });

    const res = await restClient.validate({site, apiKey});

    expect(res.statusCode).toEqual(401);
  });

  it(`should return error for invalid site name`, async () => {
    const res = await restClient.validate({site: "invalid site!", apiKey});

    expect(res.statusCode).toEqual(400);
  });

  afterAll(async () => {
    await app.destroy();
  });
});
