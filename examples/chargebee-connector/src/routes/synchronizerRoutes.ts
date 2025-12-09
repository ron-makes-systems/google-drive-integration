import express, {Request} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {ValidationError} from "../errors/errors.js";
import {SynchronizerSchema} from "../types/types.synchronizerSchema.js";
import {getSynchronizerConfig} from "../synchronizer/configProvider.js";
import {GetDataRequestBody, GetSynchronizerSchemaRequestBody, ResourceRequestBody} from "../types/types.requests.js";
import {getSchema} from "../synchronizer/schemaProvider.js";
import {getData} from "../synchronizer/dataProvider.js";
import {streamResource} from "../synchronizer/resourceProvider.js";
import {SynchronizerData} from "../types/types.synchronizerData.js";
import {resourceTypes} from "../types/types.synchronizerConfig.js";
import {parseVersion} from "../utils/version.js";

export const createSynchronizerRoutes = () => {
  const router = express.Router();

  router.post(`/config`, (req, res) => {
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

  router.post(`/filter/validate`, (req, res) => {
    res.json({});
  });

  router.post(
    `/data`,
    asyncWrap(async (req: Request<unknown, SynchronizerData<unknown>, GetDataRequestBody>, res) => {
      const {account, requestedType, filter, lastSynchronizedAt, pagination, version} = req.body;
      const versionNumber = parseVersion(version);

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }

      if (!requestedType) {
        throw new ValidationError(`"requestedType" is missing`);
      }

      const lastSynchronizedAtParsed = lastSynchronizedAt ? String(Date.parse(lastSynchronizedAt)) : undefined;

      res.json(
        await getData({
          account,
          requestedType,
          filter,
          versionNumber,
          lastSynchronizedAt: lastSynchronizedAtParsed,
          pagination,
        }),
      );
    }),
  );

  router.post(
    `/resource`,
    asyncWrap(async (req: Request<unknown, unknown, ResourceRequestBody>, res) => {
      const {account, params} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }

      if (!params?.pdfId) {
        throw new ValidationError(`"pdfId" is missing`);
      }

      if (!params?.type) {
        throw new ValidationError(`"type" is undefined or empty`);
      }

      if (!resourceTypes.includes(params.type)) {
        throw new ValidationError(`type ${params.type} does not have Files field`);
      }

      await streamResource({
        requestedType: params.type,
        out: res,
        account,
        pdfId: params.pdfId,
      });
    }),
  );
  return router;
};
