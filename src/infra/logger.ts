import {getCorrelationId} from "./correlationId.js";
import {createLogger, createExpressRequestLogMiddleware} from "@fibery/vizydrop-logger";
import {config} from "../config.js";

export const logger = createLogger({
  correlationId: {
    enabled: true,
    getCorrelationId,
    emptyValue: `nocorrelation`,
  },
  mode: config.nodeEnv,
  level: config.logLevel,
});
export const getRequestLogMiddleware = () => createExpressRequestLogMiddleware({logger});
