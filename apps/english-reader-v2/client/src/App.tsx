import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import cafeImg from "./assets/cafe.jpg";
import streetImg from "./assets/street.jpg";
import marketImg from "./assets/market.webp";
import busImg from "./assets/bus.webp";
import airportImg from "./assets/airport.jpg";
import lobbyImg from "./assets/lobby.jpg";
import counterImg from "./assets/counter.jpg";
import aliceCoverImg from "./assets/alice-cover.jpg";
import penangCoverImg from "./assets/penang-cover.jpg";
import townCoverImg from "./assets/town-cover.jpg";
import airportCoverImg from "./assets/airport-cover.jpg";

/* ================= types ================= */

type Library = ApiResponse<typeof api, "getLibrary">;
type BookMeta = Library["books"][number];
type BookFull = NonNullable<ApiResponse<typeof api, "getBook">["book"]>;
type Mark = ApiResponse<typeof api, "listMarks">["marks"][number];
type Settings = Library["settings"];
type Chapter = BookFull["content"]["chapters"][number];
type Block = Chapter["blocks"][number];
type Panel = NonNullable<Chapter["panels"]>[number];
type PanelLine = Panel["lines"][number];
type Sentence = Extract<Block, { type: "p" }>["sentences"][number];
type MarkKind = Mark["kind"];

const IMG: Record<string, string> = {
  cafe: cafeImg,
  street: streetImg,
  market: marketImg,
  bus: busImg,
  airport: airportImg,
  lobby: lobbyImg,
  counter: counterImg,
  "alice-cover": aliceCoverImg,
  "penang-cover": penangCoverImg,
  "town-cover": townCoverImg,
  "airport-cover": airportCoverImg,
};

const LADDER = [1, 3, 7, 14, 30, 60];

const CATEGORY_TABS: { key: string; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "ai_textbook", label: "AI 教材" },
  { key: "ai_found", label: "AI 找的书" },
  { key: "textbook", label: "教科书" },
];

const KIND_LABEL: Record<MarkKind, string> = {
  sentence: "句子",
  phrase: "词组",
  example: "例句",
};

/* ================= dates (Asia/Kuala_Lumpur) ================= */

function klToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date());
}

/* ================= speech ================= */

let voiceCache: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  try {
    voiceCache = window.speechSynthesis.getVoices();
  } catch {
    voiceCache = [];
  }
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

const FEMALE_HINTS = ["female", "zira", "samantha", "aria", "jenny", "susan", "kate", "serena", "emma", "hazel", "catherine"];
const MALE_HINTS = ["male", "david", "alex", "daniel", "george", "christopher", "guy", "fred", "arthur", "brian"];

function pickVoice(setting: string): SpeechSynthesisVoice | null {
  const wantGB = setting.startsWith("gb");
  const wantFemale = setting.endsWith("female");
  const hints = wantFemale ? FEMALE_HINTS : MALE_HINTS;
  const otherHints = wantFemale ? MALE_HINTS : FEMALE_HINTS;
  const en = voiceCache.filter((v) => v.lang.toLowerCase().startsWith("en"));
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const v of en) {
    const name = v.name.toLowerCase();
    let score = 0;
    const isGB = v.lang.toLowerCase().startsWith("en-gb");
    const isUS = v.lang.toLowerCase().startsWith("en-us");
    if (wantGB ? isGB : isUS) score += 5;
    else if (wantGB ? isUS : isGB) score += 1;
    if (hints.some((h) => name.includes(h))) score += 4;
    if (otherHints.some((h) => name.includes(h))) score -= 4;
    if (name.includes("google")) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

function speak(text: string, settings: Settings) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(settings.voice);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = settings.voice.startsWith("gb") ? "en-GB" : "en-US";
  }
  u.rate = settings.rate;
  window.speechSynthesis.speak(u);
}

/* ================= icons ================= */

function PlayTriangle({ size = 55 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: `${size}%`, height: `${size}%`, marginLeft: "8%" }} aria-hidden="true">
      <path d="M7 4l13 8-13 8z" fill="currentColor" />
    </svg>
  );
}

function PlayButton({
  label,
  onClick,
  size = 48,
  className = "",
  plain = false,
}: {
  label: string;
  onClick: () => void;
  size?: number;
  className?: string;
  /** Compact minimalist style: flat pale disc, thin icon, no gradient/shadow. */
  plain?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex flex-none items-center justify-center rounded-full transition-all duration-200 ${plain ? "hover:bg-[rgba(157,95,48,0.16)] active:scale-95" : "hover:scale-[1.05] active:scale-95"} ${className}`}
      style={
        plain
          ? {
              width: size,
              height: size,
              minHeight: size,
              color: "#a05c2c",
              background: "rgba(157, 95, 48, 0.1)",
              border: "1px solid rgba(157, 95, 48, 0.16)",
              boxShadow: "none",
            }
          : {
              width: size,
              height: size,
              minHeight: size,
              color: "#fff",
              background: "linear-gradient(160deg, #ab6c38 0%, #9d5f30 55%, #8a5227 100%)",
              boxShadow:
                "0 8px 18px -6px rgba(138, 82, 39, 0.55), 0 2px 5px rgba(138, 82, 39, 0.3), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(90,52,16,0.25)",
            }
      }
    >
      <PlayTriangle size={plain ? 46 : 55} />
    </button>
  );
}

function PlusButton({
  label,
  added,
  onClick,
  size = 48,
  plain = false,
}: {
  label: string;
  added: boolean;
  onClick: () => void;
  size?: number;
  /** Compact minimalist style: pale disc / hairline ring, quiet check when added. */
  plain?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={added}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex flex-none items-center justify-center rounded-full transition-all duration-200 hover:scale-[1.05] active:scale-95"
      style={
        plain
          ? {
              width: size,
              height: size,
              minHeight: size,
              fontSize: size * 0.58,
              lineHeight: 1,
              fontWeight: 400,
              color: added ? "#66754f" : "#a05c2c",
              background: added ? "rgba(117, 131, 95, 0.14)" : "rgba(157, 95, 48, 0.06)",
              border: `1px solid ${added ? "rgba(117, 131, 95, 0.35)" : "rgba(157, 95, 48, 0.3)"}`,
              boxShadow: "none",
            }
          : {
              width: size,
              height: size,
              minHeight: size,
              fontSize: size * 0.52,
              lineHeight: 1,
              fontWeight: 500,
              color: added ? "#fff" : "#9d5f30",
              background: added
                ? "linear-gradient(160deg, #82936c 0%, #75835f 60%, #66754f 100%)"
                : "rgba(157, 95, 48, 0.05)",
              border: `1.5px solid ${added ? "transparent" : "rgba(157, 95, 48, 0.45)"}`,
              boxShadow: added
                ? "0 6px 14px -5px rgba(90, 105, 66, 0.55), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "inset 0 1px 0 rgba(255,255,255,0.5)",
            }
      }
    >
      {added ? (
        <svg viewBox="0 0 24 24" style={{ width: "52%", height: "52%" }} aria-hidden="true">
          <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={plain ? "#66754f" : "#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        "+"
      )}
    </button>
  );
}

function IconList({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
function IconSliders({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="10" cy="16" r="2.2" />
    </svg>
  );
}
function IconNotebook({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h13v18H6zM6 3v18M9.5 8h6M9.5 12h6" />
    </svg>
  );
}
function IconBack({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

/* ================= settings model ================= */

const FONT_STACKS: Record<string, string> = {
  "serif-sc": `"Source Serif 4", "Noto Serif SC", Georgia, serif`,
  georgia: `Georgia, "Times New Roman", "Noto Serif SC", serif`,
  sans: `"Noto Sans SC", system-ui, sans-serif`,
};
const FONT_OPTIONS: { key: string; label: string }[] = [
  { key: "serif-sc", label: "思源衬线" },
  { key: "georgia", label: "Georgia" },
  { key: "sans", label: "无衬线" },
];
const LINE_HEIGHTS: Record<string, number> = { compact: 1.6, normal: 1.85, loose: 2.15 };
const PARA_GAPS: Record<string, string> = { small: "0.7em", medium: "1.05em", large: "1.5em" };
const THEMES: Record<string, { bg: string; text: string; soft: string; card: string; line: string; name: string }> = {
  paper: { bg: "#fdfaf3", text: "#2c2620", soft: "#6f6a5e", card: "#fffdf8", line: "#e9dfc9", name: "纸白" },
  cream: { bg: "#f7ecd2", text: "#3a3226", soft: "#7d7261", card: "#fdf6e0", line: "#e3d3ab", name: "米黄" },
  green: { bg: "#e9efe0", text: "#2f3628", soft: "#68755c", card: "#f4f8ec", line: "#cfdcc0", name: "浅绿" },
  night: { bg: "#262019", text: "#ece3d0", soft: "#a89d8a", card: "#322b21", line: "#4a4132", name: "夜间" },
};
const VOICE_OPTIONS: { key: string; label: string; sub: string }[] = [
  { key: "us-female", label: "美式 · 女声", sub: "自然" },
  { key: "us-male", label: "美式 · 男声", sub: "自然" },
  { key: "gb-female", label: "英式 · 女声", sub: "自然" },
  { key: "gb-male", label: "英式 · 男声", sub: "自然" },
];

function fontStack(settings: Settings): string {
  return FONT_STACKS[settings.font] ?? FONT_STACKS["serif-sc"]!;
}
function themeOf(settings: Settings) {
  return THEMES[settings.theme] ?? THEMES.paper!;
}

function markKey(bookId: string, sentenceId: string, kind: MarkKind, en: string): string {
  return `${bookId}|${sentenceId}|${kind}|${en}`;
}

/* ================= book cover ================= */

function BookCover({ book, large = false, mini = false }: { book: BookMeta; large?: boolean; mini?: boolean }) {
  const img = book.coverKind === "image" && book.coverImg ? IMG[book.coverImg] : undefined;
  const titleSize = large
    ? book.title.length > 26
      ? 19
      : book.title.length > 18
        ? 21.5
        : 24
    : book.title.length > 26
      ? 15
      : book.title.length > 18
        ? 17
        : 19;
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "2 / 3",
        borderRadius: "5px 11px 11px 5px",
        background: img ? "#3c4652" : "#6b5a44",
        boxShadow:
          "0 1px 2px rgba(60,45,20,0.14), 0 8px 18px -6px rgba(60,45,20,0.3), 0 26px 44px -16px rgba(60,45,20,0.45)",
      }}
    >
      {img ? (
        <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        /* plain-colour cover (imported books): clothbound typographic design */
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(158deg, ${book.coverFrom}, ${book.coverTo})` }}
        >
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(90% 55% at 50% 0%, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%)" }}
          />
          {!mini ? (
            <div className="absolute inset-0 flex flex-col items-center px-5 text-center" style={{ paddingTop: "24%", color: "#fdf6e3" }}>
              <span
                aria-hidden="true"
                className="font-en-serif flex items-center justify-center rounded-full"
                style={{
                  width: 52,
                  height: 52,
                  fontSize: 25,
                  fontWeight: 700,
                  border: "1.5px solid rgba(253,246,227,0.55)",
                  color: "rgba(253,246,227,0.92)",
                }}
              >
                {book.title.charAt(0) || "B"}
              </span>
              <div className="font-en-serif" style={{ marginTop: 18, fontWeight: 700, fontSize: titleSize, lineHeight: 1.22, textShadow: "0 1px 8px rgba(20,14,6,0.35)" }}>
                {book.title}
              </div>
              <span aria-hidden="true" style={{ marginTop: 12, width: 30, height: 1.5, background: "rgba(253,246,227,0.6)" }} />
              <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.45, color: "rgba(253,246,227,0.82)" }}>{book.subtitle}</div>
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 0,
                  right: 0,
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(253,246,227,0.6)",
                }}
              >
                {book.kicker}
              </div>
            </div>
          ) : null}
        </div>
      )}
      {/* cover typography laid over the art, like a real published cover:
          kicker + title + subtitle in the open sky at the top of the art */}
      {img && !mini ? (
        <>
          <span
            className="pointer-events-none absolute inset-x-0 top-0 z-[2]"
            style={{
              height: "52%",
              background:
                "linear-gradient(180deg, rgba(18,22,26,0.42) 0%, rgba(18,22,26,0.18) 55%, rgba(18,22,26,0) 100%)",
            }}
          />
          <div className="absolute inset-x-0 top-0 z-[2]" style={{ padding: large ? "20px 18px 0 26px" : "15px 14px 0 22px" }}>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(255,251,240,0.88)",
                textShadow: "0 1px 6px rgba(15,18,20,0.55)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {book.kicker}
            </div>
            <div
              className="font-en-serif"
              style={{
                marginTop: 6,
                fontWeight: 700,
                fontSize: titleSize,
                lineHeight: 1.16,
                color: "#fffdf4",
                textShadow: "0 1px 3px rgba(15,18,20,0.5), 0 3px 14px rgba(15,18,20,0.45)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {book.title}
            </div>
            <span aria-hidden="true" className="block" style={{ marginTop: 9, width: 28, height: 2, borderRadius: 2, background: "rgba(255,251,240,0.85)", boxShadow: "0 1px 4px rgba(15,18,20,0.4)" }} />
            <div
              style={{
                marginTop: 7,
                fontSize: large ? 11.5 : 10.5,
                lineHeight: 1.4,
                color: "rgba(255,251,240,0.92)",
                textShadow: "0 1px 5px rgba(15,18,20,0.55)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {book.subtitle}
            </div>
          </div>
        </>
      ) : null}
      {/* spine: light crease + shaded gutter on the binding edge */}
      <span
        className="pointer-events-none absolute inset-y-0 left-0 z-[3]"
        style={{
          width: mini ? 7 : 12,
          background:
            "linear-gradient(90deg, rgba(25,16,6,0.32) 0%, rgba(25,16,6,0.09) 45%, rgba(255,255,255,0.22) 78%, rgba(25,16,6,0.12) 100%)",
        }}
      />
      {/* page block peeking on the fore-edge */}
      <span
        className="pointer-events-none absolute inset-y-[3px] right-0 z-[3]"
        style={{
          width: 3,
          borderRadius: 2,
          background:
            "repeating-linear-gradient(180deg, rgba(253,248,235,0.95) 0 2px, rgba(214,201,168,0.9) 2px 3px)",
          boxShadow: "-1px 0 2px rgba(30,20,8,0.25)",
        }}
      />
      {/* soft gloss sweep */}
      <span
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 34%)" }}
      />
    </div>
  );
}

/* ================= bookshelf ================= */

type View =
  | { name: "shelf" }
  | { name: "reader"; bookId: string; chapter?: number }
  | { name: "review" };

function Shelf({
  books,
  dueCount,
  onOpenBook,
  onOpenReview,
}: {
  books: BookMeta[];
  dueCount: number;
  onOpenBook: (bookId: string) => void;
  onOpenReview: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const importMutation = useMutation({
    mutationFn: (json: string) => api.importBook({ json }),
    onSuccess: (res) => {
      if (res.ok) {
        setImportMsg({ ok: true, text: "导入成功，书已经放上书架了。" });
        void queryClient.invalidateQueries({ queryKey: ["library"] });
      } else {
        setImportMsg({ ok: false, text: res.error ?? "导入失败。" });
      }
    },
    onError: () => setImportMsg({ ok: false, text: "导入失败，请检查文件后重试。" }),
  });

  const shown = tab === "all" ? books : books.filter((b) => b.category === tab);
  const started = books.filter((b) => b.chapterIndex > 0);
  const continueBook =
    [...started].sort((a, b) => b.progressUpdatedAt - a.progressUpdatedAt)[0] ?? books[0];

  return (
    <div
      className="font-ui mx-auto flex h-full w-full max-w-[1120px] flex-col overflow-y-auto px-5 pt-safe pb-12"
      style={{
        color: "#2e2a24",
        background:
          "radial-gradient(110% 46% at 50% -6%, rgba(255,252,244,0.95) 0%, rgba(255,252,244,0) 55%), linear-gradient(180deg, #f4efe2 0%, #f1ebdb 55%, #eee6d2 100%)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pt-8">
        <h1 className="font-cn-serif" style={{ fontSize: 31, fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>
          我的书架
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenReview}
            className="relative rounded-full px-4 py-2 text-[15px] font-bold transition-all duration-200 hover:brightness-125 active:scale-95"
            style={{
              background: "linear-gradient(165deg, #3a332a, #2c2620)",
              color: "#fdfaf3",
              minHeight: 40,
              boxShadow: "0 8px 18px -8px rgba(44,38,32,0.6), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            复习
            {dueCount > 0 ? (
              <span
                className="absolute -top-1.5 -right-1.5 rounded-full px-1.5 text-[11px] font-bold"
                style={{ background: "#b26f3f", color: "#fff", minWidth: 20, height: 20, lineHeight: "20px", boxShadow: "0 3px 8px rgba(150,90,40,0.45)", border: "1.5px solid #f2ede1" }}
              >
                {dueCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => {
              setImportOpen(true);
              setImportMsg(null);
            }}
            className="rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-200 hover:bg-white active:scale-95"
            style={{ border: "1px solid rgba(74,60,35,0.16)", background: "rgba(255,253,248,0.6)", color: "#4c473c", minHeight: 40 }}
          >
            添加书籍
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="书籍分类">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className="rounded-full px-5 py-2 text-[15px] transition-all duration-200 active:scale-95"
            style={{
              border: tab === t.key ? "1px solid transparent" : "1px solid rgba(74,60,35,0.13)",
              background: tab === t.key ? "linear-gradient(165deg, #3a332a, #2c2620)" : "rgba(255,253,248,0.55)",
              color: tab === t.key ? "#fdfaf3" : "#6f6a5e",
              fontWeight: tab === t.key ? 700 : 500,
              minHeight: 40,
              boxShadow:
                tab === t.key
                  ? "0 8px 18px -8px rgba(44,38,32,0.55), inset 0 1px 0 rgba(255,255,255,0.14)"
                  : "0 1px 2px rgba(74,54,20,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {continueBook ? (
        <div
          className="mt-8 flex items-center gap-5 rounded-[24px] px-5 py-4"
          style={{
            background: "linear-gradient(180deg, #fffefa, #fffdf8)",
            boxShadow:
              "0 1px 2px rgba(74,54,20,0.05), 0 16px 36px -16px rgba(74,54,20,0.22), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(74,60,35,0.05)",
          }}
        >
          <div style={{ width: 66, flex: "none" }}>
            <BookCover book={continueBook} mini />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold tracking-[0.22em]" style={{ color: "#9c875a" }}>
              {continueBook.chapterIndex > 0 ? "继续阅读" : "开始读"}
            </div>
            <div className="font-en-serif mt-1 text-[18px] leading-snug font-bold">{continueBook.title}</div>
            <div className="mt-0.5 text-[13.5px]" style={{ color: "#6f6a5e" }}>
              {continueBook.chapterIndex > 0
                ? `读到第 ${continueBook.chapterIndex + 1} 章 · 共 ${continueBook.chapterCount} 章`
                : `共 ${continueBook.chapterCount} 章 · ${continueBook.sentenceCount} 句`}
            </div>
            <div className="mt-2.5 h-[4px] rounded-full" style={{ background: "#ece0c4", width: "min(280px, 100%)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${continueBook.progressPct}%`, background: "linear-gradient(90deg, #c07f47, #b26f3f)", minWidth: continueBook.progressPct > 0 ? 8 : 0 }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenBook(continueBook.id)}
            className="flex-none rounded-full px-5 py-2.5 text-[15px] font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)",
              minHeight: 44,
              boxShadow: "0 10px 20px -8px rgba(138,82,39,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            {continueBook.chapterIndex > 0 ? "继续阅读" : "开始阅读"}
          </button>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="mt-14 text-center text-[15px]" style={{ color: "#7a7264" }}>
          这个分类里还没有书。点右上角「添加书籍」，把想读的书告诉 Muse 就好。
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-7 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((book) => (
            <div key={book.id} className="flex min-w-0 flex-col">
              <button
                type="button"
                aria-label={`打开《${book.title}》`}
                onClick={() => onOpenBook(book.id)}
                className="block w-full text-left transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
                style={{ minHeight: 0, padding: 0, background: "none", border: "none" }}
              >
                <BookCover book={book} large />
              </button>
              <div className="mt-3 flex items-center gap-2.5 text-[12px]" style={{ color: "#8a8172" }}>
                <span className="flex-none">{book.progressPct > 0 ? `读到 ${book.progressPct}%` : "未开始"}</span>
                <span className="inline-block h-[3px] min-w-0 flex-1 rounded-full" style={{ background: "#e7dcc2", overflow: "hidden" }}>
                  <span className="block h-full rounded-full" style={{ width: `${book.progressPct}%`, background: "linear-gradient(90deg, #8b9a76, #75835f)" }} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {importOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-label="添加书籍">
          <div className="anim-fade absolute inset-0" style={{ background: "rgba(46,36,20,0.4)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} onClick={() => setImportOpen(false)} />
          <div
            className="anim-sheet relative w-full max-w-[560px] rounded-t-[26px] p-6 sm:rounded-[26px]"
            style={{ background: "#fffdf8", color: "#2e2a24", maxHeight: "86dvh", overflowY: "auto", boxShadow: "var(--shadow-float)" }}
          >
            <div className="flex items-start justify-between">
              <h2 className="font-cn-serif" style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>
                添加书籍
              </h2>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => setImportOpen(false)}
                className="rounded-full px-3 text-[20px]"
                style={{ color: "#7a7264", minHeight: 36 }}
              >
                ×
              </button>
            </div>
            <p className="mt-3 text-[14.5px] leading-[1.75]" style={{ color: "#4c473c" }}>
              想读一本新书时，直接在和 Muse 的对话里把<b>书名</b>或者<b>文件</b>发过去就行：Muse 会帮你找到英文版，
              拆成章节和句子，配好翻译、重点词组和例句，整理成教材再放进这个书架。这一版还不会自己上网下载，
              整理这一步是在对话里完成的。
            </p>
            <div className="my-5 border-t border-dashed" style={{ borderColor: "#e0d3b6" }} />
            <p className="text-[14.5px] leading-[1.75]" style={{ color: "#4c473c" }}>
              如果你手上已经有一份整理好的教材 JSON 文件（包含 category、title 和 content.chapters，
              每句带 id、en、cn、phrases、examples），可以直接导入：
            </p>
            <label
              className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl px-4 py-3 text-[15px] font-bold transition-all duration-200 hover:bg-[rgba(157,95,48,0.06)] active:scale-[0.99]"
              style={{ border: "1.5px solid rgba(157,95,48,0.55)", color: "#9d5f30", minHeight: 48 }}
            >
              {importMutation.isPending ? "正在导入…" : "选择 JSON 教材文件"}
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-label="选择 JSON 教材文件"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") importMutation.mutate(reader.result);
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </label>
            {importMsg ? (
              <p className="mt-3 text-[14px]" style={{ color: importMsg.ok ? "#4f6039" : "#b0502e" }}>
                {importMsg.text}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ================= settings sheet ================= */

function SegPills({
  label,
  options,
  value,
  onPick,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onPick: (key: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[12.5px] font-bold tracking-[0.18em]" style={{ color: "#9c875a" }}>
        {label}
      </div>
      <div
        className="inline-flex max-w-full flex-wrap gap-1 rounded-full p-1"
        style={{ background: "rgba(74,60,35,0.07)", boxShadow: "inset 0 1px 3px rgba(74,54,20,0.08)" }}
        role="group"
        aria-label={label}
      >
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={value === o.key}
            onClick={() => onPick(o.key)}
            className="rounded-full px-4 py-1.5 text-[14.5px] transition-all duration-200 active:scale-95"
            style={{
              background: value === o.key ? "#fffdf8" : "transparent",
              color: value === o.key ? "#2c2620" : "#6f6a5e",
              fontWeight: value === o.key ? 700 : 500,
              minHeight: 36,
              boxShadow: value === o.key ? "0 2px 8px rgba(74,54,20,0.16), 0 1px 2px rgba(74,54,20,0.08)" : "none",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsSheet({
  settings,
  onChange,
  onClose,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}) {
  const colTitle = "font-cn-serif pb-1 text-[19px] font-bold tracking-[0.04em]";
  const groupLabel = "mb-2 text-[12.5px] font-bold tracking-[0.18em]";
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="设置">
      <div
        className="anim-fade absolute inset-0"
        style={{ background: "rgba(46,36,20,0.32)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
        onClick={onClose}
      />
      <div
        className="anim-sheet thin-scroll absolute inset-x-0 bottom-0 overflow-y-auto"
        style={{
          background: "linear-gradient(180deg, #fffefa, #fffdf8)",
          color: "#2e2a24",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -24px 64px -16px rgba(50,38,15,0.4), inset 0 1px 0 rgba(255,255,255,0.9)",
          height: "min(86dvh, 760px)",
          padding: "10px 22px 30px",
        }}
      >
        <div className="mx-auto mb-3 h-[5px] w-[64px] rounded-full" style={{ background: "rgba(74,60,35,0.22)" }} />
        <div className="mx-auto max-w-[980px]">
          <div className="flex items-center justify-between">
            <h2 className="font-cn-serif" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              设置
            </h2>
            <button
              type="button"
              aria-label="关闭设置"
              onClick={onClose}
              className="flex items-center justify-center rounded-full text-[19px] transition-all duration-200 hover:bg-[rgba(74,60,35,0.1)] active:scale-90"
              style={{ color: "#7a7264", width: 36, height: 36, minHeight: 36, background: "rgba(74,60,35,0.06)" }}
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid gap-8 md:grid-cols-2">
            {/* left: 阅读 */}
            <div className="flex min-w-0 flex-col gap-6">
              <div className={colTitle} style={{ borderColor: "#eee0c6" }}>
                阅读
              </div>
              <div>
                <div className={groupLabel} style={{ color: "#9c875a" }}>
                  字体
                </div>
                <div className="flex gap-2">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      aria-pressed={settings.font === f.key}
                      onClick={() => onChange({ font: f.key })}
                      className="flex-1 rounded-2xl px-1 py-3 text-center transition-all duration-200 active:scale-[0.97]"
                      style={{
                        border: "none",
                        background: settings.font === f.key ? "#fffdf8" : "rgba(74,60,35,0.05)",
                        boxShadow:
                          settings.font === f.key
                            ? "0 0 0 1.5px rgba(157,95,48,0.65), 0 8px 18px -8px rgba(74,54,20,0.3)"
                            : "inset 0 1px 2px rgba(74,54,20,0.05)",
                        minHeight: 68,
                      }}
                    >
                      <span className="block" style={{ fontFamily: FONT_STACKS[f.key], fontSize: 26, lineHeight: 1.15, color: "#4c473c" }}>
                        Aa
                      </span>
                      <span
                        className="mt-1 block text-[12.5px]"
                        style={{ color: settings.font === f.key ? "#9d5f30" : "#6f6a5e", fontWeight: settings.font === f.key ? 700 : 400 }}
                      >
                        {f.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={groupLabel} style={{ color: "#9c875a" }}>
                  字号
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: fontStack(settings), fontSize: 15, color: "#6f6a5e" }}>A</span>
                  <input
                    type="range"
                    aria-label="字号"
                    className="reader-range flex-1"
                    min={17}
                    max={29}
                    step={1}
                    value={settings.fontSize}
                    onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                  />
                  <span style={{ fontFamily: fontStack(settings), fontSize: 24, color: "#6f6a5e" }}>A</span>
                </div>
                <div
                  className="mt-3 rounded-2xl px-5 py-4"
                  style={{
                    background: "#faf5ea",
                    boxShadow: "inset 0 1px 3px rgba(74,54,20,0.06), inset 0 0 0 1px rgba(74,60,35,0.05)",
                    fontFamily: fontStack(settings),
                    fontSize: settings.fontSize,
                    color: "#3a372f",
                    lineHeight: 1.55,
                  }}
                >
                  The morning sun was already warm…
                </div>
              </div>
              <SegPills
                label="行间距"
                options={[
                  { key: "compact", label: "紧凑" },
                  { key: "normal", label: "适中" },
                  { key: "loose", label: "宽松" },
                ]}
                value={settings.lineSpacing}
                onPick={(k) => onChange({ lineSpacing: k })}
              />
              <SegPills
                label="段间距"
                options={[
                  { key: "small", label: "小" },
                  { key: "medium", label: "中" },
                  { key: "large", label: "大" },
                ]}
                value={settings.paraSpacing}
                onPick={(k) => onChange({ paraSpacing: k })}
              />
            </div>
            {/* right: 外观与声音 */}
            <div className="flex min-w-0 flex-col gap-6 md:border-l md:pl-8" style={{ borderColor: "rgba(74,60,35,0.09)" }}>
              <div className={colTitle} style={{ borderColor: "#eee0c6" }}>
                外观与声音
              </div>
              <div>
                <div className={groupLabel} style={{ color: "#9c875a" }}>
                  主题
                </div>
                <div className="flex gap-3">
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={settings.theme === key}
                      onClick={() => onChange({ theme: key })}
                      className="relative flex flex-col items-center gap-1.5 text-[13px] transition-transform duration-200 active:scale-95"
                      style={{ color: settings.theme === key ? "#9d5f30" : "#6f6a5e", fontWeight: settings.theme === key ? 700 : 400, minHeight: 0, padding: 0, background: "none", border: "none" }}
                    >
                      <span
                        className="relative block rounded-[14px]"
                        style={{
                          width: 58,
                          height: 44,
                          background: t.bg,
                          boxShadow:
                            settings.theme === key
                              ? "0 0 0 2px #fffdf8, 0 0 0 4px rgba(157,95,48,0.8), 0 8px 16px -6px rgba(74,54,20,0.35)"
                              : "inset 0 0 0 1px rgba(74,60,35,0.14), 0 2px 6px rgba(74,54,20,0.08)",
                        }}
                      >
                        {settings.theme === key ? (
                          <span
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                            style={{ width: 18, height: 18, background: "#9d5f30", boxShadow: "0 2px 6px rgba(138,82,39,0.5)" }}
                          >
                            <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} aria-hidden="true">
                              <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        ) : null}
                      </span>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={groupLabel} style={{ color: "#9c875a" }}>
                  朗读声音
                </div>
                <div className="flex flex-col gap-2">
                  {VOICE_OPTIONS.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      role="radio"
                      aria-checked={settings.voice === v.key}
                      onClick={() => onChange({ voice: v.key })}
                      className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[15px] transition-all duration-200 active:scale-[0.99]"
                      style={{
                        border: "none",
                        background: settings.voice === v.key ? "rgba(157,95,48,0.09)" : "rgba(74,60,35,0.04)",
                        boxShadow: settings.voice === v.key ? "inset 0 0 0 1px rgba(157,95,48,0.35)" : "none",
                        fontWeight: settings.voice === v.key ? 700 : 400,
                        color: "#2e2a24",
                        minHeight: 48,
                      }}
                    >
                      <span
                        className="flex-none rounded-full transition-all duration-200"
                        style={{
                          width: 18,
                          height: 18,
                          border: `2px solid ${settings.voice === v.key ? "#9d5f30" : "rgba(120,104,72,0.4)"}`,
                          background: settings.voice === v.key ? "#9d5f30" : "transparent",
                          boxShadow: settings.voice === v.key ? "inset 0 0 0 3px #fdf6ea, 0 2px 6px rgba(138,82,39,0.35)" : "none",
                        }}
                      />
                      {v.label}
                      <small style={{ color: "#a2987f", fontWeight: 400 }}>{v.sub}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className={groupLabel} style={{ color: "#9c875a" }}>
                  语速
                </div>
                <input
                  type="range"
                  aria-label="语速"
                  className="reader-range w-full"
                  min={0.7}
                  max={1.2}
                  step={0.05}
                  value={settings.rate}
                  onChange={(e) => onChange({ rate: Number(e.target.value) })}
                />
                <div className="mt-1.5 flex justify-between text-[12.5px]" style={{ color: "#a2987f" }}>
                  <span>0.7×</span>
                  <span>当前 {settings.rate.toFixed(2).replace(/0$/, "")}×</span>
                  <span>1.2×</span>
                </div>
                <button
                  type="button"
                  onClick={() => speak("Good morning! Could I have an iced coffee, please — less sweet?", settings)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[16px] font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                  style={{
                    background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)",
                    minHeight: 52,
                    boxShadow: "0 12px 24px -10px rgba(138,82,39,0.65), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: 17, height: 17 }} aria-hidden="true">
                    <path d="M7 4l13 8-13 8z" fill="#fff" />
                  </svg>
                  试听当前声音
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= explanation card ================= */

/** Quiet part-of-speech tag that sits right after a word/phrase head. */
function PosTag({ pos, night }: { pos: string; night: boolean }) {
  return (
    <span
      className="flex-none rounded-full font-ui"
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        lineHeight: 1,
        padding: "3px 7px",
        color: night ? "#c8a06a" : "#96622c",
        background: night ? "rgba(217,154,91,0.14)" : "rgba(157,95,48,0.09)",
        boxShadow: `inset 0 0 0 1px ${night ? "rgba(217,154,91,0.25)" : "rgba(157,95,48,0.18)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {pos}
    </span>
  );
}

function ExplanationCard({
  sentence,
  settings,
  isMarked,
  onToggle,
}: {
  sentence: Sentence;
  settings: Settings;
  isMarked: (kind: MarkKind, en: string, sentenceId: string) => boolean;
  onToggle: (kind: MarkKind, en: string, cn: string, sentenceId: string) => void;
}) {
  const th = themeOf(settings);
  const night = settings.theme === "night";
  const hairline = night ? "rgba(236,227,208,0.09)" : "rgba(74,60,35,0.09)";
  const secTitle = "mb-0.5 text-[11px] font-bold tracking-[0.18em]";
  return (
    <div
      data-keep
      className={`anim-pop thin-scroll absolute z-30 max-lg:inset-x-3 max-lg:bottom-[118px] lg:top-[76px] lg:right-6 lg:w-[min(400px,44%)] ${night ? "glass-night" : "glass-paper"}`}
      role="dialog"
      aria-label="句子讲解"
      style={{
        color: th.text,
        border: `1px solid ${night ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)"}`,
        borderRadius: 18,
        boxShadow:
          "0 2px 6px rgba(74,54,20,0.05), 0 20px 44px -16px rgba(74,54,20,0.32), 0 40px 80px -36px rgba(74,54,20,0.2), inset 0 1px 0 rgba(255,255,255,0.55)",
        padding: "14px 16px 15px",
        maxHeight: "min(62dvh, 560px)",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-1.5">
        <div style={{ fontFamily: fontStack(settings), fontSize: 17.5, fontWeight: 600, lineHeight: 1.4, letterSpacing: "0.005em", flex: 1 }}>
          {sentence.en}
        </div>
        <PlayButton plain label="播放整句" size={30} onClick={() => speak(sentence.en, settings)} />
        <PlusButton
          plain
          label={isMarked("sentence", sentence.en, sentence.id) ? "已加入笔记本，点按移出" : "把整句加入笔记本"}
          size={30}
          added={isMarked("sentence", sentence.en, sentence.id)}
          onClick={() => onToggle("sentence", sentence.en, sentence.cn, sentence.id)}
        />
      </div>
      <div className="mt-1.5 text-[13px] leading-[1.55] font-medium" style={{ color: th.soft }}>
        {sentence.cn}
      </div>
      {sentence.phrases.length > 0 ? (
        <div className="mt-3.5 border-t pt-2.5" style={{ borderColor: hairline }}>
          <div className={secTitle} style={{ color: "#9c875a" }}>
            重点词与词组
          </div>
          {sentence.phrases.map((p) => (
            <div
              key={p.en}
              className="flex items-center gap-1.5 border-b py-2 last:border-b-0"
              style={{ borderColor: hairline }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-en-serif" style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.3 }}>
                    {p.en}
                  </span>
                  {p.pos ? <PosTag pos={p.pos} night={night} /> : null}
                </div>
                <div className="mt-0.5 text-[12.5px] leading-[1.5]" style={{ color: th.soft }}>
                  {p.cn}
                </div>
              </div>
              <PlayButton plain label={`播放 ${p.en}`} size={30} onClick={() => speak(p.en, settings)} />
              <PlusButton
                plain
                label={isMarked("phrase", p.en, sentence.id) ? `已收藏 ${p.en}，点按移出` : `收藏词组 ${p.en}`}
                size={30}
                added={isMarked("phrase", p.en, sentence.id)}
                onClick={() => onToggle("phrase", p.en, p.cn, sentence.id)}
              />
            </div>
          ))}
        </div>
      ) : null}
      {sentence.examples.length > 0 ? (
        <div className="mt-3.5 border-t pt-2.5" style={{ borderColor: hairline }}>
          <div className={secTitle} style={{ color: "#9c875a" }}>
            例句 · 换个场景这样说
          </div>
          {sentence.examples.map((ex) => (
            <div
              key={ex.en}
              className="mt-1.5 flex items-center gap-1.5 rounded-xl px-3 py-2.5"
              style={{
                background: night ? "rgba(236,227,208,0.06)" : "rgba(157,95,48,0.07)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-en-serif" style={{ fontSize: 14.5, lineHeight: 1.45 }}>
                  {ex.en}
                </div>
                <div className="mt-0.5 text-[12.5px] leading-[1.5]" style={{ color: th.soft }}>
                  {ex.cn}
                </div>
              </div>
              <PlayButton plain label="播放例句" size={30} onClick={() => speak(ex.en, settings)} />
              <PlusButton
                plain
                label={isMarked("example", ex.en, sentence.id) ? "已收藏例句，点按移出" : "收藏例句"}
                size={30}
                added={isMarked("example", ex.en, sentence.id)}
                onClick={() => onToggle("example", ex.en, ex.cn, sentence.id)}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ================= notebook panel ================= */

function NotebookPanel({
  items,
  settings,
  onClose,
}: {
  items: Mark[];
  settings: Settings;
  onClose?: () => void;
}) {
  const th = themeOf(settings);
  const night = settings.theme === "night";
  const hairline = night ? "rgba(236,227,208,0.09)" : "rgba(74,60,35,0.09)";
  const timeFmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const tagStyle: Record<MarkKind, { bg: string; fg: string }> = night
    ? {
        sentence: { bg: "rgba(217,154,91,0.16)", fg: "#dfa468" },
        phrase: { bg: "rgba(169,189,141,0.15)", fg: "#b3c69a" },
        example: { bg: "rgba(157,184,204,0.14)", fg: "#a9c3d8" },
      }
    : {
        sentence: { bg: "rgba(157,95,48,0.12)", fg: "#9d5f30" },
        phrase: { bg: "rgba(117,131,95,0.16)", fg: "#4f6039" },
        example: { bg: "rgba(90,120,150,0.13)", fg: "#43607e" },
      };
  return (
    <div className="flex h-full flex-col" style={{ background: night ? "#2b251c" : "#fffdf6", color: th.text }}>
      <div className="flex items-baseline justify-between px-6 pt-6">
        <h2 className="font-cn-serif" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "0.03em" }}>
          笔记本
        </h2>
        {onClose ? (
          <button
            type="button"
            aria-label="关闭笔记本"
            onClick={onClose}
            className="flex items-center justify-center rounded-full text-[17px] transition-all duration-200 active:scale-90"
            style={{ color: th.soft, width: 32, height: 32, minHeight: 32, background: night ? "rgba(255,255,255,0.06)" : "rgba(74,60,35,0.05)" }}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="px-6 pt-1.5 pb-2 text-[13px] tracking-[0.06em]" style={{ color: "#a2987f" }}>
        今天标记的 · 共 {items.length} 条
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        {items.length === 0 ? (
          <p className="mt-6 text-[14px] leading-[1.7]" style={{ color: th.soft }}>
            今天还没有标记。读的时候点任意一句，在讲解卡里按「＋」，句子、词组和例句就会收进这里。
          </p>
        ) : (
          items.map((m) => {
            const tag = tagStyle[m.kind];
            return (
              <div key={m.id} className="border-b py-3.5 last:border-b-0" style={{ borderColor: hairline }}>
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex-none rounded-full px-2 py-0.5 text-[11px] font-bold tracking-[0.08em]"
                    style={{ background: tag.bg, color: tag.fg }}
                  >
                    {KIND_LABEL[m.kind]}
                  </span>
                  <span className="font-en-serif flex-1" style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.42 }}>
                    {m.en}
                  </span>
                  <PlayButton label={`播放 ${m.en}`} size={40} onClick={() => speak(m.en, settings)} />
                </div>
                {m.cn ? (
                  <div className="mt-1.5 text-[13.5px] leading-[1.55]" style={{ color: th.soft }}>
                    {m.cn}
                  </div>
                ) : null}
                <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[12px]" style={{ color: "#b0a586" }}>
                  <span className="min-w-0 truncate">
                    {m.bookTitle} · {m.chapterLabel}
                  </span>
                  <span className="flex-none tabular-nums">{timeFmt.format(new Date(m.createdAt))}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div
        className="border-t px-6 py-3.5 text-center text-[12.5px]"
        style={{ borderColor: hairline, color: "#b0a586" }}
      >
        以前标记的在复习页
      </div>
    </div>
  );
}

/* ================= storyboard (分镜) ================= */

function PanelLineView({
  line,
  sentence,
  settings,
  night,
  active,
  onPick,
}: {
  line: PanelLine;
  sentence: Sentence;
  settings: Settings;
  night: boolean;
  active: boolean;
  onPick: (sentence: Sentence, say?: string) => void;
}) {
  if (!line.speaker) {
    // Narration: a quiet caption strip along the top of the frame.
    return (
      <button
        type="button"
        aria-label={`旁白：${sentence.en}`}
        onClick={(e) => {
          e.stopPropagation();
          onPick(sentence, line.say);
        }}
        className="block w-full rounded-[10px] px-3.5 py-2 text-left transition-all duration-200 active:scale-[0.99]"
        style={{
          background: night ? "rgba(24,19,13,0.82)" : "rgba(38,29,16,0.78)",
          color: "#f5ecd9",
          WebkitBackdropFilter: "blur(6px)",
          backdropFilter: "blur(6px)",
          boxShadow: active
            ? "0 0 0 2px rgba(217,164,90,0.95), 0 8px 20px -8px rgba(20,12,4,0.6)"
            : "0 6px 16px -8px rgba(20,12,4,0.55), inset 0 1px 0 rgba(255,255,255,0.14)",
          fontFamily: fontStack(settings),
          fontSize: 13.5,
          lineHeight: 1.5,
          minHeight: 0,
        }}
      >
        {line.say ?? sentence.en}
      </button>
    );
  }
  const right = line.side === "right";
  return (
    <div className={`flex ${right ? "justify-end" : "justify-start"}`}>
      <button
        type="button"
        aria-label={`${line.speaker}：${line.say ?? sentence.en}`}
        onClick={(e) => {
          e.stopPropagation();
          onPick(sentence, line.say);
        }}
        className="relative block text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
        style={{
          maxWidth: "76%",
          background: night ? "#3a332a" : "#fffdf6",
          color: night ? "#f3ead8" : "#2c2620",
          borderRadius: right ? "17px 17px 5px 17px" : "17px 17px 17px 5px",
          padding: "8px 13px 10px",
          boxShadow: active
            ? "0 0 0 2.5px rgba(178,111,63,0.9), 0 14px 28px -10px rgba(30,20,8,0.55)"
            : "0 10px 22px -8px rgba(30,20,8,0.45), inset 0 1px 0 rgba(255,255,255,0.75)",
          minHeight: 0,
        }}
      >
        {/* bubble tail, pointing down toward the speaker in the scene */}
        <span
          aria-hidden="true"
          className="absolute"
          style={{
            bottom: -6,
            [right ? "right" : "left"]: 20,
            width: 13,
            height: 13,
            transform: "rotate(45deg)",
            background: night ? "#3a332a" : "#fffdf6",
            borderRadius: "0 0 3px 0",
            boxShadow: "3px 3px 6px -2px rgba(30,20,8,0.25)",
          }}
        />
        <span
          className="mb-0.5 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.14em]"
          style={{ color: night ? "#d9a45a" : "#9d5f30" }}
        >
          {line.speaker}
          <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, opacity: 0.75 }} aria-hidden="true">
            <path d="M7 4l13 8-13 8z" fill="currentColor" />
          </svg>
        </span>
        <span className="font-en-serif block" style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.42 }}>
          {line.say ?? sentence.en}
        </span>
      </button>
    </div>
  );
}

function PanelsView({
  chapter,
  settings,
  selectedId,
  onPick,
}: {
  chapter: Chapter;
  settings: Settings;
  selectedId: string | null;
  onPick: (sentence: Sentence, say?: string) => void;
}) {
  const night = settings.theme === "night";
  const panels = chapter.panels ?? [];
  const byId = useMemo(() => {
    const map = new Map<string, Sentence>();
    for (const b of chapter.blocks) {
      if (b.type === "p") for (const sen of b.sentences) map.set(sen.id, sen);
    }
    return map;
  }, [chapter]);
  return (
    <div className="flex flex-col" style={{ gap: 30 }}>
      {panels.map((panel, i) => {
        const src = IMG[panel.img];
        if (!src) return null;
        const narration = panel.lines.filter((l) => !l.speaker);
        const bubbles = panel.lines.filter((l) => l.speaker);
        return (
          <figure key={i} style={{ margin: 0 }}>
            <div className="mb-2 flex items-baseline justify-between px-0.5">
              <span className="text-[11px] font-bold tracking-[0.3em]" style={{ color: "#9c875a" }}>
                PANEL {i + 1}
              </span>
              <span className="text-[11.5px]" style={{ color: settings.theme === "night" ? "#a89d8a" : "#b0a586" }}>
                {i + 1} / {panels.length}
              </span>
            </div>
            <div
              className="relative overflow-hidden"
              style={{
                borderRadius: 10,
                boxShadow: night
                  ? "0 0 0 2px rgba(236,227,208,0.35), 0 22px 44px -18px rgba(0,0,0,0.7)"
                  : "0 0 0 2px rgba(43,36,26,0.82), 0 2px 6px rgba(60,45,20,0.1), 0 22px 44px -18px rgba(60,45,20,0.4)",
              }}
            >
              <img src={src} alt={panel.alt} className="block w-full" style={{ aspectRatio: "3 / 2", objectFit: "cover" }} />
              <div className="absolute inset-0 flex flex-col p-3 sm:p-4">
                {narration.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {narration.map((line) => {
                      const sen = byId.get(line.sentenceId);
                      if (!sen) return null;
                      return (
                        <PanelLineView
                          key={line.sentenceId}
                          line={line}
                          sentence={sen}
                          settings={settings}
                          night={night}
                          active={selectedId === sen.id}
                          onPick={onPick}
                        />
                      );
                    })}
                  </div>
                ) : null}
                {bubbles.length > 0 ? (
                  <div className="mt-auto flex flex-col gap-2.5 pb-1">
                    {bubbles.map((line) => {
                      const sen = byId.get(line.sentenceId);
                      if (!sen) return null;
                      return (
                        <PanelLineView
                          key={line.sentenceId}
                          line={line}
                          sentence={sen}
                          settings={settings}
                          night={night}
                          active={selectedId === sen.id}
                          onPick={onPick}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </figure>
        );
      })}
    </div>
  );
}

/* ================= reader ================= */

function Reader({
  bookId,
  chapterOverride,
  settings,
  onChangeSettings,
  marks,
  onBack,
}: {
  bookId: string;
  chapterOverride?: number;
  settings: Settings;
  onChangeSettings: (patch: Partial<Settings>) => void;
  marks: Mark[];
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const bookQuery = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => api.getBook({ bookId }),
  });
  const book = bookQuery.data?.book ?? null;

  const [chapterIndex, setChapterIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Sentence | null>(null);
  const [panelMode, setPanelMode] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (book && chapterIndex === null) {
      const target = chapterOverride ?? book.chapterIndex;
      setChapterIndex(Math.min(Math.max(target, 0), Math.max(book.content.chapters.length - 1, 0)));
    }
  }, [book, chapterIndex, chapterOverride]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setPanelMode(false);
  }, [chapterIndex]);

  /** Tapping a storyboard bubble or narration strip: read the line aloud
   *  with the current voice settings and open its explanation card — the
   *  same card (and the same marks) as tapping the sentence in prose. */
  const pickPanelLine = (sentence: Sentence, say?: string) => {
    speak(say ?? sentence.en, settings);
    setSelected(sentence);
  };

  const progressMutation = useMutation({
    mutationFn: (ci: number) => api.saveProgress({ bookId, chapterIndex: ci }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  const addMutation = useMutation({
    mutationFn: (args: Parameters<typeof api.addMark>[0]) => api.addMark(args),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["marks"] }),
  });
  const removeMutation = useMutation({
    mutationFn: (id: number) => api.removeMark({ id }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["marks"] }),
  });

  const markByKey = useMemo(
    () => new Map(marks.map((m) => [markKey(m.bookId, m.sentenceId, m.kind, m.en), m])),
    [marks],
  );
  const isMarked = (kind: MarkKind, en: string, sentenceId: string) =>
    markByKey.has(markKey(bookId, sentenceId, kind, en));

  const chapter: Chapter | null =
    book && chapterIndex !== null ? (book.content.chapters[chapterIndex] ?? null) : null;

  const toggleMark = (kind: MarkKind, en: string, cn: string, sentenceId: string) => {
    if (!book || chapterIndex === null) return;
    const existing = markByKey.get(markKey(bookId, sentenceId, kind, en));
    if (existing) {
      removeMutation.mutate(existing.id);
    } else {
      addMutation.mutate({
        kind,
        en,
        cn,
        bookId,
        bookTitle: book.title,
        chapterIndex,
        chapterLabel: `第 ${chapterIndex + 1} 章`,
        sentenceId,
      });
    }
  };

  const goChapter = (ci: number) => {
    if (!book) return;
    const clamped = Math.min(Math.max(ci, 0), book.content.chapters.length - 1);
    setChapterIndex(clamped);
    setSelected(null);
    setTocOpen(false);
    progressMutation.mutate(clamped);
  };

  const th = themeOf(settings);
  const todayItems = useMemo(() => {
    const today = klToday();
    return marks.filter((m) => m.addedDate === today);
  }, [marks]);

  if (bookQuery.isPending || chapterIndex === null) {
    return (
      <div className="font-ui flex h-full items-center justify-center" style={{ background: th.bg, color: th.soft }}>
        {bookQuery.isError ? (
          <div className="text-center">
            <p>这本书打开失败了。</p>
            <button type="button" onClick={onBack} className="mt-3 rounded-full px-5 py-2 font-bold" style={{ background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)", color: "#fff", boxShadow: "0 10px 20px -8px rgba(138,82,39,0.55)" }}>
              回到书架
            </button>
          </div>
        ) : (
          "正在打开书…"
        )}
      </div>
    );
  }
  if (!book || !chapter) {
    return (
      <div className="font-ui flex h-full items-center justify-center" style={{ background: th.bg, color: th.soft }}>
        <div className="text-center">
          <p>没有找到这本书。</p>
          <button type="button" onClick={onBack} className="mt-3 rounded-full px-5 py-2 font-bold" style={{ background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)", color: "#fff", boxShadow: "0 10px 20px -8px rgba(138,82,39,0.55)" }}>
            回到书架
          </button>
        </div>
      </div>
    );
  }

  const chromeBg = settings.theme === "night" ? "rgba(43,37,28,0.78)" : "rgba(255,253,248,0.78)";
  const totalChapters = book.content.chapters.length;
  const hasPanels = (chapter.panels?.length ?? 0) > 0;
  const showPanels = panelMode && hasPanels;

  return (
    <div
      className={`relative flex h-full ${settings.theme === "night" ? "theme-night" : ""}`}
      style={{ background: th.bg, color: th.text }}
      onClick={(e) => {
        // Tapping anywhere outside the explanation card dismisses it.
        if (!selected) return;
        const t = e.target as HTMLElement;
        if (t.closest("[data-keep]") || t.closest(".sentence-span")) return;
        setSelected(null);
      }}
    >
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* ---- reading text (the only thing visible in immersive mode) ---- */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex-1 overflow-y-auto"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("[data-keep]")) return;
            if (selected) {
              setSelected(null);
              return;
            }
            setBarVisible((v) => !v);
          }}
          style={{
            background: `radial-gradient(120% 90% at 50% 0%, ${settings.theme === "night" ? "#2e2820" : "#fffdf7"}, ${th.bg})`,
          }}
        >
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "54px 7vw 110px" }}>
            <div className="text-center text-[13px] font-bold" style={{ letterSpacing: "0.3em", textTransform: "uppercase", color: "#9c875a" }}>
              {chapter.kicker}
            </div>
            <h1
              className="text-center"
              style={{ fontFamily: fontStack(settings), fontSize: 34, fontWeight: 700, margin: "10px 0 30px", lineHeight: 1.25 }}
            >
              {chapter.title}
            </h1>
            {hasPanels ? (
              <div data-keep className="mb-10 flex justify-center" onClick={(e) => e.stopPropagation()}>
                <div
                  className="inline-flex rounded-full p-1"
                  role="group"
                  aria-label="阅读方式"
                  style={{
                    background: settings.theme === "night" ? "rgba(236,227,208,0.08)" : "rgba(74,60,35,0.07)",
                    boxShadow: "inset 0 1px 3px rgba(74,54,20,0.1)",
                  }}
                >
                  {(
                    [
                      { key: "prose", label: "正文" },
                      { key: "panels", label: "分镜" },
                    ] as const
                  ).map((o) => {
                    const active = (o.key === "panels") === panelMode;
                    return (
                      <button
                        key={o.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setPanelMode(o.key === "panels");
                          setSelected(null);
                        }}
                        className="rounded-full px-6 py-1.5 text-[13.5px] transition-all duration-200 active:scale-95"
                        style={{
                          background: active ? th.card : "transparent",
                          color: active ? th.text : th.soft,
                          fontWeight: active ? 700 : 500,
                          minHeight: 34,
                          boxShadow: active ? "0 2px 8px rgba(74,54,20,0.16), 0 1px 2px rgba(74,54,20,0.08)" : "none",
                        }}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {showPanels ? (
              <PanelsView chapter={chapter} settings={settings} selectedId={selected?.id ?? null} onPick={pickPanelLine} />
            ) : (
              chapter.blocks.map((block, bi) => {
              if (block.type === "figure") {
                const src = IMG[block.img];
                if (!src) return null;
                return (
                  <figure key={bi} style={{ margin: "6px auto 26px", width: "min(72%, 560px)" }}>
                    <img
                      src={src}
                      alt={block.alt}
                      className="block w-full rounded-[14px]"
                      style={{ aspectRatio: "3 / 2", objectFit: "cover", boxShadow: "0 2px 6px rgba(60,45,20,0.08), 0 18px 36px -14px rgba(60,45,20,0.35)" }}
                    />
                    <figcaption
                      className="text-center"
                      style={{ fontFamily: fontStack(settings), fontStyle: "italic", fontSize: 15, color: th.soft, marginTop: 9 }}
                    >
                      {block.caption}
                    </figcaption>
                  </figure>
                );
              }
              return (
                <p
                  key={bi}
                  style={{
                    fontFamily: fontStack(settings),
                    fontSize: settings.fontSize,
                    lineHeight: LINE_HEIGHTS[settings.lineSpacing] ?? 1.85,
                    margin: `0 0 ${PARA_GAPS[settings.paraSpacing] ?? "1.05em"}`,
                    textAlign: "justify",
                  }}
                >
                  {block.sentences.map((sen, si) => (
                    <span key={sen.id}>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`讲解：${sen.en}`}
                        className={`sentence-span ${selected?.id === sen.id ? "hl-box" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(sen);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(sen);
                          }
                        }}
                      >
                        {sen.en}
                      </span>
                      {si < block.sentences.length - 1 ? " " : null}
                    </span>
                  ))}
                </p>
              );
              })
            )}
            {/* chapter end navigation — part of the page flow, not chrome */}
            <div data-keep className="mt-12 flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-[13px]" style={{ color: th.soft, letterSpacing: "0.2em" }}>
                · 本章完 ·
              </div>
              <div className="flex gap-3">
                {chapterIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => goChapter(chapterIndex - 1)}
                    className="rounded-full px-5 py-2.5 text-[14.5px] font-medium transition-all duration-200 hover:bg-[rgba(157,95,48,0.07)] active:scale-95"
                    style={{ border: `1px solid ${th.line}`, color: th.text, background: th.card, minHeight: 44 }}
                  >
                    上一章
                  </button>
                ) : null}
                {chapterIndex < totalChapters - 1 ? (
                  <button
                    type="button"
                    onClick={() => goChapter(chapterIndex + 1)}
                    className="rounded-full px-5 py-2.5 text-[14.5px] font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-95"
                    style={{
                      background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)",
                      minHeight: 44,
                      boxShadow: "0 10px 20px -8px rgba(138,82,39,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
                    }}
                  >
                    下一章
                  </button>
                ) : (
                  <span className="text-[14px]" style={{ color: th.soft }}>
                    已经是最后一章了
                  </span>
                )}
              </div>
            </div>
            <div className="mt-14 text-center" style={{ fontFamily: fontStack(settings), fontSize: 14, color: th.soft, letterSpacing: "0.15em" }}>
              {chapterIndex + 1} / {totalChapters}
            </div>
          </div>
        </div>

        {/* ---- transient top bar (appears with the bottom bar) ---- */}
        <div
          data-keep
          className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-safe"
          style={{
            background: chromeBg,
            WebkitBackdropFilter: "blur(18px) saturate(1.3)",
            backdropFilter: "blur(18px) saturate(1.3)",
            boxShadow: "0 1px 0 rgba(74,60,35,0.07), 0 12px 32px -18px rgba(74,54,20,0.25)",
            transform: barVisible ? "translateY(0)" : "translateY(-110%)",
            opacity: barVisible ? 1 : 0,
            transition: "transform 0.34s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
            color: th.text,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="回到书架"
            className="flex items-center gap-1 rounded-full px-2 py-2 text-[14.5px] font-medium"
            style={{ color: th.text, minHeight: 44 }}
          >
            <IconBack />
            书架
          </button>
          <div className="min-w-0 flex-1 truncate text-center text-[14.5px] font-medium" style={{ color: th.soft }}>
            {book.title} · 第 {chapterIndex + 1} 章 / 共 {totalChapters} 章
          </div>
          <span style={{ width: 64 }} />
        </div>

        {/* ---- bottom bar: exactly 目录 / 设置 / 笔记本 — floating glass capsule ---- */}
        <div
          data-keep
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 14px)",
            transform: barVisible ? "translateY(0)" : "translateY(26px)",
            opacity: barVisible ? 1 : 0,
            transition: "transform 0.36s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
          }}
        >
          <div
            className="pointer-events-auto flex items-stretch gap-1.5 rounded-full px-2.5 py-1.5"
            style={{
              background: chromeBg,
              WebkitBackdropFilter: "blur(22px) saturate(1.4)",
              backdropFilter: "blur(22px) saturate(1.4)",
              border: `1px solid ${settings.theme === "night" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)"}`,
              boxShadow: "var(--shadow-bar)",
              color: th.text,
            }}
          >
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              aria-label="目录"
              className="flex flex-col items-center justify-center gap-0.5 rounded-full px-6 transition-all duration-200 hover:bg-[rgba(157,95,48,0.08)] active:scale-95"
              style={{ minHeight: 54, minWidth: 78 }}
            >
              <IconList size={25} />
              <span className="text-[11px] font-semibold tracking-[0.14em]">目录</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="设置"
              className="flex flex-col items-center justify-center gap-0.5 rounded-full px-6 transition-all duration-200 hover:bg-[rgba(157,95,48,0.08)] active:scale-95"
              style={{ minHeight: 54, minWidth: 78 }}
            >
              <IconSliders size={25} />
              <span className="text-[11px] font-semibold tracking-[0.14em]">设置</span>
            </button>
            <button
              type="button"
              onClick={() => setNotebookOpen((v) => !v)}
              aria-label="笔记本"
              aria-pressed={notebookOpen}
              className="flex flex-col items-center justify-center gap-0.5 rounded-full px-6 transition-all duration-200 hover:bg-[rgba(157,95,48,0.08)] active:scale-95"
              style={{
                minHeight: 54,
                minWidth: 78,
                color: notebookOpen ? "#9d5f30" : th.text,
                background: notebookOpen ? "rgba(157,95,48,0.12)" : "transparent",
                boxShadow: notebookOpen ? "inset 0 1px 3px rgba(138,82,39,0.18)" : "none",
              }}
            >
              <IconNotebook size={25} />
              <span className="text-[11px] font-semibold tracking-[0.14em]">笔记本</span>
            </button>
          </div>
        </div>

        {/* ---- explanation card ---- */}
        {selected ? (
          <ExplanationCard
            sentence={selected}
            settings={settings}
            isMarked={isMarked}
            onToggle={toggleMark}
          />
        ) : null}

        {/* ---- mobile notebook drawer ---- */}
        {notebookOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="笔记本">
            <div className="anim-fade absolute inset-0" style={{ background: "rgba(46,36,20,0.38)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} onClick={() => setNotebookOpen(false)} />
            <div
              className="anim-drawer absolute inset-y-0 right-0"
              style={{ width: "86%", maxWidth: 380, boxShadow: "-24px 0 48px -16px rgba(60,45,20,0.35)" }}
            >
              <NotebookPanel items={todayItems} settings={settings} onClose={() => setNotebookOpen(false)} />
            </div>
          </div>
        ) : null}
      </div>

      {/* ---- desktop notebook column (push, ~30%) ---- */}
      <aside
        className="relative z-10 hidden flex-none lg:block"
        style={{
          width: notebookOpen ? "30%" : 0,
          minWidth: notebookOpen ? 300 : 0,
          opacity: notebookOpen ? 1 : 0,
          transition: "width 0.35s cubic-bezier(0.22,0.9,0.3,1), opacity 0.3s",
          borderLeft: notebookOpen ? `1px solid ${settings.theme === "night" ? "rgba(236,227,208,0.08)" : "rgba(74,60,35,0.08)"}` : "none",
          boxShadow: notebookOpen ? "-24px 0 48px -24px rgba(60,45,20,0.22)" : "none",
          overflow: "hidden",
        }}
        aria-hidden={!notebookOpen}
      >
        <div style={{ width: "30vw", minWidth: 300, height: "100%" }}>
          <NotebookPanel items={todayItems} settings={settings} />
        </div>
      </aside>

      {/* ---- table of contents drawer ---- */}
      {tocOpen ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-label="目录">
          <div className="anim-fade absolute inset-0" style={{ background: "rgba(46,36,20,0.38)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }} onClick={() => setTocOpen(false)} />
          <div
            className="anim-drawer thin-scroll absolute inset-y-0 left-0 overflow-y-auto"
            style={{
              width: "84%",
              maxWidth: 360,
              background: th.card,
              color: th.text,
              borderRadius: "0 24px 24px 0",
              boxShadow: "24px 0 48px -16px rgba(60,45,20,0.35)",
              padding: "22px 0",
            }}
          >
            <div className="flex items-center justify-between px-5">
              <h2 className="font-cn-serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                目录
              </h2>
              <button
                type="button"
                aria-label="关闭目录"
                onClick={() => setTocOpen(false)}
                className="flex items-center justify-center rounded-full text-[17px] transition-all duration-200 active:scale-90"
                style={{ color: th.soft, width: 32, height: 32, minHeight: 32, background: settings.theme === "night" ? "rgba(255,255,255,0.06)" : "rgba(74,60,35,0.05)" }}
              >
                ×
              </button>
            </div>
            <div className="flex items-baseline gap-2 px-5 pt-1.5">
              <span className="font-en-serif truncate text-[14px]" style={{ color: th.soft }}>
                {book.title}
              </span>
              <span className="flex-none text-[12px]" style={{ color: th.soft, opacity: 0.75 }}>
                共 {book.content.chapters.length} 章
              </span>
            </div>
            <div className="mx-5 mt-4 border-t" style={{ borderColor: settings.theme === "night" ? "rgba(236,227,208,0.1)" : "rgba(74,60,35,0.09)" }} />
            <div className="mt-2 px-3 pb-2">
              {book.content.chapters.map((ch, i) => {
                const count = ch.blocks.reduce((n, b) => (b.type === "p" ? n + b.sentences.length : n), 0);
                const active = i === chapterIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goChapter(i)}
                    aria-current={active ? "true" : undefined}
                    className="mb-0.5 flex w-full items-start gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-all duration-200 hover:bg-[rgba(157,95,48,0.05)] active:scale-[0.99]"
                    style={{
                      background: active ? (settings.theme === "night" ? "rgba(236,227,208,0.07)" : "rgba(157,95,48,0.08)") : "transparent",
                      boxShadow: active
                        ? `inset 3px 0 0 ${settings.theme === "night" ? "#dfa468" : "#b26f3f"}`
                        : "none",
                      minHeight: 58,
                    }}
                  >
                    <span
                      className="font-en-serif flex-none text-center"
                      style={{
                        width: 26,
                        fontSize: 19,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        color: active ? (settings.theme === "night" ? "#dfa468" : "#9d5f30") : th.soft,
                        opacity: active ? 1 : 0.55,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-bold" style={{ letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c875a" }}>
                        {ch.kicker}
                      </span>
                      <span className="font-en-serif mt-0.5 block leading-snug" style={{ fontSize: 16.5, fontWeight: active ? 700 : 500 }}>
                        {ch.title}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[12px]" style={{ color: th.soft }}>
                        <span>{count} 句</span>
                        {(ch.panels?.length ?? 0) > 0 ? (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em]"
                            style={{
                              background: settings.theme === "night" ? "rgba(217,154,91,0.16)" : "rgba(157,95,48,0.11)",
                              color: settings.theme === "night" ? "#dfa468" : "#9d5f30",
                            }}
                          >
                            分镜
                          </span>
                        ) : null}
                        {active ? (
                          <span className="font-bold" style={{ color: settings.theme === "night" ? "#dfa468" : "#9d5f30" }}>
                            正在读
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---- settings sheet ---- */}
      {settingsOpen ? (
        <SettingsSheet settings={settings} onChange={onChangeSettings} onClose={() => setSettingsOpen(false)} />
      ) : null}
    </div>
  );
}

/* ================= review page ================= */

type Rating = "forgot" | "hard" | "remembered" | "fluent";

function Review({
  marks,
  settings,
  onBack,
  onOpenSource,
}: {
  marks: Mark[];
  settings: Settings;
  onBack: () => void;
  onOpenSource: (mark: Mark) => void;
}) {
  const today = klToday();
  const queryClient = useQueryClient();
  const rateMutation = useMutation({
    mutationFn: (args: { id: number; rating: Rating }) => api.rateMark(args),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["marks"] }),
  });

  const dueAll = useMemo(
    () =>
      marks
        .filter((m) => m.dueDate <= today)
        .sort((a, b) =>
          a.dueDate !== b.dueDate ? (a.dueDate < b.dueDate ? -1 : 1) : a.createdAt - b.createdAt,
        ),
    [marks, today],
  );

  const [session, setSession] = useState<number[] | null>(null);
  const [initialTotal, setInitialTotal] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (session === null && dueAll.length > 0) {
      setSession(dueAll.map((m) => m.id));
      setInitialTotal(dueAll.length);
    }
  }, [dueAll, session]);

  const currentId = session?.[0];
  const current = currentId !== undefined ? (marks.find((m) => m.id === currentId) ?? null) : null;

  const rate = (rating: Rating) => {
    if (!current) return;
    rateMutation.mutate({ id: current.id, rating });
    setRevealed(false);
    setSession((prev) => {
      if (!prev) return prev;
      const rest = prev.slice(1);
      return rating === "forgot" ? [...rest, current.id] : rest;
    });
    if (rating !== "forgot") setDoneCount((c) => c + 1);
  };

  const ratingButtons: { key: Rating; label: string; bg: string; fg: string; hint: (m: Mark) => string }[] = [
    { key: "forgot", label: "忘记", bg: "rgba(196,106,72,0.09)", fg: "#b0502e", hint: () => "今天再来" },
    { key: "hard", label: "困难", bg: "rgba(190,150,60,0.11)", fg: "#93700f", hint: () => "+1 天" },
    { key: "remembered", label: "记得", bg: "rgba(117,131,95,0.12)", fg: "#4f6039", hint: (m) => `+${LADDER[Math.min(m.stage + 1, 5)]} 天` },
    { key: "fluent", label: "很熟", bg: "rgba(90,120,150,0.1)", fg: "#43607e", hint: (m) => `+${LADDER[Math.min(m.stage + 2, 5)]} 天` },
  ];

  const nextDue = marks.length > 0 ? marks.map((m) => m.dueDate).sort()[0] : null;

  return (
    <div
      className="font-ui mx-auto flex h-full w-full max-w-[980px] flex-col overflow-y-auto px-5 pt-safe pb-8"
      style={{ color: "#2e2a24", background: "linear-gradient(180deg,#faf6ec,#f3ecda)" }}
    >
      <div className="flex items-center gap-2 pt-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="回到书架"
          className="flex items-center gap-1 rounded-full px-2 py-2 text-[14.5px] font-medium"
          style={{ color: "#4c473c", minHeight: 44 }}
        >
          <IconBack />
          书架
        </button>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-cn-serif" style={{ fontSize: 30, fontWeight: 700, margin: 0 }}>
          复习
        </h1>
        <span className="text-[14px]" style={{ color: "#6f6a5e" }}>
          内容来自你的笔记本 · 按记忆规律安排
        </span>
      </div>

      {marks.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[16px] leading-[1.8]" style={{ color: "#4c473c" }}>
            笔记本还是空的，没有可复习的内容。
            <br />
            先去读一本书，点开句子按「＋」，把想记住的句子、词组和例句收进来。
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 rounded-full px-6 py-3 text-[15px] font-bold text-white"
            style={{ background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)", minHeight: 48, boxShadow: "0 10px 20px -8px rgba(138,82,39,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
          >
            去书架选书
          </button>
        </div>
      ) : session === null || initialTotal === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[16px] leading-[1.8]" style={{ color: "#4c473c" }}>
            今天没有到期的复习，笔记本里共 {marks.length} 条都排好了。
            {nextDue ? <span>下一批在 {nextDue} 到期。</span> : null}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 rounded-full px-6 py-3 text-[15px] font-bold text-white"
            style={{ background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)", minHeight: 48, boxShadow: "0 10px 20px -8px rgba(138,82,39,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
          >
            回到书架
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 text-[16px]" style={{ color: "#4c473c" }}>
            今日待复习{" "}
            <b className="font-en-serif" style={{ fontSize: 24, color: "#9d5f30" }}>
              {initialTotal}
            </b>{" "}
            条 · 已完成 {doneCount} / {initialTotal}
          </div>
          <div className="mt-3 h-[4px] rounded-full" style={{ background: "#e7dcc0" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${initialTotal > 0 ? (doneCount / initialTotal) * 100 : 0}%`, background: "linear-gradient(90deg, #8b9a76, #75835f)" }}
            />
          </div>

          {current ? (
            <>
              <div
                className="anim-pop relative mx-auto mt-8 w-full max-w-[680px] rounded-[24px] px-6 py-9 text-center sm:px-10"
                style={{
                  background: "#fffdf8",
                  boxShadow:
                    "0 2px 6px rgba(74,54,20,0.05), 0 28px 56px -20px rgba(74,54,20,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
                key={current.id}
              >
                <button
                  type="button"
                  onClick={() => onOpenSource(current)}
                  aria-label="跳回原文"
                  className="absolute top-3.5 right-4 rounded-full px-2 py-1 text-[12px]"
                  style={{ color: "#b0a586", minHeight: 32 }}
                >
                  {current.bookTitle} · {current.chapterLabel} · 来自笔记本
                </button>
                <div className="text-[13px] font-bold tracking-[0.2em]" style={{ color: "#9c875a" }}>
                  {KIND_LABEL[current.kind]}
                </div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <span className="font-en-serif" style={{ fontSize: "clamp(26px, 4.5vw, 40px)", fontWeight: 700, lineHeight: 1.3 }}>
                    {current.en}
                  </span>
                  <PlayButton label={`播放 ${current.en}`} size={48} onClick={() => speak(current.en, settings)} />
                </div>
                {revealed ? (
                  <div className="anim-fade mt-4">
                    <div className="text-[17px] font-medium" style={{ color: "#4c473c" }}>
                      {current.cn || "（这条没有中文备注）"}
                    </div>
                    <div className="mt-1.5 text-[13px]" style={{ color: "#b0a586" }}>
                      收藏于 {current.addedDate} · 出处 {current.bookTitle} {current.chapterLabel}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 text-[14px]" style={{ color: "#a2987f" }}>
                      先在心里想一想：它是什么意思？在哪个场景里用的？
                    </div>
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="mt-5 rounded-full px-7 py-3 text-[16px] font-bold transition-all duration-200 hover:bg-[rgba(157,95,48,0.15)] active:scale-95"
                      style={{ color: "#9d5f30", background: "rgba(157,95,48,0.1)", boxShadow: "inset 0 0 0 1px rgba(157,95,48,0.25)", minHeight: 48 }}
                    >
                      显示意思
                    </button>
                  </>
                )}
              </div>
              <div className="mx-auto mt-auto grid w-full max-w-[680px] grid-cols-4 gap-3 pt-8">
                {ratingButtons.map((b) => (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => rate(b.key)}
                    aria-label={`评价：${b.label}`}
                    className="rounded-[18px] px-1 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                    style={{ background: b.bg, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)", minHeight: 66 }}
                  >
                    <b className="block text-[17px]" style={{ color: b.fg }}>
                      {b.label}
                    </b>
                    <span className="text-[12px]" style={{ color: "#a2987f" }}>
                      {b.hint(current)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-16 text-center">
              <p className="font-cn-serif text-[22px] font-bold">今天的复习完成了</p>
              <p className="mt-2 text-[14.5px]" style={{ color: "#6f6a5e" }}>
                完成 {doneCount} 条，下次到期时它们会再回到这里。
              </p>
              <button
                type="button"
                onClick={onBack}
                className="mt-5 rounded-full px-6 py-3 text-[15px] font-bold text-white"
                style={{ background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)", minHeight: 48, boxShadow: "0 10px 20px -8px rgba(138,82,39,0.55), inset 0 1px 0 rgba(255,255,255,0.3)" }}
              >
                回到书架
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= app root ================= */

const FALLBACK_SETTINGS: Settings = {
  font: "serif-sc",
  fontSize: 21,
  lineSpacing: "normal",
  paraSpacing: "medium",
  theme: "paper",
  voice: "us-female",
  rate: 0.9,
};

export function App() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>({ name: "shelf" });

  const libraryQuery = useQuery({
    queryKey: ["library"],
    queryFn: () => api.getLibrary({}),
  });
  const marksQuery = useQuery({
    queryKey: ["marks"],
    queryFn: () => api.listMarks({}),
  });
  const marks = marksQuery.data?.marks ?? [];

  /* Seed the built-in library on first open; populateLibrary also refreshes
     the built-in books to the current edition (imported books, progress,
     marks, and settings are never touched), so it runs once per load. */
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (libraryQuery.data) {
      seededRef.current = true;
      api
        .populateLibrary({})
        .then(() => void queryClient.invalidateQueries({ queryKey: ["library"] }))
        .catch(() => {
          seededRef.current = false;
        });
    }
  }, [libraryQuery.data, queryClient]);

  /* Settings: server value is the source of truth; a local draft drives the
     live preview and is persisted (debounced) whenever it changes. */
  const [draft, setDraft] = useState<Settings | null>(null);
  const draftRef = useRef<Settings | null>(null);
  const savedJsonRef = useRef("");
  const saveSettingsMutation = useMutation({
    mutationFn: (s: Settings) => api.saveSettings(s),
  });
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    const server = libraryQuery.data?.settings;
    if (!server) return;
    const serverJson = JSON.stringify(server);
    const current = draftRef.current;
    if (!current) {
      setDraft(server);
      savedJsonRef.current = serverJson;
      return;
    }
    if (JSON.stringify(current) === savedJsonRef.current && serverJson !== savedJsonRef.current) {
      setDraft(server);
      savedJsonRef.current = serverJson;
    }
  }, [libraryQuery.data?.settings]);
  useEffect(() => {
    if (!draft) return;
    const json = JSON.stringify(draft);
    if (json === savedJsonRef.current) return;
    const t = setTimeout(() => {
      savedJsonRef.current = json;
      saveSettingsMutation.mutate(draft);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const settings = draft ?? libraryQuery.data?.settings ?? FALLBACK_SETTINGS;
  const today = klToday();
  const dueCount = marks.filter((m) => m.dueDate <= today).length;

  return (
    <div className="h-dvh" style={{ background: "#f2ede1" }}>
      {view.name === "shelf" ? (
        libraryQuery.isPending ? (
          <div className="font-ui flex h-full items-center justify-center" style={{ color: "#7a7264" }}>
            正在打开书架…
          </div>
        ) : libraryQuery.isError ? (
          <div className="font-ui flex h-full flex-col items-center justify-center gap-3" style={{ color: "#7a7264" }}>
            <p>书架打开失败了。</p>
            <button
              type="button"
              onClick={() => void libraryQuery.refetch()}
              className="rounded-full px-5 py-2.5 font-bold text-white"
              style={{ background: "linear-gradient(160deg, #ab6c38, #9d5f30 60%, #8a5227)", minHeight: 44, boxShadow: "0 10px 20px -8px rgba(138,82,39,0.55)" }}
            >
              重试
            </button>
          </div>
        ) : (
          <Shelf
            books={libraryQuery.data?.books ?? []}
            dueCount={dueCount}
            onOpenBook={(bookId) => setView({ name: "reader", bookId })}
            onOpenReview={() => setView({ name: "review" })}
          />
        )
      ) : view.name === "reader" ? (
        <Reader
          key={`${view.bookId}:${view.chapter ?? "saved"}`}
          bookId={view.bookId}
          chapterOverride={view.chapter}
          settings={settings}
          onChangeSettings={(patch) => setDraft((d) => (d ? { ...d, ...patch } : { ...settings, ...patch }))}
          marks={marks}
          onBack={() => setView({ name: "shelf" })}
        />
      ) : (
        <Review
          marks={marks}
          settings={settings}
          onBack={() => setView({ name: "shelf" })}
          onOpenSource={(m) => setView({ name: "reader", bookId: m.bookId, chapter: m.chapterIndex })}
        />
      )}
    </div>
  );
}
