CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  lock_timeout_mins INT NOT NULL DEFAULT 5,
  departures_site_id INT,
  departures_site_name TEXT NOT NULL DEFAULT '',
  departures_count INT NOT NULL DEFAULT 5,
  ica_list_id TEXT
);

CREATE TABLE dashboard_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INT NOT NULL,
  layout JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE lock_layout (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  layout JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE note_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  notes JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE planner_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  days JSONB NOT NULL DEFAULT '[]',
  color TEXT NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'weekly',
  created_week TEXT NOT NULL
);

CREATE TABLE calendar_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  color TEXT NOT NULL,
  ics_url TEXT NOT NULL
);
