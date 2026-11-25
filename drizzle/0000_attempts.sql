CREATE TABLE attempts (id TEXT PRIMARY KEY, score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 10), created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE INDEX attempts_created_at ON attempts(created_at DESC);
