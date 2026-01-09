import express, {Request} from "express";
import {asyncWrap} from "../utils/asyncWrap.js";
import {ValidationError} from "../errors/errors.js";
import {SynchronizerSchema} from "../types/types.synchronizerSchema.js";
import {getSynchronizerConfig} from "../synchronizer/configProvider.js";
import {DatalistRequestBody, GetDataRequestBody, GetSynchronizerSchemaRequestBody} from "../types/types.requests.js";
import {getSchema} from "../synchronizer/schemaProvider.js";
import {getData} from "../synchronizer/dataProvider.js";
import {SynchronizerData} from "../types/types.synchronizerData.js";
import {createGoogleDriveApi} from "../api/googleDrive.js";
import {SynchronizerFilter} from "../types/types.synchronizerConfig.js";

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
    asyncWrap(async (req: Request<unknown, unknown, DatalistRequestBody>, res) => {
      const {account, field} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }

      if (!field) {
        throw new ValidationError(`"field" is missing`);
      }

      // Handle drive selection datalist
      if (field === SynchronizerFilter.DriveIds) {
        const api = createGoogleDriveApi(account);
        const items: Array<{title: string; value: string}> = [];

        // Add My Drive with "root" as value to match how files reference it
        items.push({title: "My Drive", value: "root"});

        // Add Shared with me virtual drive
        items.push({title: "Shared with me", value: "shared_with_me"});

        // Add shared drives
        let pageToken: string | undefined;
        do {
          const result = await api.listSharedDrives({pageToken});
          for (const drive of result.drives) {
            items.push({title: drive.name, value: drive.id});
          }
          pageToken = result.nextPageToken;
        } while (pageToken);

        res.json({items});
        return;
      }

      throw new ValidationError(`Unknown datalist field: ${field}`);
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
