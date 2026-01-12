import express, {Request} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {ValidationError} from "../errors/errors.js";
import {IntegrationAccount} from "../types/types.authentication.js";
import {ActionArgs, executeAction} from "../automations/actionExecutor.js";

type ExecuteActionRequestBody = {
  action: {
    action: string;
    args: ActionArgs;
  };
  account: IntegrationAccount;
};

export const createAutomationRoutes = () => {
  const router = express.Router();

  router.post(
    "/action/execute",
    asyncWrap(async (req: Request<unknown, unknown, ExecuteActionRequestBody>, res) => {
      const {action, account} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }
      if (!action) {
        throw new ValidationError(`"action" is missing`);
      }
      if (!action.action) {
        throw new ValidationError(`"action.action" is missing`);
      }

      await executeAction(account, action.action, action.args);

      // Return empty object on success as per Fibery spec
      res.json({});
    }),
  );

  return router;
};
