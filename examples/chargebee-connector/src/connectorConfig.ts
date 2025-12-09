import {ConnectorConfig} from "./types/types.connectorConfig.js";

export const getConnectorConfig = (): ConnectorConfig => {
  return {
    id: `chargebee-connector`,
    name: `Chargebee`,
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
  };
};
