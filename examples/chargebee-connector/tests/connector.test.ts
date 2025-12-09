import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {getRestClient} from "./restClient.js";
import {createTestApp} from "./testApp.js";

describe(`GET /`, () => {
  let app: ReturnType<typeof createTestApp>;
  let restClient: ReturnType<typeof getRestClient>;

  beforeAll(async () => {
    app = createTestApp();
    restClient = getRestClient(app.url);
  });

  it(`should get connector config`, async () => {
    const res = await restClient.getConnectorConfig();

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      id: "chargebee-connector",
      name: "Chargebee",
      version: "1.0.0",
      type: "crunch",
      description: "Automatically sync Chargebee invoices to Fibery.",
      authentication: [
        {
          description: "Provide Chargebee API key",
          name: "Token Authentication",
          id: "token",
          fields: [
            {
              title: "Site",
              description: "Subdomain in Chargebee. Example of site: https://{site}.chargebee.com",
              type: "text",
              id: "site",
            },
            {
              title: "API Key",
              description: "Personal Chargebee API key",
              type: "password",
              id: "apiKey",
            },
            {
              type: "link",
              value: "https://www.chargebee.com/docs/2.0/api_keys.html",
              description: "We need to have your API key to use Chargebee API for retrieving data.",
              id: "token-link",
              name: "Generate API key...",
            },
          ],
        },
      ],
      sources: [],
      responsibleFor: {
        userAuthentication: false,
        dataProviding: false,
        dataSynchronization: true,
        dataImport: true,
      },
    });
  });

  afterAll(async () => {
    await app.destroy();
  });
});
