import nock from "nock";
import {afterAll, afterEach, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";
import {createTestAccount} from "./mocks/testAccount.js";
import {SynchronizerType} from "../src/types/types.synchronizerConfig.js";
import {invoiceBuilder, resetInvoiceCounter} from "./mocks/invoiceBuilder.js";
import {customerBuilder, resetCustomerCounter} from "./mocks/customerBuilder.js";
import {subscriptionBuilder, resetSubscriptionCounter} from "./mocks/subscriptionBuilder.js";
import {transactionBuilder, resetTransactionCounter} from "./mocks/transactionBuilder.js";
import {couponBuilder, resetCouponCounter} from "./mocks/couponBuilder.js";
import {creditNoteBuilder, resetCreditNoteCounter} from "./mocks/creditNoteBuilder.js";
import {itemPriceBuilder, resetItemPriceCounter} from "./mocks/itemPriceBuilder.js";
import {commentBuilder, resetCommentCounter} from "./mocks/commentBuilder.js";
import {SynchronizedInvoice, SynchronizerData} from "../src/types/types.synchronizerData.js";

describe(`POST /api/v1/synchronizer/data`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;
  const account = createTestAccount();

  const chargebeeApi = (site: string) => nock(`https://${site}.chargebee.com`);

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  afterEach(() => {
    resetInvoiceCounter();
    resetCustomerCounter();
    resetSubscriptionCounter();
    resetTransactionCounter();
    resetCouponCounter();
    resetCreditNoteCounter();
    resetItemPriceCounter();
    resetCommentCounter();
    nock.cleanAll();
  });

  describe(`invoices`, () => {
    it(`should retrieve all invoices`, async () => {
      const invoice1 = invoiceBuilder();
      const invoice2 = invoiceBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/invoices`)
        .query({limit: 50})
        .reply(200, {
          list: [{invoice: invoice1}, {invoice: invoice2}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Invoice,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: invoice1.id,
            name: invoice1.id,
            status: "Paid",
            original_url: `https://${account.site}.chargebee.com/d/invoices/${invoice1.id}`,
          },
          {
            id: invoice2.id,
            name: invoice2.id,
            status: "Paid",
            original_url: `https://${account.site}.chargebee.com/d/invoices/${invoice2.id}`,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });

    it(`should handle pagination for invoices`, async () => {
      const invoice1 = invoiceBuilder();
      const invoice2 = invoiceBuilder();
      const nextOffset = "next_page_token";

      chargebeeApi(account.site)
        .get(`/api/v2/invoices`)
        .query({limit: 50})
        .reply(200, {
          list: [{invoice: invoice1}],
          next_offset: nextOffset,
        });

      const res1 = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Invoice,
      });

      expect(res1.statusCode).toEqual(200);
      expect(res1.body).toMatchObject({
        items: [{id: invoice1.id}],
        synchronizationType: "full",
        pagination: {
          hasNext: true,
          nextPageConfig: {offset: nextOffset},
        },
      });

      chargebeeApi(account.site)
        .get(`/api/v2/invoices`)
        .query({limit: 50, offset: nextOffset})
        .reply(200, {
          list: [{invoice: invoice2}],
        });

      const res2 = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Invoice,
        pagination: {offset: nextOffset},
      });

      expect(res2.statusCode).toEqual(200);
      expect(res2.body).toMatchObject({
        items: [{id: invoice2.id}],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });

    it(`should support delta sync for invoices`, async () => {
      const invoice1 = invoiceBuilder();
      const lastSynchronizedAt = "2024-01-01T00:00:00.000Z";

      chargebeeApi(account.site)
        .get(`/api/v2/invoices`)
        .query({limit: 50, "updated_at[after]": "1704067200"})
        .reply(200, {
          list: [{invoice: invoice1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Invoice,
        lastSynchronizedAt,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [{id: invoice1.id}],
        synchronizationType: "delta",
        pagination: {
          hasNext: false,
        },
      });
    });

    it(`should include PDF link for paid invoices`, async () => {
      const paidInvoice = invoiceBuilder({status: "paid"});
      const pendingInvoice = invoiceBuilder({status: "pending"});

      chargebeeApi(account.site)
        .get(`/api/v2/invoices`)
        .query({limit: 50})
        .reply(200, {
          list: [{invoice: paidInvoice}, {invoice: pendingInvoice}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Invoice,
      });

      expect(res.statusCode).toEqual(200);
      // eslint-disable-next-line
      // @ts-ignore
      const items = (res.body as SynchronizerData<SynchronizedInvoice>).items;
      const paidItem = items.find((i) => i.id === paidInvoice.id);
      const pendingItem = items.find((i) => i.id === pendingInvoice.id);

      expect(paidItem?.pdf).toEqual(`app://resource?type=invoice&pdfId=${paidInvoice.id}`);
      expect(pendingItem?.pdf).toBeUndefined();
    });
  });

  describe(`customers`, () => {
    it(`should retrieve all customers`, async () => {
      const customer1 = customerBuilder();
      const customer2 = customerBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/customers`)
        .query({limit: 50})
        .reply(200, {
          list: [{customer: customer1}, {customer: customer2}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Customer,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: customer1.id,
            email: customer1.email,
            original_url: `https://${account.site}.chargebee.com/d/customers/${customer1.id}`,
          },
          {
            id: customer2.id,
            email: customer2.email,
            original_url: `https://${account.site}.chargebee.com/d/customers/${customer2.id}`,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });

    it(`should support delta sync for customers`, async () => {
      const customer1 = customerBuilder();
      const lastSynchronizedAt = "2024-01-01T00:00:00.000Z";

      chargebeeApi(account.site)
        .get(`/api/v2/customers`)
        .query({limit: 50, "updated_at[after]": "1704067200"})
        .reply(200, {
          list: [{customer: customer1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Customer,
        lastSynchronizedAt,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        synchronizationType: "delta",
      });
    });
  });

  describe(`subscriptions`, () => {
    it(`should retrieve all subscriptions`, async () => {
      const subscription1 = subscriptionBuilder();
      const customer1 = customerBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/subscriptions`)
        .query({limit: 50})
        .reply(200, {
          list: [{subscription: subscription1, customer: customer1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Subscription,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: subscription1.id,
            customer_id: subscription1.customer_id,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });
  });

  describe(`transactions`, () => {
    it(`should retrieve all transactions`, async () => {
      const transaction1 = transactionBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/transactions`)
        .query({limit: 50})
        .reply(200, {
          list: [{transaction: transaction1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Transaction,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: transaction1.id,
            payment_method: "Card",
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });
  });

  describe(`coupons`, () => {
    it(`should retrieve all coupons`, async () => {
      const coupon1 = couponBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/coupons`)
        .query({limit: 50})
        .reply(200, {
          list: [{coupon: coupon1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Coupon,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: coupon1.id,
            name: coupon1.name,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });
  });

  describe(`credit notes`, () => {
    it(`should retrieve all credit notes`, async () => {
      const creditNote1 = creditNoteBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/credit_notes`)
        .query({limit: 50})
        .reply(200, {
          list: [{credit_note: creditNote1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.CreditNote,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: creditNote1.id,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });
  });

  describe(`subscription plans`, () => {
    it(`should retrieve all subscription plans`, async () => {
      const itemPrice1 = itemPriceBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/item_prices`)
        .query({limit: 50, "item_type[is]": "plan"})
        .reply(200, {
          list: [{item_price: itemPrice1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.SubscriptionPlan,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: itemPrice1.id,
            name: itemPrice1.name,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });
  });

  describe(`comments`, () => {
    it(`should retrieve all comments`, async () => {
      const comment1 = commentBuilder();

      chargebeeApi(account.site)
        .get(`/api/v2/comments`)
        .query({limit: 50})
        .reply(200, {
          list: [{comment: comment1}],
        });

      const res = await restClient.getSyncData({
        account,
        requestedType: SynchronizerType.Comment,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        items: [
          {
            id: comment1.id,
            notes: comment1.notes,
          },
        ],
        synchronizationType: "full",
        pagination: {
          hasNext: false,
        },
      });
    });
  });

  it(`should return 400 for unknown type`, async () => {
    const res = await restClient.getSyncData({
      account,
      requestedType: "unknown" as SynchronizerType,
    });

    expect(res.statusCode).toEqual(400);
  });

  it(`should return 400 when account is missing`, async () => {
    const res = await restClient.getSyncData({
      account: undefined as unknown as typeof account,
      requestedType: SynchronizerType.Invoice,
    });

    expect(res.statusCode).toEqual(400);
  });

  afterAll(async () => {
    await app.destroy();
  });
});
