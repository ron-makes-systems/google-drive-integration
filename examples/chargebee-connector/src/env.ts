import {cleanEnv, num, str} from "envalid";
import process from "node:process";
import dotenv from "dotenv";
dotenv.config();

export const env = cleanEnv(process.env, {
  PORT: num({
    default: 3500,
    desc: "Port number to run app",
  }),
  LOG_LEVEL: str({
    default: "debug",
    choices: ["debug", "info", "warn", "error", "none"],
  }),
  NODE_ENV: str({
    default: "development",
    choices: ["development", "test", "production"],
  }),
  WAIT_BEFORE_SERVER_CLOSE: num({default: 0}),
  PAGE_SIZE: num({default: 50}),
  MAX_CONCURRENT_CONNECTIONS: num({default: 100}),
  API_VERSION: num({default: 2}),
});
