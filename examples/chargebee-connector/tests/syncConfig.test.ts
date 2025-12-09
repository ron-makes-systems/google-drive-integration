import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";

describe(`POST /api/v1/synchronizer/config`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it(`should get synchronizer config`, async () => {
    const res = await restClient.getSyncConfig();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      types: [
        {
          id: "invoice",
          name: "Invoice",
          default: true,
        },
        {
          id: "invoice_line_item",
          name: "Invoice Line Item",
          default: true,
        },
        {
          id: "subscription_plan",
          name: "Subscription Plan",
          default: true,
        },
        {
          id: "subscription",
          name: "Subscription",
          default: true,
        },
        {
          id: "customer",
          name: "Customer",
          default: true,
        },
        {
          id: "transaction",
          name: "Transaction",
          default: true,
        },
        {
          id: "promotional_credit",
          name: "Promotional Credit",
          default: true,
        },
        {
          id: "credit_note",
          name: "Credit Note",
          default: true,
        },
        {
          id: "comment",
          name: "Comment",
          default: true,
        },
        {
          id: "coupon",
          name: "Coupon",
          default: true,
        },
        {
          id: "coupon_set",
          name: "Coupon Set",
          default: true,
        },
        {
          id: "coupon_code",
          name: "Coupon Code",
          default: false,
        },
      ],
      filters: [],
      version: expect.any(Number),
    });
  });

  afterAll(async () => {
    await app.destroy();
  });
});
