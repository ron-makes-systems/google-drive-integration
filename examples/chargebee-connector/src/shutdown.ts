import {logger} from "./infra/logger.js";
import {sleep} from "./utils/sleep.js";
import {Server} from "http";

export const registerShutdownHandlers = ({waitBeforeServerClose}: {waitBeforeServerClose: number}) => {
  let server: Server;
  let isShuttingDown = false;

  const createShutdownCallback = (signal: string, exitCode = 0) => {
    const logLevel = exitCode === 0 ? `info` : `error`;
    return async (error: Error | undefined) => {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;

      logger.log(logLevel, `Application exit by reason ${error}`);
      if (error && error.stack) {
        logger.log(logLevel, `Application exist by reason (stack)`, error);
      }
      logger.log(logLevel, `stop app due to ${signal}`);

      if (exitCode === 0) {
        await sleep(waitBeforeServerClose);
      }

      if (server) {
        try {
          logger.info(`closing server`);
          await new Promise((resolve) => server.close(resolve));
          logger.info(`server is closed`);
        } catch (err) {
          logger.error(`unable to close server`, err);
        }
      }

      // eslint-disable-next-line no-process-exit
      process.exit(exitCode);
    };
  };

  process.on(`SIGTERM`, createShutdownCallback(`SIGTERM`, 0));
  process.on(`SIGINT`, createShutdownCallback(`SIGINT`, 0));
  process.on(`uncaughtException`, createShutdownCallback(`uncaughtException`, 1));
  process.on(`unhandledRejection`, createShutdownCallback(`unhandledRejection`, 1));

  return {
    setServer: (s: Server) => {
      server = s;
    },
  };
};
