import {env} from "./env.js";

export const config = {
  server: {
    port: env["PORT"],
    waitBeforeServerClose: env["WAIT_BEFORE_SERVER_CLOSE"] * 1000,
  },
  logLevel: env["LOG_LEVEL"],
  nodeEnv: env["NODE_ENV"],
  pageSize: env["PAGE_SIZE"],
  maxConcurrentConnections: env["MAX_CONCURRENT_CONNECTIONS"],
  apiVersion: env["API_VERSION"],
  google: {
    clientId: env["GOOGLE_CLIENT_ID"],
    clientSecret: env["GOOGLE_CLIENT_SECRET"],
    redirectUri: env["GOOGLE_REDIRECT_URI"],
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  },
};
