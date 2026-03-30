-- Create "calendar_feeds" table
CREATE TABLE "public"."calendar_feeds" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "person_name" text NOT NULL,
  "color" text NOT NULL,
  "ics_url" text NOT NULL,
  PRIMARY KEY ("id")
);
-- Create "dashboard_pages" table
CREATE TABLE "public"."dashboard_pages" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "position" integer NOT NULL,
  "layout" jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY ("id")
);
-- Create "lock_layout" table
CREATE TABLE "public"."lock_layout" (
  "id" integer NOT NULL DEFAULT 1,
  "layout" jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY ("id"),
  CONSTRAINT "lock_layout_id_check" CHECK (id = 1)
);
-- Create "note_lists" table
CREATE TABLE "public"."note_lists" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "notes" jsonb NOT NULL DEFAULT '[]',
  PRIMARY KEY ("id")
);
-- Create "planner_tasks" table
CREATE TABLE "public"."planner_tasks" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "text" text NOT NULL,
  "days" jsonb NOT NULL DEFAULT '[]',
  "color" text NOT NULL,
  "recurrence" text NOT NULL DEFAULT 'weekly',
  "created_week" text NOT NULL,
  PRIMARY KEY ("id")
);
-- Create "settings" table
CREATE TABLE "public"."settings" (
  "id" integer NOT NULL DEFAULT 1,
  "lock_timeout_mins" integer NOT NULL DEFAULT 5,
  "departures_site_id" integer NULL,
  "departures_site_name" text NOT NULL DEFAULT '',
  "departures_count" integer NOT NULL DEFAULT 5,
  "ica_list_id" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "settings_id_check" CHECK (id = 1)
);
