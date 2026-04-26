-- ZY-04-04 Content translations
-- Stores per-locale field overrides for arbitrary entities.

CREATE SCHEMA IF NOT EXISTS zhiyu;

CREATE TABLE IF NOT EXISTS zhiyu.content_translations (
  entity_type   text        NOT NULL,
  entity_id     text        NOT NULL,
  locale        text        NOT NULL,
  field         text        NOT NULL,
  value         text        NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_translations_locale_chk CHECK (locale IN ('en','vi','th','id','zh-CN')),
  CONSTRAINT content_translations_field_len  CHECK (char_length(field) BETWEEN 1 AND 80),
  CONSTRAINT content_translations_value_len  CHECK (char_length(value) <= 8000),
  PRIMARY KEY (entity_type, entity_id, locale, field)
);

CREATE INDEX IF NOT EXISTS content_translations_entity_idx
  ON zhiyu.content_translations (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS content_translations_locale_idx
  ON zhiyu.content_translations (locale);

ALTER TABLE zhiyu.content_translations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY content_translations_anon_read ON zhiyu.content_translations
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY content_translations_auth_read ON zhiyu.content_translations
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY content_translations_service_write ON zhiyu.content_translations
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO zhiyu._meta (version) VALUES ('0003_e04_content_translations');
