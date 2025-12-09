export type AuthenticationType = "none" | "token" | "oauth2";

export type TokenAuthentication = {
  auth: "token";
  apiKey: string;
  // your-connector: can be adjusted to the fields in connector config authentication
};

export type OAuth2Authentication = {
  auth: "oauth2";
  token: string;
  refreshToken: string;
  callbackUri: string;
  tokenExpiration: number;
};

export type IntegrationAccount = TokenAuthentication | OAuth2Authentication;
