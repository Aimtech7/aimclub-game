CREATE TABLE rooms (code TEXT PRIMARY KEY NOT NULL, state TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX rooms_expires_idx ON rooms (expires_at);
--> statement-breakpoint
CREATE TABLE room_limits (key TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL);
