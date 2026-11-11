DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  kicker TEXT NOT NULL DEFAULT '',
  badge TEXT,
  cover_kind TEXT NOT NULL DEFAULT 'gradient',
  cover_img TEXT,
  cover_from TEXT NOT NULL DEFAULT '#7d8b6f',
  cover_to TEXT NOT NULL DEFAULT '#55663f',
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE progress (
  book_id TEXT PRIMARY KEY,
  chapter_index INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  en TEXT NOT NULL,
  cn TEXT NOT NULL DEFAULT '',
  book_id TEXT NOT NULL,
  book_title TEXT NOT NULL DEFAULT '',
  chapter_index INTEGER NOT NULL DEFAULT 0,
  chapter_label TEXT NOT NULL DEFAULT '',
  sentence_id TEXT NOT NULL DEFAULT '',
  added_date TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX marks_dedupe ON marks (book_id, sentence_id, kind, en);
--> statement-breakpoint
CREATE TABLE settings (
  id INTEGER PRIMARY KEY,
  font TEXT NOT NULL DEFAULT 'serif-sc',
  font_size INTEGER NOT NULL DEFAULT 21,
  line_spacing TEXT NOT NULL DEFAULT 'normal',
  para_spacing TEXT NOT NULL DEFAULT 'medium',
  theme TEXT NOT NULL DEFAULT 'paper',
  voice TEXT NOT NULL DEFAULT 'us-female',
  rate REAL NOT NULL DEFAULT 0.9
);
