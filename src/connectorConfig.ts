import {ConnectorConfig} from "./types/types.connectorConfig.js";

export const getConnectorConfig = (): ConnectorConfig => {
  return {
    id: "your-connector",
    name: "Your Connector",
    version: "1.0.0",
    type: "crunch",
    description: "Your Connector Description",
    authentication: [],
    sources: [],
    responsibleFor: {
      userAuthentication: false,
      dataProviding: false,
      dataSynchronization: true,
      dataImport: true,
    },
  };
};
