import {config} from "./config.js";
import {createApp} from "./app.js";
import {logger} from "./infra/logger.js";
import {registerShutdownHandlers} from "./shutdown.js";

const shutdownHandler = registerShutdownHandlers({waitBeforeServerClose: config.server.waitBeforeServerClose});

export const runServer = () => {
  const port = config.server.port;

  const server = createApp().listen(port, () => {
    logger.info(`server is started on port ${port}`);
  });
  shutdownHandler.setServer(server);
};
