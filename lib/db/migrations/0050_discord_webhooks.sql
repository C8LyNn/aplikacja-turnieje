-- #324-L05 — optional Discord notifications through a channel webhook (one-way, off by default).
-- Additive and backward compatible:
--   * tournament_discord_integrations: one row per connected tournament. The webhook address is stored only encrypted
--     (AES-256-GCM, "v1:iv:tag:ciphertext"; the key never reaches the database); webhook_hint is a masked label for the
--     panel. snapshot is the last public state the notifier compared (so events survive an API restart).
--   * tournament_discord_outbox: one row per notification; (tournament_id, event_key) is unique, so the same event is
--     never queued twice. Delivery is at-least-once with a lease; a crash during a send may repeat that one message.
--   * No existing row changes. Integrations are not part of backups or settings copies (they hold a secret).
-- Rollback (all Discord settings and the notification history are lost; tournaments are untouched):
--   DROP TABLE IF EXISTS public.tournament_discord_outbox;
--   DROP TABLE IF EXISTS public.tournament_discord_integrations;

CREATE TABLE IF NOT EXISTS public.tournament_discord_integrations (
  tournament_id integer PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  webhook_ciphertext text NOT NULL,
  webhook_hint text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['invite', 'start', 'pairings', 'results', 'advance', 'finish']::text[],
  link_base text,
  status text NOT NULL DEFAULT 'ok',
  last_error text,
  last_delivery_at timestamp,
  snapshot jsonb,
  snapshot_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tournament_discord_integrations_tournament_fk FOREIGN KEY (tournament_id)
    REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT tournament_discord_integrations_status_supported CHECK (status IN ('ok', 'broken', 'key_unavailable')),
  CONSTRAINT tournament_discord_integrations_ciphertext_shape CHECK (webhook_ciphertext LIKE 'v1:%' AND char_length(webhook_ciphertext) <= 1024),
  CONSTRAINT tournament_discord_integrations_events_supported CHECK (
    events <@ ARRAY['invite', 'start', 'pairings', 'results', 'advance', 'finish']::text[]),
  CONSTRAINT tournament_discord_integrations_snapshot_shape CHECK (
    snapshot IS NULL OR (jsonb_typeof(snapshot) = 'object' AND pg_column_size(snapshot) <= 524288))
);

CREATE TABLE IF NOT EXISTS public.tournament_discord_outbox (
  id serial PRIMARY KEY,
  tournament_id integer NOT NULL,
  event_key text NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamp NOT NULL DEFAULT now(),
  lease_until timestamp,
  last_error text,
  discord_message_id text,
  created_at timestamp NOT NULL DEFAULT now(),
  sent_at timestamp,
  CONSTRAINT tournament_discord_outbox_tournament_fk FOREIGN KEY (tournament_id)
    REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT tournament_discord_outbox_status_supported CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT tournament_discord_outbox_payload_shape CHECK (jsonb_typeof(payload) = 'object' AND pg_column_size(payload) <= 16384),
  CONSTRAINT tournament_discord_outbox_event_key_length CHECK (char_length(event_key) BETWEEN 1 AND 200),
  CONSTRAINT tournament_discord_outbox_event_unique UNIQUE (tournament_id, event_key)
);
CREATE INDEX IF NOT EXISTS tournament_discord_outbox_due_idx
  ON public.tournament_discord_outbox (status, next_attempt_at);
