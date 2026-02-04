CREATE TABLE IF NOT EXISTS drive_webhook_channels (
  channel_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  page_token TEXT NOT NULL,
  resource_id TEXT,
  expiration TEXT,
  known_types JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
