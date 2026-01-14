
export const INITIAL_SQL = `BEGIN;

-- (Supabase/Postgres) Extension for UUID and crypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- 1) email_domains
-- =========================
CREATE TABLE IF NOT EXISTS public.email_domains (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      TEXT NOT NULL,
  domain        TEXT UNIQUE NOT NULL,

  is_verified   BOOLEAN DEFAULT FALSE,
  mx_record     TEXT DEFAULT 'mx.mailflow.io',
  txt_record    TEXT,

  webhook_secret TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),

  is_active     BOOLEAN DEFAULT TRUE,

  address_limit INTEGER DEFAULT 10,
  address_count INTEGER DEFAULT 0,
  user_count    INTEGER DEFAULT 0,

  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 2) email_addresses (Allowlist of explicitly created addresses)
-- =========================
CREATE TABLE IF NOT EXISTS public.email_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_part   TEXT NOT NULL,

  domain_id    UUID REFERENCES public.email_domains(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL,

  is_catch_all BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  
  -- Hard delete flag: if true, future inbound emails to this address are rejected
  is_deleted   BOOLEAN DEFAULT FALSE,

  created_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (local_part, domain_id)
);

-- Composite index for fast allowlist lookup
CREATE INDEX IF NOT EXISTS idx_email_addresses_allowlist
  ON public.email_addresses(domain_id, local_part)
  WHERE is_active = TRUE AND is_deleted = FALSE;

-- =========================
-- 3) emails
-- =========================
CREATE TABLE IF NOT EXISTS public.emails (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_address TEXT NOT NULL,
  to_address   TEXT NOT NULL,

  subject      TEXT,
  body_html    TEXT,
  body_text    TEXT,

  is_read      BOOLEAN DEFAULT FALSE,
  is_starred   BOOLEAN DEFAULT FALSE,

  folder       TEXT NOT NULL DEFAULT 'inbox'
               CHECK (folder IN ('inbox', 'sent', 'starred', 'trash')),

  thread_id    TEXT NOT NULL,
  user_id      TEXT NOT NULL,

  domain_id    UUID REFERENCES public.email_domains(id) ON DELETE SET NULL,

  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- 4) email_attachments
-- =========================
CREATE TABLE IF NOT EXISTS public.email_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id   UUID REFERENCES public.emails(id) ON DELETE CASCADE,

  file_name  TEXT NOT NULL,
  file_path  TEXT NOT NULL,
  file_size  INTEGER,
  mime_type  TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Helpful Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_emails_user_id_created_at
  ON public.emails(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_domain_id_created_at
  ON public.emails(domain_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_addresses_domain_id
  ON public.email_addresses(domain_id);

CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id
  ON public.email_attachments(email_id);

-- =========================
-- address_count auto update trigger
-- =========================
CREATE OR REPLACE FUNCTION public.update_address_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.email_domains
      SET address_count = address_count + 1
      WHERE id = NEW.domain_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.email_domains
      SET address_count = GREATEST(address_count - 1, 0)
      WHERE id = OLD.domain_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_address_count ON public.email_addresses;

CREATE TRIGGER trg_update_address_count
AFTER INSERT OR DELETE ON public.email_addresses
FOR EACH ROW EXECUTE FUNCTION public.update_address_count();

-- =========================
-- RLS + Policies (TESTING MODE: allow all)
-- =========================
ALTER TABLE public.email_domains      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_addresses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON public.email_domains;
DROP POLICY IF EXISTS "Public Access" ON public.email_addresses;
DROP POLICY IF EXISTS "Public Access" ON public.emails;
DROP POLICY IF EXISTS "Public Access" ON public.email_attachments;

CREATE POLICY "Public Access" ON public.email_domains
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public Access" ON public.email_addresses
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public Access" ON public.emails
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public Access" ON public.email_attachments
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

COMMIT;`;
