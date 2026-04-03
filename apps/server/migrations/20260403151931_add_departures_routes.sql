-- Modify "settings" table
ALTER TABLE "public"."settings" ADD COLUMN "departures_routes" jsonb NOT NULL DEFAULT '[]';
