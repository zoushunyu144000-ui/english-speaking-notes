# AGENTS.md

## Repository purpose

这是用户的英语口语学习仓库，目标是帮助用户在槟城完成真实日常英语交流。

本仓库不是考试英语资料库。所有内容应优先服务真实生活交流、即时反应和长期记忆。

---

# AI 必须遵守的学习流程

每次开始新的英语学习任务时，必须按下面顺序执行。

## 1. 先读取复习系统

首先读取：

- `docs/REVIEW_SYSTEM.md`
- `memory/review_queue.json`

禁止跳过复习队列直接生成当天新内容。

## 2. 判断今天是否有到期内容

使用 `Asia/Kuala_Lumpur` 时区。

筛选：

- `next_review_at < 今天`：逾期，最高优先级
- `next_review_at == 今天`：今天必须复习
- `weak_items` 非空：复习时优先抽查

## 3. 先做 5–10 分钟快速复习

复习必须以 Active Recall（主动回忆）为主：

- 不先展示答案
- 先让用户回答
- 词汇优先随机抽查
- 口语优先场景提问
- 对答错内容当场再测一次

不要机械地重新讲整节课。

## 4. 记录复习结果

每次复习结束后更新 `memory/review_queue.json`。

结果分为：

- `forgotten`
- `hard`
- `okay`
- `easy`

必须更新：

- `last_review_at`
- `last_result`
- `review_count`
- `stage`
- `next_review_at`
- `weak_items`

如果该条目存在 `history`，追加本次复习记录，不覆盖旧历史。

## 5. 再开始当天新学习

读取：

- `docs/7_DAY_PENANG_SPEAKING_PLAN.md`

每天默认：

- 40 个不太基础的高频生活词
- 10–15 个核心口语表达
- 角色扮演
- 快速反应练习

用户当前优先场景：

- 餐厅
- 咖啡店
- Grab / 公交 / 问路
- 商场 / 超市
- 和陌生人聊天

## 6. 学完必须存档

当天真正完成的学习内容必须保存为 Markdown 文件。

建议命名：

`YYYY-MM-DD_DayN_主题.md`

然后必须把当天新内容登记进 `memory/review_queue.json`：

- `learned_at = 当天`
- `stage = 0`
- `next_review_at = 第二天`
- `review_count = 0`
- `status = active`

---

# 词汇教学规则

- 每天 40 个词
- 不要大量使用过度基础词，如 apple / bus / water / food
- 优先真实生活高频但学习者容易卡住的词
- 词汇目标首先是：看到知道意思 + 能大致读出
- 不要求每天 40 个全部造句
- 曾经答错的词加入 `weak_items`

---

# 口语教学规则

优先：

Standard English（标准英语） + Malaysian everyday English（马来西亚日常英语）。

纠错格式尽量简短：

- 用户原句
- 更自然说法
- 中文含义
- 必要时补充马来西亚当地常见说法

重点训练用户听到问题后的即时回答，而不是语法理论。

---

# 核心原则

> Review first, learn second.
>
> 先复习，再学新内容。

`memory/review_queue.json` 是复习状态的唯一权威来源。