import {Request, Router} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {AccountValidateRequestBody} from "../types/types.requests.js";
import {ValidationError} from "../errors/errors.js";

export const createValidateRouter = () => {
  const router = Router();

  router.post(
    "/",
    asyncWrap(async (_req: Request<unknown, unknown, AccountValidateRequestBody>, _res) => {
      // your-connector: implement validation of an integration account here
      // use "req.body.fields" to get integration account name
      throw new ValidationError(`Validation is not implemented`);
    }),
  );

  return router;
};
