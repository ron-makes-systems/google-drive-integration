import {AppError} from "./errors.js";
import {logger} from "../infra/logger.js";
import {NextFunction, Request, Response} from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandlingMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn(`Handled app error: ${err.message}; tryLater: ${err.tryLater}`, err);
    return res.status(err.statusCode).json({
      message: err.message,
      tryLater: err.tryLater,
    });
  }

  logger.error(`unhandled error: ${err.message}`, err);
  return res.status(500).json({
    message: `Oops, something goes wrong`,
  });
};
