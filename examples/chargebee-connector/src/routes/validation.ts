import {Request, Router} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {AccountValidateRequestBody} from "../types/types.requests.js";
import {createChargebeeApi} from "../api/chargebee.js";
import {validateSubdomainInput} from "../utils/data.js";

export const createValidateRouter = () => {
  const router = Router();

  router.post(
    "/",
    asyncWrap(async (req: Request<unknown, unknown, AccountValidateRequestBody>, res) => {
      const vizydropAccount = req.body.fields;

      validateSubdomainInput(vizydropAccount.site);

      const chargebeeClient = createChargebeeApi(vizydropAccount);

      await chargebeeClient.validate();
      res.json({
        name: vizydropAccount.site,
      });
    }),
  );

  return router;
};
