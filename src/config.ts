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
};
