import {AuthenticationType} from "./types.authentication.js";

type ConnectorConfigAuthenticationField = {
  title: string;
  description?: string;
  type: "oauth" | "password" | "text";
  id: string;
};

type ConnectorConfigLinkField = {
  type: "link";
  value: string;
  description?: string;
  id: string;
  name: string;
};

type ConnectorConfigAuthentication = {
  description: string;
  name: string;
  id: AuthenticationType;
  fields: Array<ConnectorConfigAuthenticationField | ConnectorConfigLinkField>;
  type?: "oauth2" | "oauth1";
  provider?: string;
};

type Source = Record<string, unknown>;

export type ConnectorConfig = {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  authentication: Array<ConnectorConfigAuthentication>;
  sources: Array<Source>;
  responsibleFor: {
    userAuthentication: boolean;
    dataProviding: boolean;
    dataSynchronization: boolean;
    dataImport: boolean;
  };
};
