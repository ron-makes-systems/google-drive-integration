import express, {Request} from "express";
import crypto from "node:crypto";
import {asyncWrap} from "../utils/asyncWrap.js";
import {ValidationError} from "../errors/errors.js";
import {SynchronizerSchema} from "../types/types.synchronizerSchema.js";
import {getSynchronizerConfig} from "../synchronizer/configProvider.js";
import {
  DatalistRequestBody,
  GetDataRequestBody,
  GetSynchronizerSchemaRequestBody,
  ResourceRequestBody,
  WebhookInstallRequestBody,
  WebhookTransformRequestBody,
} from "../types/types.requests.js";
import {streamResource} from "../synchronizer/resourceProvider.js";
import {getSchema} from "../synchronizer/schemaProvider.js";
import {getData} from "../synchronizer/dataProvider.js";
import {SynchronizerData} from "../types/types.synchronizerData.js";
import {createGoogleDriveApi, GOOGLE_WORKSPACE_MIME_TYPES} from "../api/googleDrive.js";
import {SynchronizerFilter, SynchronizerType} from "../types/types.synchronizerConfig.js";
import {toSynchronizedFile, toSynchronizedFolder} from "../webhooks/transformers.js";
import {
  getChannel,
  recordKnownType,
  removeChannel,
  updateChannelToken,
  upsertChannel,
} from "../webhooks/webhookStore.js";
import {logger} from "../infra/logger.js";
import {env} from "../env.js";

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

      // Extract tier from marketplace gateway header
      const tier = req.get("x-marketplace-tier-id") || undefined;

      res.json(
        await getData({
          account,
          requestedType,
          filter,
          lastSynchronizedAt,
          pagination,
          tier,
        }),
      );
    }),
  );

  router.post(
    "/resource",
    asyncWrap(async (req: Request<unknown, unknown, ResourceRequestBody>, res) => {
      const {account, params} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }
      if (!params?.fileId) {
        throw new ValidationError(`"fileId" is missing`);
      }

      await streamResource({out: res, account, fileId: params.fileId});
    }),
  );

  router.post(
    "/webhooks",
    asyncWrap(async (req: Request<unknown, unknown, WebhookInstallRequestBody>, res) => {
      const {account, webhook, app, appId, app_id} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }
      const appFromBody = app || appId || app_id;
      const headerWebhookUrl = req.get("x-marketplace-webhook-url") || undefined;
      const headerWorkspaceId = req.get("x-marketplace-workspace-id") || undefined;

      if (headerWebhookUrl) {
        try {
          const parsed = new URL(headerWebhookUrl);
          logger.info("Webhook install headers", {
            hasHeaderWebhookUrl: true,
            headerWebhookHost: parsed.host,
            headerWebhookPath: parsed.pathname,
            headerWorkspaceId,
            appFromBody,
            webhookId: webhook?.id,
          });
        } catch {
          logger.info("Webhook install headers", {
            hasHeaderWebhookUrl: true,
            headerWebhookHost: undefined,
            headerWebhookPath: undefined,
            headerWorkspaceId,
            appFromBody,
            webhookId: webhook?.id,
          });
        }
      } else {
        logger.info("Webhook install headers", {
          hasHeaderWebhookUrl: false,
          headerWorkspaceId,
          appFromBody,
          webhookId: webhook?.id,
        });
      }

      const api = createGoogleDriveApi(account);
      const user = await api.getCurrentUser();
      const workspaceId = user.emailAddress || user.permissionId || "google-drive";

      const existingId = webhook?.id ? String(webhook.id) : undefined;
      const channelId = existingId || crypto.randomUUID();

      const existingChannel = await getChannel(channelId);
      if (existingChannel?.resourceId) {
        try {
          await api.stopChannel({channelId, resourceId: existingChannel.resourceId});
        } catch (error) {
          logger.warn(`Failed to stop existing channel ${channelId}`, {error});
        }
      }

      const callbackUrl =
        req.get("x-marketplace-webhook-url") ||
        env["WEBHOOK_CALLBACK_URL"] ||
        (appFromBody ? `https://webhooks-svc.fibery.io/apps/${appFromBody}` : undefined);

      logger.info("Webhook install callback", {
        source: req.get("x-marketplace-webhook-url")
          ? "header"
          : env["WEBHOOK_CALLBACK_URL"]
            ? "env"
            : appFromBody
              ? "body"
              : "none",
        hasCallbackUrl: Boolean(callbackUrl),
      });

      if (!callbackUrl) {
        throw new ValidationError(
          `"app" is missing. Provide app id in request or set WEBHOOK_CALLBACK_URL for webhook registration.`,
        );
      }
      const startPageToken = await api.getStartPageToken();

      const expiration = Date.now() + DEFAULT_CHANNEL_TTL_MS;
      const channel = await api.watchChanges({
        pageToken: startPageToken,
        channelId,
        address: callbackUrl,
        token: workspaceId,
        expiration,
      });

      await upsertChannel({
        channelId,
        workspaceId,
        pageToken: startPageToken,
        resourceId: channel.resourceId || undefined,
        expiration: channel.expiration || undefined,
      });

      res.json({
        id: channelId,
        workspaceId,
      });
    }),
  );

  router.post(
    "/webhooks/pre-process",
    asyncWrap(async (req, res) => {
      const channelId = getHeaderValue(req.headers, "x-goog-channel-id");
      const token = getHeaderValue(req.headers, "x-goog-channel-token");

      logger.info("Webhook pre-process received", {
        hasChannelId: Boolean(channelId),
        hasToken: Boolean(token),
        headerKeysSample: Object.keys(req.headers).slice(0, 10),
      });

      const channel = channelId ? await getChannel(channelId) : undefined;
      const workspaceId = channel?.workspaceId || token;

      if (!workspaceId) {
        res.json({
          reply: {ok: false, error: "Unknown webhook channel"},
        });
        return;
      }

      res.json({
        reply: {ok: true},
        workspaceIds: [workspaceId],
      });
    }),
  );

  router.post(
    "/webhooks/transform",
    asyncWrap(async (req: Request<unknown, unknown, WebhookTransformRequestBody>, res) => {
      const {params, types, filter, account} = req.body;

      if (!account) {
        throw new ValidationError(`"account" is missing`);
      }

      const channelId = getHeaderValue(params, "x-goog-channel-id");
      const resourceState = getHeaderValue(params, "x-goog-resource-state");

      logger.info("Webhook transform received", {
        hasChannelId: Boolean(channelId),
        resourceState,
        paramKeysSample: params ? Object.keys(params).slice(0, 10) : [],
      });

      if (resourceState === "sync") {
        res.json({data: {}});
        return;
      }

      if (resourceState === "not_exists" && channelId) {
        await removeChannel(channelId);
        res.json({data: {}});
        return;
      }

      const api = createGoogleDriveApi(account);
      const requestedTypes = new Set(types || []);

      const allowFile = requestedTypes.size === 0 || requestedTypes.has(SynchronizerType.File);
      const allowFolder = requestedTypes.size === 0 || requestedTypes.has(SynchronizerType.Folder);

      const channel = channelId ? await getChannel(channelId) : undefined;
      let pageToken = channel?.pageToken;

      if (!pageToken) {
        pageToken = await api.getStartPageToken();
        if (channelId) {
          await updateChannelToken(channelId, pageToken);
        }
        res.json({data: {}});
        return;
      }

      const data: Record<string, Array<Record<string, unknown>>> = {};
      if (allowFile) data[SynchronizerType.File] = [];
      if (allowFolder) data[SynchronizerType.Folder] = [];

      let nextPageToken: string | undefined = pageToken;
      let newStartPageToken: string | undefined;

      while (nextPageToken) {
        const result = await api.listChanges({pageToken: nextPageToken});
        newStartPageToken = result.newStartPageToken || newStartPageToken;
        nextPageToken = result.nextPageToken;

        for (const change of result.changes) {
          const fileId = change.fileId || change.file?.id;
          if (!fileId) continue;

          if (change.removed) {
            const knownType = channel?.knownTypes[fileId];
            if (allowFile && (knownType === "file" || !knownType)) {
              data[SynchronizerType.File]?.push({id: fileId, __syncAction: "DELETE"});
            }
            if (allowFolder && (knownType === "folder" || !knownType)) {
              data[SynchronizerType.Folder]?.push({id: fileId, __syncAction: "DELETE"});
            }
            continue;
          }

          const normalizedFile = normalizeChangeFile(change.file);
          if (!normalizedFile) continue;

          const derivedDriveId = deriveDriveId(normalizedFile);
          if (filter?.driveIds && filter.driveIds.length > 0 && !filter.driveIds.includes(derivedDriveId)) {
            continue;
          }

          if (normalizedFile.mimeType === GOOGLE_WORKSPACE_MIME_TYPES.FOLDER) {
            if (!allowFolder) continue;
            const item = toSynchronizedFolder(normalizedFile, derivedDriveId);
            data[SynchronizerType.Folder]?.push({...item, __syncAction: "SET"});
            if (channelId) {
              await recordKnownType(channelId, normalizedFile.id, "folder");
            }
          } else {
            if (!allowFile) continue;
            const item = toSynchronizedFile(normalizedFile, derivedDriveId);
            data[SynchronizerType.File]?.push({...item, __syncAction: "SET"});
            if (channelId) {
              await recordKnownType(channelId, normalizedFile.id, "file");
            }
          }
        }
      }

      if (channelId && newStartPageToken) {
        await updateChannelToken(channelId, newStartPageToken);
      }

      res.json({data});
    }),
  );

  return router;
};

const DEFAULT_CHANNEL_TTL_MS = 7 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000;

const getHeaderValue = (headers: Record<string, unknown> | undefined, name: string): string | undefined => {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== target) continue;
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : undefined;
    }
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
};

const deriveDriveId = (file: {driveId?: string; ownedByMe?: boolean}) => {
  if (file.ownedByMe === false && !file.driveId) {
    return "shared_with_me";
  }
  return file.driveId || "root";
};

const normalizeChangeFile = (
  file:
    | {id?: string | null; name?: string | null; mimeType?: string | null; driveId?: string | null}
    | null
    | undefined,
): {
  id: string;
  name: string;
  mimeType: string;
  driveId?: string;
  ownedByMe?: boolean;
  parents?: string[];
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  lastModifyingUser?: {permissionId?: string};
  owners?: Array<{permissionId?: string}>;
  shared?: boolean;
  trashed?: boolean;
} | null => {
  if (!file || !file.id || !file.name || !file.mimeType) {
    return null;
  }
  return {
    ...file,
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    driveId: file.driveId || undefined,
  } as {
    id: string;
    name: string;
    mimeType: string;
    driveId?: string;
    ownedByMe?: boolean;
    parents?: string[];
    description?: string;
    createdTime?: string;
    modifiedTime?: string;
    size?: string;
    webViewLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
    lastModifyingUser?: {permissionId?: string};
    owners?: Array<{permissionId?: string}>;
    shared?: boolean;
    trashed?: boolean;
  };
};
