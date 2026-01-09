import express, {Response} from "express";
import bodyParser from "body-parser";
import {getRequestLogMiddleware} from "./infra/logger.js";
import {middleware as correlationIdMiddleware} from "./infra/correlationId.js";
import path from "path";
import {fileURLToPath} from "url";
import {getConnectorConfig} from "./connectorConfig.js";
import {errorHandlingMiddleware} from "./errors/errorMiddleware.js";
import {createValidateRouter} from "./routes/validation.js";
import {createSynchronizerRoutes} from "./routes/synchronizerRoutes.js";
import {createOAuth2Routes} from "./routes/oauth2Routes.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const createApp = () => {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(getRequestLogMiddleware());
  app.use(bodyParser.json({limit: "10MB"}));

  app.get("/", (req, res) => {
    res.json(getConnectorConfig());
  });

  app.get("/status", (req, res: Response<{ok: boolean}>) => {
    res.json({ok: true});
  });

  app.get("/logo", (req, res) => {
    return res.sendFile(path.resolve(currentDirectory, `./public/logo.svg`));
  });

  // OAuth2 routes for authentication
  app.use("/oauth2", createOAuth2Routes());

  app.use("/validate", createValidateRouter());

  app.use("/api/v1/synchronizer", createSynchronizerRoutes());

  app.use((req, res: Response<{message: string}>) => {
    res.status(404).json({
      message: `Not Found`,
    });
  });
  app.use(errorHandlingMiddleware);

  return app;
};
