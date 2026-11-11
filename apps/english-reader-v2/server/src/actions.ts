import { defineAction, z, type ActionsModule, type Ctx } from "@hatch/space-sdk";
import { and, asc, desc, eq } from "drizzle-orm";
import * as schema from "./schema";
import { SEED_BOOKS, type BookContent } from "./library";

/* ---------- shared shapes ---------- */

const phraseSchema = z.object({
  en: z.string(),
  cn: z.string(),
  /** Part-of-speech / phrase-type tag shown in the explanation card. */
  pos: z.string().optional(),
});
const exampleSchema = z.object({ en: z.string(), cn: z.string() });
const sentenceSchema = z.object({
  id: z.string(),
  en: z.string(),
  cn: z.string(),
  phrases: z.array(phraseSchema),
  examples: z.array(exampleSchema),
});
const blockSchema = z.union([
  z.object({ type: z.literal("p"), sentences: z.array(sentenceSchema) }),
  z.object({
    type: z.literal("figure"),
    img: z.string(),
    caption: z.string(),
    alt: z.string(),
  }),
]);
const panelLineSchema = z.object({
  sentenceId: z.string(),
  speaker: z.string().optional(),
  side: z.enum(["left", "right"]).optional(),
  say: z.string().optional(),
});
const panelSchema = z.object({
  img: z.string(),
  alt: z.string(),
  lines: z.array(panelLineSchema),
});
const chapterSchema = z.object({
  title: z.string(),
  kicker: z.string(),
  blocks: z.array(blockSchema),
  panels: z.array(panelSchema).optional(),
});
const bookContentSchema = z.object({ chapters: z.array(chapterSchema) });

const bookMetaSchema = z.object({
  id: z.string(),
  category: z.enum(["ai_textbook", "ai_found", "textbook"]),
  title: z.string(),
  subtitle: z.string(),
  kicker: z.string(),
  badge: z.string().nullable(),
  coverKind: z.string(),
  coverImg: z.string().nullable(),
  coverFrom: z.string(),
  coverTo: z.string(),
  chapterCount: z.number(),
  sentenceCount: z.number(),
  chapterIndex: z.number(),
  progressPct: z.number(),
  progressUpdatedAt: z.number(),
});

const settingsSchema = z.object({
  font: z.string(),
  fontSize: z.number(),
  lineSpacing: z.string(),
  paraSpacing: z.string(),
  theme: z.string(),
  voice: z.string(),
  rate: z.number(),
});

const markSchema = z.object({
  id: z.number(),
  kind: z.enum(["sentence", "phrase", "example"]),
  en: z.string(),
  cn: z.string(),
  bookId: z.string(),
  bookTitle: z.string(),
  chapterIndex: z.number(),
  chapterLabel: z.string(),
  sentenceId: z.string(),
  addedDate: z.string(),
  stage: z.number(),
  dueDate: z.string(),
  createdAt: z.number(),
});

type BookMeta = z.infer<typeof bookMetaSchema>;
type SettingsOut = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS: SettingsOut = {
  font: "serif-sc",
  fontSize: 21,
  lineSpacing: "normal",
  paraSpacing: "medium",
  theme: "paper",
  voice: "us-female",
  rate: 0.9,
};

/** Review ladder in days: +1/+3/+7/+14/+30/+60. */
export const LADDER = [1, 3, 7, 14, 30, 60];

/* ---------- date helpers (Asia/Kuala_Lumpur) ---------- */

function klToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date());
}

function addDays(ymd: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/* ---------- row shaping ---------- */

function countSentences(content: BookContent): number {
  let n = 0;
  for (const ch of content.chapters) {
    for (const b of ch.blocks) {
      if (b.type === "p") n += b.sentences.length;
    }
  }
  return n;
}

function parseContent(raw: string): BookContent {
  const parsed = bookContentSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return { chapters: [] };
  return parsed.data;
}

function toMeta(
  row: typeof schema.books.$inferSelect,
  prog: typeof schema.progress.$inferSelect | undefined,
): BookMeta {
  const content = parseContent(row.content);
  const chapterCount = content.chapters.length;
  const chapterIndex = prog?.chapterIndex ?? 0;
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle,
    kicker: row.kicker,
    badge: row.badge ?? null,
    coverKind: row.coverKind,
    coverImg: row.coverImg ?? null,
    coverFrom: row.coverFrom,
    coverTo: row.coverTo,
    chapterCount,
    sentenceCount: countSentences(content),
    chapterIndex,
    progressPct:
      chapterCount > 0 ? Math.round((chapterIndex / chapterCount) * 100) : 0,
    progressUpdatedAt: prog?.updatedAt ?? 0,
  };
}

async function loadSettings(ctx: Ctx): Promise<SettingsOut> {
  const db = ctx.db<typeof schema>();
  const rows = await db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.id, 1))
    .limit(1);
  const row = rows[0];
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    font: row.font,
    fontSize: row.fontSize,
    lineSpacing: row.lineSpacing,
    paraSpacing: row.paraSpacing,
    theme: row.theme,
    voice: row.voice,
    rate: row.rate,
  };
}

/* ---------- actions ---------- */

export const Actions = {
  populateLibrary: defineAction({
    description:
      "Seeds the built-in library (AI textbooks, a found book excerpt, a textbook unit) and refreshes the built-in books' content and covers to the current edition whenever it runs. Books the user imported, and all progress, marks, and settings, are never touched.",
    request: z.object({}),
    response: z.object({ inserted: z.number() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const existing = await db.select({ id: schema.books.id }).from(schema.books);
      const existingIds = new Set(existing.map((r) => r.id));
      const now = Date.now();
      let inserted = 0;
      for (const book of SEED_BOOKS) {
        if (!existingIds.has(book.id)) inserted += 1;
        await db
          .insert(schema.books)
          .values({
            id: book.id,
            category: book.category,
            title: book.title,
            subtitle: book.subtitle,
            kicker: book.kicker,
            badge: book.badge,
            coverKind: book.coverKind,
            coverImg: book.coverImg,
            coverFrom: book.coverFrom,
            coverTo: book.coverTo,
            content: JSON.stringify(book.content),
            sortOrder: book.sortOrder,
            createdAt: now,
          })
          .onConflictDoUpdate({
            target: schema.books.id,
            set: {
              category: book.category,
              title: book.title,
              subtitle: book.subtitle,
              kicker: book.kicker,
              badge: book.badge,
              coverKind: book.coverKind,
              coverImg: book.coverImg,
              coverFrom: book.coverFrom,
              coverTo: book.coverTo,
              content: JSON.stringify(book.content),
              sortOrder: book.sortOrder,
            },
          });
      }
      ctx.invalidateQueries();
      return { inserted };
    },
  }),

  getLibrary: defineAction({
    description:
      "Returns the bookshelf: every book with its reading progress, plus the saved reader settings.",
    request: z.object({}),
    response: z.object({
      books: z.array(bookMetaSchema),
      settings: settingsSchema,
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const bookRows = await db
        .select()
        .from(schema.books)
        .orderBy(asc(schema.books.sortOrder), asc(schema.books.createdAt));
      const progRows = await db.select().from(schema.progress);
      const progByBook = new Map(progRows.map((p) => [p.bookId, p]));
      return {
        books: bookRows.map((row) => toMeta(row, progByBook.get(row.id))),
        settings: await loadSettings(ctx),
      };
    },
  }),

  getBook: defineAction({
    description:
      "Returns one book's full pre-made content (chapters, sentences, translations, phrases, examples) and the reader's saved chapter position.",
    request: z.object({ bookId: z.string().min(1) }),
    response: z.object({
      book: bookMetaSchema.extend({ content: bookContentSchema }).nullable(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.books)
        .where(eq(schema.books.id, args.bookId))
        .limit(1);
      const row = rows[0];
      if (!row) return { book: null };
      const progRows = await db
        .select()
        .from(schema.progress)
        .where(eq(schema.progress.bookId, args.bookId))
        .limit(1);
      const meta = toMeta(row, progRows[0]);
      return { book: { ...meta, content: parseContent(row.content) } };
    },
  }),

  saveProgress: defineAction({
    description: "Saves which chapter of a book the reader is currently on.",
    request: z.object({
      bookId: z.string().min(1),
      chapterIndex: z.number().int().min(0),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const now = Date.now();
      await db
        .insert(schema.progress)
        .values({
          bookId: args.bookId,
          chapterIndex: args.chapterIndex,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.progress.bookId,
          set: { chapterIndex: args.chapterIndex, updatedAt: now },
        });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listMarks: defineAction({
    description:
      "Lists every collected notebook item (sentences, phrases, examples) across all dates, newest first, with its review schedule.",
    request: z.object({}),
    response: z.object({ marks: z.array(markSchema) }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.marks)
        .orderBy(desc(schema.marks.createdAt), desc(schema.marks.id));
      return {
        marks: rows.map((row) => ({
          id: row.id,
          kind: row.kind,
          en: row.en,
          cn: row.cn,
          bookId: row.bookId,
          bookTitle: row.bookTitle,
          chapterIndex: row.chapterIndex,
          chapterLabel: row.chapterLabel,
          sentenceId: row.sentenceId,
          addedDate: row.addedDate,
          stage: row.stage,
          dueDate: row.dueDate,
          createdAt: row.createdAt,
        })),
      };
    },
  }),

  addMark: defineAction({
    description:
      "Adds one sentence, phrase, or example to the notebook, stamped with today's date (Asia/Kuala_Lumpur) and its book/chapter source. Adding the same item twice returns the existing row.",
    request: z.object({
      kind: z.enum(["sentence", "phrase", "example"]),
      en: z.string().min(1),
      cn: z.string(),
      bookId: z.string().min(1),
      bookTitle: z.string(),
      chapterIndex: z.number().int().min(0),
      chapterLabel: z.string(),
      sentenceId: z.string(),
    }),
    response: z.object({ id: z.number(), already: z.boolean() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const existing = await db
        .select({ id: schema.marks.id })
        .from(schema.marks)
        .where(
          and(
            eq(schema.marks.bookId, args.bookId),
            eq(schema.marks.sentenceId, args.sentenceId),
            eq(schema.marks.kind, args.kind),
            eq(schema.marks.en, args.en),
          ),
        )
        .limit(1);
      const found = existing[0];
      if (found) return { id: found.id, already: true };
      const today = klToday();
      const result = await db
        .insert(schema.marks)
        .values({
          kind: args.kind,
          en: args.en,
          cn: args.cn,
          bookId: args.bookId,
          bookTitle: args.bookTitle,
          chapterIndex: args.chapterIndex,
          chapterLabel: args.chapterLabel,
          sentenceId: args.sentenceId,
          addedDate: today,
          stage: 0,
          dueDate: today,
          createdAt: Date.now(),
        })
        .returning({ id: schema.marks.id });
      const inserted = result[0];
      if (!inserted) throw new Error("addMark: insert returned no rows");
      ctx.invalidateQueries();
      return { id: inserted.id, already: false };
    },
  }),

  removeMark: defineAction({
    description: "Removes one collected item from the notebook by id.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.marks).where(eq(schema.marks.id, args.id));
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  rateMark: defineAction({
    description:
      "Records a review rating for one notebook item and schedules its next review on the +1/+3/+7/+14/+30/+60 day ladder (forgot: again today and ladder reset; hard: +1 day; remembered: one ladder step up; fluent: two steps up).",
    request: z.object({
      id: z.number().int().positive(),
      rating: z.enum(["forgot", "hard", "remembered", "fluent"]),
    }),
    response: z.object({
      id: z.number(),
      stage: z.number(),
      dueDate: z.string(),
    }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      const rows = await db
        .select()
        .from(schema.marks)
        .where(eq(schema.marks.id, args.id))
        .limit(1);
      const row = rows[0];
      if (!row) throw new Error("rateMark: mark not found");
      const today = klToday();
      let stage = row.stage;
      let dueDate = today;
      if (args.rating === "forgot") {
        stage = 0;
        dueDate = today;
      } else if (args.rating === "hard") {
        dueDate = addDays(today, LADDER[0] ?? 1);
      } else if (args.rating === "remembered") {
        stage = Math.min(stage + 1, LADDER.length - 1);
        dueDate = addDays(today, LADDER[stage] ?? 60);
      } else {
        stage = Math.min(stage + 2, LADDER.length - 1);
        dueDate = addDays(today, LADDER[stage] ?? 60);
      }
      await db
        .update(schema.marks)
        .set({ stage, dueDate })
        .where(eq(schema.marks.id, args.id));
      ctx.invalidateQueries();
      return { id: args.id, stage, dueDate };
    },
  }),

  saveSettings: defineAction({
    description:
      "Saves the reader settings (font, font size, line/paragraph spacing, theme, voice, speech rate). They apply immediately to the reading page and narration.",
    request: settingsSchema,
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db
        .insert(schema.settings)
        .values({ id: 1, ...args })
        .onConflictDoUpdate({
          target: schema.settings.id,
          set: { ...args },
        });
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  importBook: defineAction({
    description:
      "Imports one textbook JSON file (same schema as the built-in books: chapters of paragraphs whose sentences carry translation, phrases, and examples) into the bookshelf.",
    request: z.object({ json: z.string().min(2) }),
    response: z.object({
      ok: z.boolean(),
      id: z.string().nullable(),
      error: z.string().nullable(),
    }),
    async handler(ctx, args) {
      let raw: unknown;
      try {
        raw = JSON.parse(args.json);
      } catch {
        return { ok: false, id: null, error: "文件不是有效的 JSON。" };
      }
      const importSchema = z.object({
        id: z.string().min(1).optional(),
        category: z.enum(["ai_textbook", "ai_found", "textbook"]),
        title: z.string().min(1),
        subtitle: z.string().optional(),
        kicker: z.string().optional(),
        badge: z.string().nullable().optional(),
        content: bookContentSchema,
      });
      const parsed = importSchema.safeParse(raw);
      if (!parsed.success) {
        return {
          ok: false,
          id: null,
          error:
            "JSON 结构不符合教材格式：需要 category、title 和 content.chapters，每句要有 id、en、cn、phrases、examples。",
        };
      }
      const data = parsed.data;
      const slug =
        data.id ??
        `imported-${data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}-${Date.now()}`;
      const db = ctx.db<typeof schema>();
      const countRows = await db.select({ id: schema.books.id }).from(schema.books);
      await db
        .insert(schema.books)
        .values({
          id: slug,
          category: data.category,
          title: data.title,
          subtitle: data.subtitle ?? "",
          kicker: data.kicker ?? "Imported",
          badge: data.badge ?? null,
          coverKind: "gradient",
          coverImg: null,
          coverFrom: "#8a7a9e",
          coverTo: "#5d4f73",
          content: JSON.stringify(data.content),
          sortOrder: 100 + countRows.length,
          createdAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: schema.books.id,
          set: {
            title: data.title,
            content: JSON.stringify(data.content),
            category: data.category,
          },
        });
      ctx.invalidateQueries();
      return { ok: true, id: slug, error: null };
    },
  }),
} satisfies ActionsModule;
