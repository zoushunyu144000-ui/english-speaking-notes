import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const books = sqliteTable("books", {
  id: text("id").primaryKey(),
  category: text("category", {
    enum: ["ai_textbook", "ai_found", "textbook"],
  }).notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  kicker: text("kicker").notNull().default(""),
  badge: text("badge"),
  coverKind: text("cover_kind").notNull().default("gradient"),
  coverImg: text("cover_img"),
  coverFrom: text("cover_from").notNull().default("#7d8b6f"),
  coverTo: text("cover_to").notNull().default("#55663f"),
  /** BookContent JSON: chapters -> blocks -> sentences with pre-made explanations. */
  content: text("content").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const progress = sqliteTable("progress", {
  bookId: text("book_id").primaryKey(),
  chapterIndex: integer("chapter_index").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

export const marks = sqliteTable("marks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["sentence", "phrase", "example"] }).notNull(),
  en: text("en").notNull(),
  cn: text("cn").notNull().default(""),
  bookId: text("book_id").notNull(),
  bookTitle: text("book_title").notNull().default(""),
  chapterIndex: integer("chapter_index").notNull().default(0),
  chapterLabel: text("chapter_label").notNull().default(""),
  sentenceId: text("sentence_id").notNull().default(""),
  /** YYYY-MM-DD in Asia/Kuala_Lumpur — the day the user collected this item. */
  addedDate: text("added_date").notNull(),
  /** Index into the review ladder [1,3,7,14,30,60] days. */
  stage: integer("stage").notNull().default(0),
  /** YYYY-MM-DD in Asia/Kuala_Lumpur — next review day. */
  dueDate: text("due_date").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  font: text("font").notNull().default("serif-sc"),
  fontSize: integer("font_size").notNull().default(21),
  lineSpacing: text("line_spacing").notNull().default("normal"),
  paraSpacing: text("para_spacing").notNull().default("medium"),
  theme: text("theme").notNull().default("paper"),
  voice: text("voice").notNull().default("us-female"),
  rate: real("rate").notNull().default(0.9),
});
