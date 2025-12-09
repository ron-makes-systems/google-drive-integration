import nock from "nock";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";
import {createTestAccount} from "./mocks/testAccount.js";
import {SynchronizerType} from "../src/types/types.synchronizerConfig.js";
import {customerBuilder} from "./mocks/customerBuilder.js";

describe(`POST /api/v1/synchronizer/schema`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;
  const account = createTestAccount();

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it(`should get schema for invoice type`, async () => {
    const res = await restClient.getSyncSchema({
      types: [SynchronizerType.Invoice],
      account,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toMatchObject({
      [SynchronizerType.Invoice]: {
        id: {
          name: "Id",
          type: "id",
        },
        name: {
          name: "Name",
          type: "text",
        },
        status: {
          name: "Status",
          type: "text",
          subType: "single-select",
        },
        total: {
          name: "Total",
          type: "number",
        },
        customer_id: {
          name: "Customer ID",
          type: "text",
          relation: expect.objectContaining({
            cardinality: "many-to-one",
            targetType: SynchronizerType.Customer,
          }),
        },
      },
    });
  });

  it(`should get schema with custom fields for customer type`, async () => {
    const customer = customerBuilder({
      cf_custom_field: "custom value",
    } as Record<string, unknown>);

    nock(`https://${account.site}.chargebee.com`)
      .get(`/api/v2/customers`)
      .query({limit: 1})
      .reply(200, {
        list: [{customer}],
      });

    const res = await restClient.getSyncSchema({
      types: [SynchronizerType.Customer],
      account,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toMatchObject({
      [SynchronizerType.Customer]: {
        id: {
          name: "Id",
          type: "id",
        },
        name: {
          name: "Name",
          type: "text",
        },
        email: {
          name: "Email",
          type: "text",
          subType: "email",
        },
        cf_custom_field: {
          name: "Custom Field",
          type: "text",
        },
      },
    });
  });

  it(`should get schema for multiple types`, async () => {
    const res = await restClient.getSyncSchema({
      types: [SynchronizerType.Invoice, SynchronizerType.Transaction, SynchronizerType.CreditNote],
      account,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty(SynchronizerType.Invoice);
    expect(res.body).toHaveProperty(SynchronizerType.Transaction);
    expect(res.body).toHaveProperty(SynchronizerType.CreditNote);
  });

  it(`should return empty schema for unknown type`, async () => {
    const res = await restClient.getSyncSchema({
      types: ["unknown" as SynchronizerType],
      account,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({});
  });

  afterAll(async () => {
    await app.destroy();
  });
});
