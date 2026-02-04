import {Pool} from "pg";
import {env} from "../env.js";
import {logger} from "../infra/logger.js";

export type WebhookChannelState = {
  channelId: string;
  workspaceId: string;
  pageToken: string;
  resourceId?: string;
  expiration?: string;
  knownTypes: Record<string, "file" | "folder">;
  updatedAt: number;
};

type WebhookChannelRow = {
  channel_id: string;
  workspace_id: string;
  page_token: string;
  resource_id: string | null;
  expiration: string | null;
  known_types: Record<string, "file" | "folder"> | null;
  updated_at: Date;
};

const databaseUrl = env["DATABASE_URL"];
const pool = databaseUrl ? new Pool({connectionString: databaseUrl}) : null;
const inMemory = new Map<string, WebhookChannelState>();
let warned = false;

const hasPostgres = () => {
  if (!pool) {
    if (!warned) {
      logger.warn(`DATABASE_URL not set; webhook state will be in-memory only`);
      warned = true;
    }
    return false;
  }
  return true;
};

export const upsertChannel = async (state: Omit<WebhookChannelState, "updatedAt" | "knownTypes">) => {
  if (!hasPostgres()) {
    const existing = inMemory.get(state.channelId);
    const knownTypes = existing?.knownTypes || {};
    inMemory.set(state.channelId, {
      ...state,
      knownTypes,
      updatedAt: Date.now(),
    });
    return;
  }

  await pool!.query(
    `INSERT INTO drive_webhook_channels (channel_id, workspace_id, page_token, resource_id, expiration, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (channel_id)
     DO UPDATE SET
       workspace_id = EXCLUDED.workspace_id,
       page_token = EXCLUDED.page_token,
       resource_id = EXCLUDED.resource_id,
       expiration = EXCLUDED.expiration,
       updated_at = NOW()`,
    [state.channelId, state.workspaceId, state.pageToken, state.resourceId || null, state.expiration || null],
  );
};

export const getChannel = async (channelId: string): Promise<WebhookChannelState | undefined> => {
  if (!hasPostgres()) {
    return inMemory.get(channelId);
  }

  const result = await pool!.query<WebhookChannelRow>(
    `SELECT channel_id, workspace_id, page_token, resource_id, expiration, known_types, updated_at
     FROM drive_webhook_channels
     WHERE channel_id = $1`,
    [channelId],
  );

  const row = result.rows[0];
  if (!row) return undefined;

  return {
    channelId: row.channel_id,
    workspaceId: row.workspace_id,
    pageToken: row.page_token,
    resourceId: row.resource_id || undefined,
    expiration: row.expiration || undefined,
    knownTypes: row.known_types || {},
    updatedAt: row.updated_at.getTime(),
  };
};

export const removeChannel = async (channelId: string) => {
  if (!hasPostgres()) {
    inMemory.delete(channelId);
    return;
  }

  await pool!.query(`DELETE FROM drive_webhook_channels WHERE channel_id = $1`, [channelId]);
};

export const updateChannelToken = async (channelId: string, pageToken: string) => {
  if (!hasPostgres()) {
    const existing = inMemory.get(channelId);
    if (!existing) return;
    inMemory.set(channelId, {...existing, pageToken, updatedAt: Date.now()});
    return;
  }

  await pool!.query(
    `UPDATE drive_webhook_channels
     SET page_token = $2, updated_at = NOW()
     WHERE channel_id = $1`,
    [channelId, pageToken],
  );
};

export const recordKnownType = async (channelId: string, fileId: string, type: "file" | "folder") => {
  if (!hasPostgres()) {
    const existing = inMemory.get(channelId);
    if (!existing) return;
    inMemory.set(channelId, {
      ...existing,
      knownTypes: {
        ...existing.knownTypes,
        [fileId]: type,
      },
      updatedAt: Date.now(),
    });
    return;
  }

  await pool!.query(
    `UPDATE drive_webhook_channels
     SET known_types = jsonb_set(COALESCE(known_types, '{}'::jsonb), ARRAY[$2], to_jsonb($3::text), true),
         updated_at = NOW()
     WHERE channel_id = $1`,
    [channelId, fileId, type],
  );
};
