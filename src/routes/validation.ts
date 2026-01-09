import {Request, Router} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {AccountValidateRequestBody} from "../types/types.requests.js";
import {createGoogleDriveApi} from "../api/googleDrive.js";

export const createValidateRouter = () => {
  const router = Router();

  router.post(
    "/",
    asyncWrap(async (req: Request<unknown, unknown, AccountValidateRequestBody>, res) => {
      const account = req.body.fields;

      const api = createGoogleDriveApi(account);
      const user = await api.validate();

      res.json({
        name: user.emailAddress || user.displayName || "Google Drive",
      });
    }),
  );

  return router;
};
