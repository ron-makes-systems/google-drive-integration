export type AuthenticationType = "oauth2";

export type OAuth2Authentication = {
  auth: "oauth2";
  access_token: string;
  refresh_token: string;
  callback_uri?: string;
  expire_on?: string;
};

export type IntegrationAccount = OAuth2Authentication;
