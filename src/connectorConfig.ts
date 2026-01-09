import {ConnectorConfig} from "./types/types.connectorConfig.js";

export const getConnectorConfig = (): ConnectorConfig => {
  return {
    id: "google-drive-connector",
    name: "Google Drive",
    version: "1.0.0",
    type: "crunch",
    description: "Sync files, folders, and users from Google Drive to Fibery",
    authentication: [
      {
        id: "oauth2",
        name: "Google Account",
        description: "Connect with your Google account to access Drive files",
        type: "oauth2",
        provider: "google",
        fields: [
          {
            id: "oauth",
            title: "Google Account",
            description: "Click to connect your Google account",
            type: "oauth",
          },
        ],
      },
    ],
    sources: [],
    responsibleFor: {
      dataSynchronization: true,
    },
  };
};
