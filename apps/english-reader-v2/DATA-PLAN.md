# Data Plan

## Context provenance
- `分类就是AI教材…然后还有就是另外的就是AI帮我去找的书，我想看的书，找英语版过来。然后再就是一些教科书，AI找过来的，OK直接看。` (prior user statement; 书架分类按来源固定为三类：AI 教材 / AI 找的书 / 教科书，外加「全部」)
- `一本在阅读界面的时候，就不用显示复习，复习有专门的页面是把我们笔记本的内容拿过来复习。` (prior user statement; 阅读页零复习元素，复习为独立页面，内容来自笔记本收集)
- `这卡片的那个播放按钮你画的太小了。然后笔记本的那个是显示今天标记的一些内容，就不显示昨天的。设置面板里面的布局有问题` (prior user statement; 播放钮大圆钮 ≥44px、笔记本只显示今天、设置面板两列布局)
- `可以` (user approval of the revised static mockups in Space `ying-yu-yue-du-qi-ye-mian-she-ji-gao`; functional build must match those 6 screens' layout and visuals)
- Approved mockup source read in full: `~/workspace/ts-spaces/ying-yu-yue-du-qi-ye-mian-she-ji-gao/index.html` — palette (paper #fdfaf3, accent #a05c2c, terra #b96f45, sage #7d8b6f), Source Serif 4 / Noto Serif SC / Noto Sans SC type, bookshelf tabs + cover grid, immersive reader, bottom bar with exactly 目录/设置/笔记本， explanation card order （原句→翻译→重点词组→例句）, notebook right column ~30%, two-column settings sheet, review page with 4 rating buttons. Its two watercolor illustrations `assets/cafe.jpg` and `assets/street.jpg` (verified JPEG 1920×1280 via `gm identify`) are copied into this artifact's `client/src/assets/` and reused for the Penang textbook, same style as the approved稿.

## Tested sources
### Local artifact DB (ctx.db) + server actions
**Used by**: getLibrary, getBook, saveProgress, listMarks, addMark, removeMark, rateMark, saveSettings, importBook, populateLibrary
**Test command**: starter scaffold read (`server/src/actions.ts`, `server/src/schema.ts`, `drizzle/0001_initial.sql` are the untouched template); full action surface will be exercised via `artifact.invoke_action` against the sandbox DB during Verify
**Sample output**: template entries table only; to be replaced by books / progress / marks / settings tables via a new migration
**Processing**: book content stored as structured JSON per book (chapters → paragraphs → sentences with stable ids, cn translation, phrases[{en,cn}], examples[{en,cn}], illustration keys); marks store source (book/chapter/sentence id) + added_date; review state = stage index + due_date

### Build-time illustrations (owned bytes)
**Used by**: reader chapter figures + photo covers
**Test command**: `gm identify cafe.jpg street.jpg` in the mockup Space assets → both JPEG 1920×1280, accepted and copied in
**Processing**: two more watercolor illustrations in the same style (wet market, Penang street transport) generated with media.generate_image into `client/src/assets/`; no remote image URLs rendered

### Storyboard panels + redesigned covers (2026-11-11 edit)
**User direction (verbatim brief)**: AI 教材要动漫式分镜对话（气泡可点开读）、书架与封面重做、讲解卡词组补词性（「磁性」按既定纠正读作词性）并重排解释版式
**New generated art** (media.generate_image → `client/src/assets/`, all verified JPEG, text-free, opened and checked): `airport.jpg` 1920×1280 (Penang Ch.1 panel — arrival), `lobby.jpg` 1920×1280 (Ch.1 panel — Mei with iced tea), `counter.jpg` 1920×1280 (kopitiam Ch.3 panels — Uncle Lim pouring coffee), `alice-cover.jpg` 1280×1920 (Alice cover art). Existing `bus.webp` reused as Getting Around Town cover + its panel section; `airport.jpg` doubles as the airport textbook's cover
**Content model**: `Chapter.panels?: Panel[]` (img key + lines[{sentenceId, speaker?, side?, say?}]); every panel line references a prose sentence id in the same chapter — one source of truth for card/marks/review. Phrase objects gained `pos` （词性/短语类型）, hand-labelled for all ~120 phrases in the 48 seed sentences (single words n./v./adj./adv./prep., phrases 动词短语/名词短语/介词短语/习语/口语句型 etc.); zod keeps `pos` optional so user-imported books without it still parse
**Seed refresh**: populateLibrary now upserts the 4 built-in books by id (content + cover fields) so existing installs receive new editions (panels, POS tags, covers); imported books, progress, marks, settings untouched. Client calls it once per app load; also declared as post_submit_action

## Long-term data behavior
- **Refresh policy**: none; all data is user-local state in app.db (built-in books seeded/refreshed via populateLibrary upsert of the 4 seed ids only; imports and user marks/progress/settings never overwritten)
- **Growth**: marks grow as the user collects sentences/phrases/examples; imported books append rows
- **Ordering**: books by sort_order; notebook = today's marks newest first; review queue = due_date ≤ today, oldest due first
- **Time semantics**: `today` computed in Asia/Kuala_Lumpur (Intl.DateTimeFormat with timeZone) both client- and server-side; notebook filters added_date = today (KL); review ladder intervals +1/+3/+7/+14/+30/+60 days applied to due_date by rating （忘记→今天再来/stage 归零， 困难→+1 天， 记得→阶梯进一格， 很熟→阶梯进两格）

## Rejected approaches
- **Tried**: reusing any earlier functional implementation (GPT version or the rejected first rebuild)
  **Why rejected**: user explicitly rejected both and forbade using them as references; this build follows only the approved static mockups + the functional spec in the handoff
- **Tried**: real-time AI explanation generation while reading
  **Why rejected**: user's confirmed product rule — all explanations are pre-generated with the book content; reading never calls a live model
