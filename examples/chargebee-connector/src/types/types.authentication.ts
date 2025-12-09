export type AuthenticationType = "token" | "oauth2";

export type TokenAuthentication = {
  auth: "token";
  apiKey: string;
  site: string;
};

export type VizydropAccount = TokenAuthentication;
