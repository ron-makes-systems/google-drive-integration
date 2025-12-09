import express, {Request} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {ValidationError} from "../errors/errors.js";
import {SynchronizerSchema} from "../types/types.synchronizerSchema.js";
import {getSynchronizerConfig} from "../synchronizer/configProvider.js";
import {DatalistRequestBody, GetDataRequestBody, GetSynchronizerSchemaRequestBody} from "../types/types.requests.js";
import {getSchema} from "../synchronizer/schemaProvider.js";
import {getData} from "../synchronizer/dataProvider.js";
import {SynchronizerData} from "../types/types.synchronizerData.js";

export const createSynchronizerRoutes = () => {
  const router = express.Router();

  router.post("/config", (req, res) => {
    res.json(getSynchronizerConfig());
  });

  router.post(
    "/schema",
    asyncWrap(async (req: Request<unknown, SynchronizerSchema, GetSynchronizerSchemaRequestBody>, res) => {
      const {types, account} = req.body;
      if (!types) {
        throw new ValidationError(`"types" are missing`);
      }
      const schema = await getSchema(types, account);
      res.json(schema);
    }),
  );

  router.post("/filter/validate", (req, res) => {
    res.json({});
  });

  router.post(
    "/datalist",
    asyncWrap(async (req: Request<unknown, unknown, DatalistRequestBody>, _res) => {
      const {account, field} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }

      if (!field) {
        throw new ValidationError(`"field" is missing`);
      }

      // your-connector: implement datalist endopint here
      throw new ValidationError("datalist is not implemented");
    }),
  );

  router.post(
    "/data",
    asyncWrap(async (req: Request<unknown, SynchronizerData<unknown>, GetDataRequestBody>, res) => {
      const {account, requestedType, filter, lastSynchronizedAt, pagination} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }

      if (!requestedType) {
        throw new ValidationError(`"requestedType" is missing`);
      }

      res.json(
        await getData({
          account,
          requestedType,
          filter,
          lastSynchronizedAt,
          pagination,
        }),
      );
    }),
  );

  return router;
};
