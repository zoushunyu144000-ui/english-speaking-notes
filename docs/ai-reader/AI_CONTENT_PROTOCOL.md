# AI 教材与外部助手数据协议（设计草案）

版本 v0.1 · 2026-11-11
注意：**本文件是开发建议/最小数据协议草案，尚非已上线 API 或已确认数据库表。**

## A. 设计边界
1. “读书时零实时 LLM 依赖”：AI 在 **prepare / publish** 阶段将教材结构化并生成讲解；阅读操作只查本地数据/缓存。
2. 阅读数据归用户所有：本地优先、可导入导出。
3. 各家 AI（GPT/Claude/Gemini）连接必须有 **显式授权**，只能看获授权的用户数据。
4. **没有图片生成能力的模型也能生成教材**；图片、音频是可选增强资源。
5. 读写操作遵循版本与事务：不能将用户已记的笔记覆盖掉，也不能悄悄改写原书。

## B. 建议的教材 JSON（示例，不是固定最终实现）
```json
{
  "schema_version": "0.1",
  "book_id": "book-penang-life",
  "title": "A Day in Penang",
  "source": { "kind": "ai-generated", "attribution": null, "license": null },
  "language": "en",
  "native_language": "zh-CN",
  "level": "A2",
  "chapters": [
    {
      "id": "ch01",
      "title": "At the Café",
      "illustrations": [
        {"id": "scene01", "asset": "assets/scene01.webp", "alt": "A café in Penang"}
      ],
      "sentences": [
        {
          "id": "s01",
          "text": "I'm getting used to speaking English with strangers.",
          "translation": "我正在逐渐习惯和陌生人说英语。",
          "explanation": "get used to 后面接名词或动词 -ing 形式。",
          "audio": {"voice": "en-US-default", "asset": "audio/s01.mp3"},
          "key_phrases": [
            {
              "id": "p01",
              "text": "get used to",
              "meaning": "逐渐习惯于……",
              "audio_asset": "audio/p01.mp3"
            },
            {
              "id": "p02",
              "text": "strangers",
              "meaning": "陌生人",
              "audio_asset": "audio/p02.mp3"
            }
          ],
          "real_life_usage": {
            "text": "I'm getting used to it.",
            "translation": "我慢慢习惯了。",
            "context": "回答自己是否适应新生活时可以这样说"
          }
        }
      ],
      "dialogue_scenes": [
        {
          "id": "dialogue01",
          "illustration_asset": "assets/dialogue01.webp",
          "bubbles": [
            {"id": "b01", "speaker": "barista", "text": "What can I get for you?", "sentence_id": "s02", "x": 0.3, "y": 0.2}
          ]
        }
      ]
    }
  ]
}
```
- `audio.asset` 是资源定位符，**不把 TTS 音频当成每次都要重新生成**；缺失时可按策略生成/缓存。
- 词组本体可跨章节去重，但收藏仍需存**所在章节/原句**。
- 气泡位置属于 UI 元数据，英文文本仍是可交互的文本层，不烧到图片里。

## C. 建议的学习记录（必须与教材内容解耦）
```json
{
  "user_profile": {
    "target_level": "A2",
    "learning_goals": ["daily conversations"],
    "accent_preference": "en-US",
    "custom_ai_provider": null
  },
  "reading_state": [
    {"book_id": "book-penang-life", "chapter_id": "ch01", "position": "s01", "updated_at": "2026-11-11T08:00:00+08:00"}
  ],
  "saved_items": [
    {
      "id": "save01",
      "kind": "phrase",
      "text": "get used to",
      "meaning": "逐渐习惯于……",
      "book_id": "book-penang-life",
      "chapter_id": "ch01",
      "sentence_id": "s01",
      "created_at": "2026-11-11T08:00:00+08:00"
    }
  ],
  "chapter_feedback": [
    {
      "book_id": "book-penang-life",
      "chapter_id": "ch01",
      "difficulty": "hard",
      "weaknesses": ["grammar"],
      "notes": "想多看一些真实咖啡馆对话"
    }
  ],
  "reviews": [
    {
      "saved_item_id": "save01",
      "stage": 0,
      "next_review_at": "2026-11-12",
      "history": []
    }
  ]
}
```
- 示例日期/水平等只是测试样例，不表示对用户的真实水平判断。
- 除复习历史外，记录用户主观难度、收藏与重复朗读等辅助证据；**不把一次点击当作能力结论**。
- 版本升级必须保留旧数据，可有可恢复的迁移方案。

## D. 外部 AI 应有的操作（命名为候选，不是现成接口）
**读取范围**：
- `get_learning_profile()`：水平、兴趣与偏好。
- `get_reading_progress()`：书籍/章节/进度。
- `get_review_summary()`：复习统计、薄弱项。
- `get_chapter_feedback(book_id, chapter_id)`：章节自评。
- `get_book_schema()`：教材所需的结构与生成规则。

**写入范围（需用户授权）**：
- `propose_study_plan(...)`：提出计划变更；建议先预览可接受/可撤销。
- `create_book_draft(...)`：上传新教材草稿，不直接覆盖现有书籍。
- `publish_book_draft(draft_id)`：书籍校验后发布。
- `append_chapter(...)`：追加新章，需确保不改动已读原章。
- `attach_prepared_explanations(...)`：补充预制句子注释/词组。
- `attach_scene_assets(...)`：增加合法插画、可点对话气泡资源。

**谨慎/禁止**：
- 不向 AI 默认开放全量云盘、账号支付信息或其他用户数据；
- 不由模型无审查地删除收藏、清空复习历史、改写用户导入原书；
- 不能将 GitHub 仓库误当成生产数据库/每个用户的内容同步通道。

## E. 技术建议（待实际验证）
- 客户端：响应式 Web App；本地可选 IndexedDB 缓存教材、阅读进度与笔记。
- AI 接入：受认证 Web API + MCP 桥接，具体取决于各 AI 客户端支持情况。
- 备份：会员 Google Drive OAuth / 应用文件范围；iCloud Drive 可先采用导入/导出，自动备份需核实可实现路径。
- 音频：自然神经网络 TTS，默认 en-US，语音资源本地缓存/预制，后期允许用户设置音色和口音。
- 存储：尽量把课本、注释、用户笔记、复习状态、图片/音频拆分，便于迁移和同步。
- 所有云同步、AI 读写权限都须防止越权访问和数据泄露。

## F. 教材制作流水线
```text
用户需求/学习记录 + 授权教材
          ↓
AI 生成/推荐/调整课程大纲
          ↓
生成正文 / 分句 / 翻译 / 重点词组 / 日常用语
          ↓
（可选）场景图 + 互动对话气泡
          ↓
（可选）预制并缓存句子/词组音频
          ↓
结构化校验、版权检查、预览
          ↓
发布到书架 → 本地阅读 → 点读/收藏 → 章节反馈
          ↓
复习记录与反馈 → 下轮 AI 调整
```
