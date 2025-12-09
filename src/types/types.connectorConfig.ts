import {AuthenticationType} from "./types.authentication.js";

type ConnectorConfigAuthenticationField = {
  id: string;
  title: string;
  description?: string;
  type: "oauth" | "password" | "text";
};

type ConnectorConfigLinkField = {
  id: string;
  name: string;
  description?: string;
  value: string;
  type: "link";
};

type ConnectorConfigAuthentication = {
  id: AuthenticationType;
  name: string;
  description: string;
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
