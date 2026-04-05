-- Modify "settings" table
ALTER TABLE "public"."settings" ADD COLUMN "ica_session_id" text NULL, ADD COLUMN "ica_access_token" text NULL;
