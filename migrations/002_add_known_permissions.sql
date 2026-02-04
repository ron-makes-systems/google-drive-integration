ALTER TABLE drive_webhook_channels
  ADD COLUMN IF NOT EXISTS known_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;
