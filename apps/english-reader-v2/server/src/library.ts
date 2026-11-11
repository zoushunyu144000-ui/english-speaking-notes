// Seed library: books whose explanations are fully pre-made at build time.
// Reading never calls a live model — every sentence already carries its
// Chinese translation, key phrases (each with a part-of-speech tag), and at
// least one example sentence.
//
// AI textbooks can also carry a storyboard (分镜) version of a chapter:
// panels of scene art with tappable speech bubbles. Every bubble line points
// at a sentence id that also exists in the chapter's prose blocks, so the
// explanation card, notebook marks, and review all share one data source.

export type Phrase = { en: string; cn: string; pos?: string };
export type Example = { en: string; cn: string };
export type Sentence = {
  id: string;
  en: string;
  cn: string;
  phrases: Phrase[];
  examples: Example[];
};
export type Block =
  | { type: "p"; sentences: Sentence[] }
  | { type: "figure"; img: string; caption: string; alt: string };
/** One speech-bubble line inside a storyboard panel. `say` is the exact
 *  spoken excerpt shown in the bubble when it differs from the full
 *  sentence (narration trimmed away); the card always shows the sentence. */
export type PanelLine = {
  sentenceId: string;
  speaker?: string;
  side?: "left" | "right";
  say?: string;
};
export type Panel = { img: string; alt: string; lines: PanelLine[] };
export type Chapter = {
  title: string;
  kicker: string;
  blocks: Block[];
  panels?: Panel[];
};
export type BookContent = { chapters: Chapter[] };

export type SeedBook = {
  id: string;
  category: "ai_textbook" | "ai_found" | "textbook";
  title: string;
  subtitle: string;
  kicker: string;
  badge: string | null;
  coverKind: "image" | "gradient";
  coverImg: string | null;
  coverFrom: string;
  coverTo: string;
  sortOrder: number;
  content: BookContent;
};

function s(
  id: string,
  en: string,
  cn: string,
  phrases: [string, string, string][],
  examples: [string, string][],
): Sentence {
  return {
    id,
    en,
    cn,
    phrases: phrases.map(([pEn, pCn, pPos]) => ({ en: pEn, cn: pCn, pos: pPos })),
    examples: examples.map(([eEn, eCn]) => ({ en: eEn, cn: eCn })),
  };
}

const penang: SeedBook = {
  id: "a-day-in-penang",
  category: "ai_textbook",
  title: "A Day in Penang",
  subtitle: "Everyday English · Level B1",
  kicker: "AI Textbook",
  badge: "按我的程度定制 · 真实场景",
  coverKind: "image",
  coverImg: "cafe",
  coverFrom: "#b96f45",
  coverTo: "#8a4f1d",
  sortOrder: 1,
  content: {
    chapters: [
      {
        kicker: "Chapter One",
        title: "First Morning in George Town",
        blocks: [
          {
            type: "p",
            sentences: [
              s(
                "pg-c1-s1",
                "The plane landed just after sunrise, and the warm Penang air met me at the door of the airport.",
                "飞机在日出后不久降落，槟城温暖的空气在机场门口迎面而来。",
                [
                  ["just after sunrise", "日出之后不久；just after 表示「刚过……就」", "时间短语"],
                  ["met me at the door", "在门口迎接我；meet 在这里是「迎面而来」的意思", "动词短语"],
                ],
                [
                  ["The train arrived just after sunrise, and the cool mountain air met us at the station door.", "火车在日出后不久到达，山间清凉的空气在车站门口迎面而来。"],
                ],
              ),
              s(
                "pg-c1-s2",
                "Outside, palm trees stood in a line along the road, and every sign seemed to speak three languages at once.",
                "外面，棕榈树沿着马路排成一排，每块招牌好像同时在说三种语言。",
                [
                  ["stood in a line", "排成一排；stand in a line 是排队的常用说法", "动词短语"],
                  ["at once", "同时，一下子；three languages at once = 同时三种语言", "adv. 副词短语"],
                ],
                [
                  ["Tall coconut trees stood in a line along the beach.", "高高的椰子树沿着海滩排成一排。"],
                ],
              ),
              s(
                "pg-c1-s3",
                "My friend Mei had promised to meet me at the hotel, so I took a taxi into George Town.",
                "我的朋友 Mei 答应了在酒店和我碰面，所以我打车进了乔治市。",
                [
                  ["had promised to", "（之前）答应了要……；promise to do 是固定搭配", "动词短语"],
                  ["took a taxi into", "打车去到……里面；into 表示进入市区", "动词短语"],
                ],
                [
                  ["He had promised to call me at eight, so I waited at home.", "他答应了八点给我打电话，所以我在家等着。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "pg-c1-s4",
                "The taxi driver, a cheerful man with a grey moustache, asked where I was from.",
                "出租车司机是个留着灰胡子的开朗男人，他问我是哪里人。",
                [
                  ["a cheerful man", "一个开朗的人；cheerful 形容人很阳光、爱笑", "名词短语"],
                  ["where I was from", "我是哪里人；问老家/来自哪里的自然说法", "名词性从句"],
                ],
                [
                  ["A cheerful woman with a red scarf showed us the way.", "一位戴着红围巾的开朗女士给我们指了路。"],
                ],
              ),
              s(
                "pg-c1-s5",
                "“First time in Penang?” he said, smiling into the mirror. “Then you must eat well — eating is our national sport.”",
                "「第一次来槟城？」他对着后视镜笑着说。「那你可得好好吃——吃可是我们的全民运动。」",
                [
                  ["First time in…?", "第一次来……吗？口语里省掉主语的问法", "口语问句"],
                  ["national sport", "全民运动；这里是幽默说法，指全民最热衷的事", "名词短语"],
                ],
                [
                  ["“First time in Malaysia?” she asked. “Then you must try the durian.”", "「第一次来马来西亚？」她问。「那你一定要试试榴莲。」"],
                ],
              ),
              s(
                "pg-c1-s6",
                "We drove past rows of old shophouses, their shutters painted green, blue, and faded red.",
                "我们开过一排排老店屋，它们的百叶窗漆成了绿色、蓝色和褪色的红。",
                [
                  ["drove past", "开车经过；pass 是「经过」", "动词短语"],
                  ["rows of", "一排排的；row 是排、行", "名词短语"],
                  ["faded red", "褪了色的红；fade 是褪色", "形容词短语"],
                ],
                [
                  ["We walked past rows of small cafés, their doors painted yellow.", "我们走过一排排小咖啡馆，它们的门漆成了黄色。"],
                ],
              ),
            ],
          },
          {
            type: "figure",
            img: "street",
            caption: "Heritage shophouses along a quiet street in George Town.",
            alt: "水彩插图：乔治市老店屋街道",
          },
          {
            type: "p",
            sentences: [
              s(
                "pg-c1-s7",
                "At the hotel, Mei was already waiting in the lobby, holding two cups of iced tea.",
                "在酒店，Mei 已经在大堂等着了，手里拿着两杯冰茶。",
                [
                  ["was already waiting", "已经在等着了；already 让「等」有了提前感", "动词短语"],
                  ["in the lobby", "在大堂；lobby 是酒店大堂", "介词短语"],
                ],
                [
                  ["My brother was already waiting at the gate, holding my umbrella.", "我弟弟已经在门口等着了，手里拿着我的伞。"],
                ],
              ),
              s(
                "pg-c1-s8",
                "“You must be tired after the long flight,” she said. “Rest first — the city can wait until tomorrow.”",
                "「长途飞行之后你一定累了，」她说。「先休息吧——这座城市可以等到明天。」",
                [
                  ["must be tired", "一定累了；must be 是很有把握的推测", "动词短语"],
                  ["can wait", "可以等；事情不急时的口头语", "动词短语"],
                ],
                [
                  ["You must be hungry after the long drive. Dinner can wait — eat something first.", "开了这么久车你一定饿了。晚饭可以等——先吃点东西。"],
                ],
              ),
            ],
          },
        ],
        panels: [
          {
            img: "airport",
            alt: "分镜画面：旅客拖着行李走出机场，棕榈树在晨光里排成一排",
            lines: [{ sentenceId: "pg-c1-s1" }, { sentenceId: "pg-c1-s2" }],
          },
          {
            img: "street",
            alt: "分镜画面：乔治市的老店屋街道",
            lines: [{ sentenceId: "pg-c1-s3" }, { sentenceId: "pg-c1-s4" }],
          },
          {
            img: "street",
            alt: "分镜画面：出租车开过一排排老店屋",
            lines: [
              {
                sentenceId: "pg-c1-s5",
                speaker: "出租车司机",
                side: "left",
                say: "First time in Penang? Then you must eat well — eating is our national sport.",
              },
              { sentenceId: "pg-c1-s6" },
            ],
          },
          {
            img: "lobby",
            alt: "分镜画面：Mei 在酒店大堂等着，手里拿着两杯冰茶",
            lines: [
              { sentenceId: "pg-c1-s7" },
              {
                sentenceId: "pg-c1-s8",
                speaker: "Mei",
                side: "right",
                say: "You must be tired after the long flight. Rest first — the city can wait until tomorrow.",
              },
            ],
          },
        ],
      },
      {
        kicker: "Chapter Two",
        title: "Morning at the Market",
        blocks: [
          {
            type: "p",
            sentences: [
              s(
                "pg-c2-s1",
                "Mei woke me at seven the next morning. “Come,” she said. “If we go late, all the good fish will be gone.”",
                "第二天早上七点 Mei 把我叫醒。「快来，」她说。「去晚了，好鱼就都没了。」",
                [
                  ["woke me", "把我叫醒；wake 的过去式是 woke", "动词短语"],
                  ["will be gone", "会被卖光、没有了；gone 表示已经没了的状态", "动词短语"],
                ],
                [
                  ["Wake me at six tomorrow — if we go late, the good seats will be gone.", "明天六点叫我——去晚了，好座位就没了。"],
                ],
              ),
              s(
                "pg-c2-s2",
                "The wet market was already alive with voices, bicycles, and the smell of fresh herbs.",
                "菜市场已经热闹起来了，到处是说话声、自行车，还有新鲜香草的气味。",
                [
                  ["alive with", "充满了……的生气；alive 在这里不是「活着」，是热闹起来", "形容词短语"],
                  ["the smell of", "……的气味；smell of fresh herbs 新鲜香草味", "名词短语"],
                ],
                [
                  ["By nine, the street was alive with music and children laughing.", "到了九点，街上已经满是音乐和孩子们的笑声。"],
                ],
              ),
              s(
                "pg-c2-s3",
                "Stalls stood shoulder to shoulder, piled high with bananas, mangosteens, and spiky durians.",
                "摊位一个挨着一个，堆满了香蕉、山竹和带刺的榴莲。",
                [
                  ["shoulder to shoulder", "肩并肩，挨得很紧", "习语"],
                  ["piled high with", "高高地堆满了……；pile 是堆", "动词短语"],
                  ["spiky", "带刺的、多刺的；spike 是尖刺", "adj. 形容词"],
                ],
                [
                  ["Books stood shoulder to shoulder on the old shelf.", "书一本挨一本立在旧书架上。"],
                ],
              ),
            ],
          },
          {
            type: "figure",
            img: "market",
            caption: "The wet market at Chowrasta, busy before eight in the morning.",
            alt: "水彩插图：槟城清晨的菜市场",
          },
          {
            type: "p",
            sentences: [
              s(
                "pg-c2-s4",
                "An auntie at the vegetable stall weighed a bundle of kangkung and dropped an extra handful into my bag.",
                "蔬菜摊的阿姨称了一捆空心菜，又往我的袋子里多放了一把。",
                [
                  ["a bundle of", "一捆；bundle 是一束、一捆", "名词短语"],
                  ["an extra handful", "额外多加的一把；handful 是一把的量", "名词短语"],
                ],
                [
                  ["She bought a bundle of flowers and put an extra handful of rice into the pot.", "她买了一束花，又往锅里多加了一把米。"],
                ],
              ),
              s(
                "pg-c2-s5",
                "“For you, special price,” she laughed. “New face, must take care.”",
                "「给你个特别价，」她笑着说。「新面孔嘛，要照顾一下。」",
                [
                  ["special price", "特别优惠价；市场里最常听到的说法", "名词短语"],
                  ["must take care", "要照顾一下；这里的 take care 是关照、不是保重", "动词短语"],
                ],
                [
                  ["“For you, special price — last one today!” the seller called out.", "「给你特别价——今天最后一个了！」摊主喊道。"],
                ],
              ),
              s(
                "pg-c2-s6",
                "Mei taught me to ask, “How much is this?” and to smile before asking for a discount.",
                "Mei 教我问「这个多少钱？」，还教我在讨价还价之前先微笑。",
                [
                  ["taught me to ask", "教我怎么问；teach somebody to do 教某人做某事", "动词短语"],
                  ["ask for a discount", "要求打折；discount 是折扣", "动词短语"],
                ],
                [
                  ["My grandmother taught me to smile before asking for anything.", "我奶奶教我，开口求人之前先微笑。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "pg-c2-s7",
                "At the fish stall, silver fish lay on crushed ice, their eyes still bright and clear.",
                "在鱼摊，银色的鱼躺在碎冰上，眼睛还又亮又清澈。",
                [
                  ["lay on", "躺在……上；lie 的过去式是 lay", "动词短语"],
                  ["crushed ice", "碎冰；crush 是压碎", "名词短语"],
                  ["bright and clear", "又亮又清澈；挑新鲜鱼的标志", "形容词短语"],
                ],
                [
                  ["Fresh prawns lay on crushed ice at the night market.", "新鲜的虾躺在夜市的碎冰上。"],
                ],
              ),
              s(
                "pg-c2-s8",
                "We bought fish, prawns, and a bag of limes, then carried everything home for lunch.",
                "我们买了鱼、虾和一袋酸柑，然后把所有东西都提回家做午饭。",
                [
                  ["a bag of", "一袋；买东西时最常用的量词", "名词短语"],
                  ["carried everything home", "把所有东西提回家；carry 是提、搬", "动词短语"],
                ],
                [
                  ["We bought bread, eggs, and a bag of oranges for breakfast.", "我们买了面包、鸡蛋和一袋橙子做早餐。"],
                ],
              ),
            ],
          },
        ],
      },
      {
        kicker: "Chapter Three",
        title: "Morning at the Kopitiam",
        blocks: [
          {
            type: "p",
            sentences: [
              s(
                "pg-c3-s1",
                "The morning sun was already warm when I pushed open the green wooden doors of the old kopitiam on Lebuh Campbell.",
                "我推开 Lebuh Campbell 那家老咖啡馆的绿色木门时，早晨的太阳已经暖和起来了。",
                [
                  ["pushed open", "推开；pushed open the door 推开门", "动词短语"],
                  ["was already warm", "已经暖和起来了；already 表示比预想的早", "动词短语"],
                ],
                [
                  ["She pushed open the blue door of the little bookshop.", "她推开小书店的蓝门。"],
                ],
              ),
              s(
                "pg-c3-s2",
                "Inside, the ceiling fans turned slowly, and the air smelled of toasted bread and strong coffee.",
                "里面，吊扇慢慢地转着，空气里是烤面包和浓咖啡的味道。",
                [
                  ["ceiling fans", "吊扇；ceiling 是天花板", "n. 名词"],
                  ["smelled of", "有……的气味；smell of 闻起来像", "动词短语"],
                  ["toasted bread", "烤面包；toast 作动词是烤", "名词短语"],
                ],
                [
                  ["The kitchen smelled of ginger and hot oil.", "厨房里是姜和热油的味道。"],
                ],
              ),
            ],
          },
          {
            type: "figure",
            img: "cafe",
            caption: "The old kopitiam on Lebuh Campbell, just after eight in the morning.",
            alt: "水彩插图：槟城老咖啡馆的柜台与灯笼",
          },
          {
            type: "p",
            sentences: [
              s(
                "pg-c3-s3",
                "Uncle Lim waved at me from behind the counter. “The usual?” he asked.",
                "Lim 叔在柜台后面朝我挥手。「还是老样子？」他问。",
                [
                  ["waved at me", "朝我挥手；wave at somebody", "动词短语"],
                  ["behind the counter", "在柜台后面；counter 是柜台", "介词短语"],
                  ["The usual?", "老样子？常客点单时最省事的一句", "口语问句"],
                ],
                [
                  ["The nurse waved at me from behind the desk. “Same time next week?” she asked.", "护士在桌子后面朝我挥手。「下周同一时间？」她问。"],
                ],
              ),
              s(
                "pg-c3-s4",
                "I nodded, then changed my mind. “Could I have an iced coffee, please — less sweet, and in a takeaway cup?”",
                "我点了点头，然后改了主意。「请给我一杯冰咖啡，少糖，用外带杯装，好吗？」",
                [
                  ["changed my mind", "改变主意；改主意就说 change my mind", "动词短语"],
                  ["iced coffee", "冰咖啡；本地也常说 kopi peng", "n. 名词短语"],
                  ["less sweet", "少糖；点饮料最常用的口语说法", "形容词短语"],
                  ["takeaway cup", "外带杯；也可以说 to go", "n. 名词短语"],
                ],
                [
                  ["Could I have a teh tarik, less sweet, to go, please?", "请给我一杯拉茶，少糖，打包带走。—— 同一个句型，换种饮料就能用。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "pg-c3-s5",
                "He laughed. “Less sweet — good, good. Too much sugar is no good.”",
                "他笑了。「少糖——好，好。糖太多可不好。」",
                [
                  ["too much", "太多；后面接不可数的东西，如 sugar、water", "限定词短语"],
                  ["no good", "不好、没好处；口语里很常见", "形容词短语"],
                ],
                [
                  ["Too much coffee is no good for sleep.", "咖啡喝太多对睡眠不好。"],
                ],
              ),
              s(
                "pg-c3-s6",
                "He poured the dark coffee over a tall glass of ice, and the ice cracked softly as the coffee ran down.",
                "他把深色的咖啡倒在一大杯冰上，咖啡流下去的时候，冰轻轻地裂开了。",
                [
                  ["poured … over", "把……倒在……上面；pour 是倒、注", "动词短语"],
                  ["cracked softly", "轻轻地裂开；crack 是裂开，softly 是轻轻地", "动词短语"],
                  ["ran down", "往下流淌；run 在这里是流动", "动词短语"],
                ],
                [
                  ["She poured the hot tea over a glass of ice and lemon.", "她把热茶倒在一杯冰和柠檬上。"],
                ],
              ),
              s(
                "pg-c3-s7",
                "My toast arrived with kaya and a soft-boiled egg, still warm in its shell.",
                "我的烤面包上桌了，配着咖椰酱和一颗半熟蛋，蛋壳还带着热气。",
                [
                  ["arrived", "上桌、送到；点的食物用 arrive 很自然", "v. 动词"],
                  ["soft-boiled egg", "半熟蛋；壳里还是嫩嫩的", "n. 名词短语"],
                  ["still warm", "还热着；still 在这里是「仍然」", "形容词短语"],
                ],
                [
                  ["The soup arrived still warm, with bread on the side.", "汤端上来时还热着，旁边配了面包。"],
                ],
              ),
              s(
                "pg-c3-s8",
                "“Eat slowly,” said Mei. “In Penang, breakfast is not a race.”",
                "「慢慢吃，」Mei 说。「在槟城，早餐不是比赛。」",
                [
                  ["eat slowly", "慢慢吃；慢慢吃就说 eat slowly", "动词短语"],
                  ["not a race", "不是比赛；意思是不用赶时间", "名词短语"],
                ],
                [
                  ["“Walk slowly,” he said. “This garden is not a race.”", "「慢慢走，」他说。「这花园又不是比赛。」"],
                ],
              ),
            ],
          },
        ],
        panels: [
          {
            img: "cafe",
            alt: "分镜画面：老咖啡馆的绿色木门被推开",
            lines: [{ sentenceId: "pg-c3-s1" }, { sentenceId: "pg-c3-s2" }],
          },
          {
            img: "counter",
            alt: "分镜画面：Lim 叔在柜台后面朝我挥手",
            lines: [
              {
                sentenceId: "pg-c3-s3",
                speaker: "Lim 叔",
                side: "left",
                say: "The usual?",
              },
            ],
          },
          {
            img: "counter",
            alt: "分镜画面：我在柜台前点冰咖啡",
            lines: [
              {
                sentenceId: "pg-c3-s4",
                speaker: "我",
                side: "right",
                say: "Could I have an iced coffee, please — less sweet, and in a takeaway cup?",
              },
            ],
          },
          {
            img: "counter",
            alt: "分镜画面：Lim 叔笑着回应",
            lines: [
              {
                sentenceId: "pg-c3-s5",
                speaker: "Lim 叔",
                side: "left",
                say: "Less sweet — good, good. Too much sugar is no good.",
              },
            ],
          },
          {
            img: "counter",
            alt: "分镜画面：Lim 叔把咖啡倒在冰上，烤面包和半熟蛋也上桌了",
            lines: [{ sentenceId: "pg-c3-s6" }, { sentenceId: "pg-c3-s7" }],
          },
          {
            img: "cafe",
            alt: "分镜画面：Mei 陪我慢慢吃早餐",
            lines: [
              {
                sentenceId: "pg-c3-s8",
                speaker: "Mei",
                side: "right",
                say: "Eat slowly. In Penang, breakfast is not a race.",
              },
            ],
          },
        ],
      },
    ],
  },
};

const aroundTown: SeedBook = {
  id: "getting-around-town",
  category: "ai_textbook",
  title: "Getting Around Town",
  subtitle: "Buses, Grab & Directions",
  kicker: "AI Textbook",
  badge: "按我的程度定制 · 真实场景",
  coverKind: "image",
  coverImg: "bus",
  coverFrom: "#7d8b6f",
  coverTo: "#55663f",
  sortOrder: 2,
  content: {
    chapters: [
      {
        kicker: "Chapter One",
        title: "The Bus to Gurney Drive",
        blocks: [
          {
            type: "p",
            sentences: [
              s(
                "gt-c1-s1",
                "On my third day, I decided to explore the city on my own.",
                "第三天，我决定自己一个人逛逛这座城市。",
                [
                  ["on my own", "独自、靠自己；on one's own 是固定说法", "介词短语"],
                  ["decided to", "决定去做……；decide to do", "动词短语"],
                ],
                [
                  ["Last Sunday, I decided to cook dinner on my own.", "上周日，我决定自己做一顿晚饭。"],
                ],
              ),
              s(
                "gt-c1-s2",
                "Mei drew me a simple map and circled the bus stop twice.",
                "Mei 给我画了一张简单的地图，还把公交站圈了两遍。",
                [
                  ["drew me a map", "给我画了张地图；draw 的过去式是 drew", "动词短语"],
                  ["circled", "圈出来；circle 作动词是画圈标出", "v. 动词"],
                ],
                [
                  ["He drew me a small map and circled the station.", "他给我画了张小地图，把车站圈了出来。"],
                ],
              ),
              s(
                "gt-c1-s3",
                "“Take the 101,” she said. “It goes all the way along the sea.”",
                "「坐 101 路，」她说。「它一路沿着海边走。」",
                [
                  ["Take the 101", "坐 101 路（车）；报线路就说 take the + 号码", "口语句型"],
                  ["all the way", "一路上、全程；强调走到底", "adv. 副词短语"],
                  ["along the sea", "沿着海边；along 是沿着", "介词短语"],
                ],
                [
                  ["Take the number 5 bus — it goes all the way to the airport.", "坐 5 路车吧——它一直接到机场。"],
                ],
              ),
            ],
          },
          {
            type: "figure",
            img: "bus",
            caption: "The 101 bus pulling in at a stop on Jalan Burma.",
            alt: "水彩插图：乔治市街道上的公交车和三轮车",
          },
          {
            type: "p",
            sentences: [
              s(
                "gt-c1-s4",
                "At the stop, an old man nodded at my map. “First time taking the bus?” he asked.",
                "在车站，一位老人对着我的地图点了点头。「第一次坐公交？」他问。",
                [
                  ["nodded at", "对着……点头；nod 是点头", "动词短语"],
                  ["taking the bus", "坐公交；乘车用 take the bus", "动词短语"],
                ],
                [
                  ["The guard nodded at my ticket and opened the gate.", "保安对着我的票点了点头，打开了门。"],
                ],
              ),
              s(
                "gt-c1-s5",
                "When the bus came, I tapped my card and found a seat by the window.",
                "公交来了，我刷了卡，找了个靠窗的座位。",
                [
                  ["tapped my card", "刷了卡；tap 是轻触、刷卡", "动词短语"],
                  ["by the window", "靠窗；by 在这里是「在……旁边」", "介词短语"],
                ],
                [
                  ["She tapped her card and found a seat by the door.", "她刷了卡，找了个靠门的座位。"],
                ],
              ),
              s(
                "gt-c1-s6",
                "The driver called out the names of the big stops, so that visitors would not miss theirs.",
                "司机大声报出大站的名字，这样游客就不会坐过站了。",
                [
                  ["called out", "大声喊出、报出；call out 是喊出来", "动词短语"],
                  ["miss theirs", "错过自己的（那一站）；miss 是错过", "动词短语"],
                ],
                [
                  ["The teacher called out our names so that nobody would miss the bus.", "老师大声点我们的名字，这样就没人会错过车了。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "gt-c1-s7",
                "Half an hour later, the sea appeared on my left, bright and calm in the late morning light.",
                "半小时后，大海出现在我的左边，在上午近午的光里又亮又平静。",
                [
                  ["half an hour later", "半小时后；later 是……之后", "时间短语"],
                  ["appeared", "出现了；appear 是出现、显现", "v. 动词"],
                  ["calm", "平静的；海面平静也用 calm", "adj. 形容词"],
                ],
                [
                  ["Ten minutes later, the mountains appeared in front of us.", "十分钟后，群山出现在我们面前。"],
                ],
              ),
              s(
                "gt-c1-s8",
                "I pressed the bell, thanked the driver, and stepped down into the warm sea wind.",
                "我按了下车铃，向司机道谢，走下车迎着温暖的海风。",
                [
                  ["pressed the bell", "按了铃；下车铃就说 press the bell", "动词短语"],
                  ["stepped down", "走下车、迈步下来；step 是迈步", "动词短语"],
                ],
                [
                  ["She pressed the bell, thanked the driver, and stepped down with her bags.", "她按了铃，向司机道谢，提着包走下车。"],
                ],
              ),
            ],
          },
        ],
        panels: [
          {
            img: "bus",
            alt: "分镜画面：Mei 给我画地图，指着 101 路公交",
            lines: [
              { sentenceId: "gt-c1-s1" },
              { sentenceId: "gt-c1-s2" },
              {
                sentenceId: "gt-c1-s3",
                speaker: "Mei",
                side: "right",
                say: "Take the 101. It goes all the way along the sea.",
              },
            ],
          },
          {
            img: "bus",
            alt: "分镜画面：车站的老人看着我的地图",
            lines: [
              {
                sentenceId: "gt-c1-s4",
                speaker: "车站的老人",
                side: "left",
                say: "First time taking the bus?",
              },
              { sentenceId: "gt-c1-s5" },
            ],
          },
          {
            img: "bus",
            alt: "分镜画面：公交沿着海边开，大海出现在左边",
            lines: [
              { sentenceId: "gt-c1-s6" },
              { sentenceId: "gt-c1-s7" },
              { sentenceId: "gt-c1-s8" },
            ],
          },
        ],
      },
    ],
  },
};

const alice: SeedBook = {
  id: "alice-in-wonderland",
  category: "ai_found",
  title: "Alice's Adventures in Wonderland",
  subtitle: "英文版节选 · Lewis Carroll",
  kicker: "Found for You",
  badge: null,
  coverKind: "image",
  coverImg: "alice-cover",
  coverFrom: "#43607e",
  coverTo: "#2e4358",
  sortOrder: 3,
  content: {
    chapters: [
      {
        kicker: "Chapter 1 · 节选",
        title: "Down the Rabbit-Hole",
        blocks: [
          {
            type: "p",
            sentences: [
              s(
                "al-c1-s1",
                "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.",
                "爱丽丝开始对坐在姐姐身边、坐在河岸上无所事事感到非常厌倦。",
                [
                  ["get tired of", "对……感到厌倦；tired of 是固定搭配", "动词短语"],
                  ["nothing to do", "无事可做；没什么可做的", "名词短语"],
                ],
                [
                  ["I am getting tired of waiting here with nothing to do.", "我等在这里无所事事，已经等烦了。"],
                ],
              ),
              s(
                "al-c1-s2",
                "Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.",
                "她有一两次偷偷看了一眼姐姐正在读的书，但书里没有图画，也没有对话。",
                [
                  ["once or twice", "一两次；不多的时候这样说", "adv. 副词短语"],
                  ["peeped into", "偷看了一眼；peep 是偷偷看", "动词短语"],
                ],
                [
                  ["He peeped into the box once or twice, but said nothing.", "他往箱子里偷看了一两眼，但什么也没说。"],
                ],
              ),
              s(
                "al-c1-s3",
                "“And what is the use of a book,” thought Alice, “without pictures or conversations?”",
                "「一本书，」爱丽丝想，「没有图画也没有对话，有什么用呢？」",
                [
                  ["what is the use of", "……有什么用；use 在这里是「用处」", "口语句型"],
                  ["without pictures", "没有图画；without 是没有", "介词短语"],
                ],
                [
                  ["What is the use of a map without street names?", "一张没有街道名字的地图有什么用？"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "al-c1-s4",
                "So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies.",
                "于是她在心里琢磨着，为了编一条雏菊链的乐趣，值不值得费劲起身去采雏菊。",
                [
                  ["in her own mind", "在她自己心里；mind 是心思", "介词短语"],
                  ["would be worth the trouble", "值得费这个劲；worth 是值得", "动词短语"],
                  ["picking the daisies", "采雏菊；pick 花果就是采、摘", "动词短语"],
                ],
                [
                  ["A long walk is worth the trouble when the view is this good.", "景色这么好的时候，走远路也值得。"],
                ],
              ),
              s(
                "al-c1-s5",
                "Suddenly, a White Rabbit with pink eyes ran close by her.",
                "突然，一只粉红眼睛的白兔从她身边跑过。",
                [
                  ["suddenly", "突然；故事转折时最常用", "adv. 副词"],
                  ["close by her", "从她身边很近的地方；close by 是在附近", "介词短语"],
                ],
                [
                  ["Suddenly, a small dog ran close by us and disappeared.", "突然，一只小狗从我们身边跑过，不见了。"],
                ],
              ),
              s(
                "al-c1-s6",
                "There was nothing so very remarkable in that.",
                "这件事本身并没有什么特别稀奇的。",
                [
                  ["nothing remarkable", "没什么稀奇；remarkable 是值得注意的、非凡的", "名词短语"],
                  ["so very", "非常、特别；老式英语里加强语气的说法", "adv. 副词短语"],
                ],
                [
                  ["There was nothing remarkable in his answer.", "他的回答没什么特别的。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "al-c1-s7",
                "But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet.",
                "但是当兔子真的从背心口袋里掏出一块怀表，看了看，又匆匆赶路时，爱丽丝一下子跳了起来。",
                [
                  ["took a watch out of", "把怀表从……里掏出来；take out of 是取出", "动词短语"],
                  ["waistcoat-pocket", "背心口袋；waistcoat 是西装背心", "n. 名词"],
                  ["started to her feet", "一下子站了起来；start 在这里是猛地动身", "动词短语"],
                ],
                [
                  ["He took a letter out of his pocket, looked at it, and hurried on.", "他从口袋里掏出一封信，看了看，又匆匆赶路。"],
                ],
              ),
              s(
                "al-c1-s8",
                "In another moment down went Alice after it, never once considering how in the world she was to get out again.",
                "转眼间，爱丽丝就跟着跳了下去，压根没想过自己要怎么出来。",
                [
                  ["in another moment", "转眼间、下一刻", "时间短语"],
                  ["after it", "跟着它、在它后面追", "介词短语"],
                  ["never once considering", "一次也没想过、压根没考虑", "动词短语"],
                ],
                [
                  ["In another moment, the cat was down from the tree after the bird.", "转眼间，猫就跟着那只鸟从树上跳了下来。"],
                ],
              ),
            ],
          },
        ],
      },
    ],
  },
};

const airportTextbook: SeedBook = {
  id: "english-steps-airport",
  category: "textbook",
  title: "English Steps · Book 1",
  subtitle: "教科书 · Unit 4: At the Airport",
  kicker: "Textbook",
  badge: null,
  coverKind: "image",
  coverImg: "airport",
  coverFrom: "#c2a15c",
  coverTo: "#96762f",
  sortOrder: 4,
  content: {
    chapters: [
      {
        kicker: "Unit 4",
        title: "At the Airport",
        blocks: [
          {
            type: "p",
            sentences: [
              s(
                "es-c1-s1",
                "Good morning. May I see your passport and ticket, please?",
                "早上好。我可以看一下您的护照和机票吗？",
                [
                  ["May I see…?", "我可以看一下……吗？礼貌地请人出示东西", "口语句型"],
                  ["passport and ticket", "护照和机票；机场最先要的两样东西", "名词短语"],
                ],
                [
                  ["May I see your ID card, please?", "我可以看一下您的身份证吗？"],
                ],
              ),
              s(
                "es-c1-s2",
                "Would you like a window seat or an aisle seat?",
                "您想要靠窗的座位还是靠过道的座位？",
                [
                  ["Would you like…?", "您想要……吗？比 Do you want 礼貌得多", "口语句型"],
                  ["window seat", "靠窗座位", "n. 名词短语"],
                  ["aisle seat", "靠过道座位；aisle 是过道，读作 /aɪl/", "n. 名词短语"],
                ],
                [
                  ["Would you like a table by the window or near the door?", "您想要靠窗的桌子还是靠门的桌子？"],
                ],
              ),
              s(
                "es-c1-s3",
                "Your flight departs from Gate 12 at nine forty-five.",
                "您的航班 9 点 45 分从 12 号登机口起飞。",
                [
                  ["departs from", "从……出发、起飞；depart 是正式的「出发」", "动词短语"],
                  ["Gate 12", "12 号登机口；gate 是登机口", "n. 名词短语"],
                ],
                [
                  ["The train departs from Platform 3 at seven fifteen.", "火车 7 点 15 分从 3 号站台出发。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "es-c1-s4",
                "Please put your bag on the belt and take out your laptop.",
                "请把您的包放在传送带上，并把笔记本电脑拿出来。",
                [
                  ["put … on the belt", "把……放在传送带上；安检时的固定说法", "动词短语"],
                  ["take out", "取出、拿出来；take out your laptop", "动词短语"],
                ],
                [
                  ["Please put your keys on the tray and take out your phone.", "请把钥匙放在托盘上，把手机拿出来。"],
                ],
              ),
              s(
                "es-c1-s5",
                "The flight to Singapore takes about one hour and five minutes.",
                "飞往新加坡的航班大约需要一小时零五分钟。",
                [
                  ["takes about", "大约需要（时间）；take 在这里是花费时间", "动词短语"],
                  ["one hour and five minutes", "一小时零五分钟；时间的完整说法", "时间短语"],
                ],
                [
                  ["The bus to the city takes about forty minutes.", "去市里的公交大约需要四十分钟。"],
                ],
              ),
              s(
                "es-c1-s6",
                "After you land, follow the signs to baggage claim.",
                "落地之后，跟着指示牌去行李提取处。",
                [
                  ["after you land", "在你落地之后；land 是降落", "时间状语从句"],
                  ["follow the signs", "跟着指示牌走；sign 是指示牌", "动词短语"],
                  ["baggage claim", "行李提取处；claim 是认领", "n. 名词短语"],
                ],
                [
                  ["After you arrive, follow the signs to the exit.", "到达之后，跟着指示牌去出口。"],
                ],
              ),
            ],
          },
          {
            type: "p",
            sentences: [
              s(
                "es-c1-s7",
                "If you need help, ask any member of staff at the information desk.",
                "如果您需要帮助，可以问问询台的任何一位工作人员。",
                [
                  ["member of staff", "工作人员；staff 是全体员工", "名词短语"],
                  ["information desk", "问询台、服务台", "n. 名词短语"],
                ],
                [
                  ["If you need help, ask any member of staff at the front desk.", "如果您需要帮助，可以问前台的任何一位工作人员。"],
                ],
              ),
              s(
                "es-c1-s8",
                "Have a pleasant flight, and thank you for flying with us.",
                "祝您旅途愉快，感谢您乘坐我们的航班。",
                [
                  ["have a pleasant flight", "祝旅途愉快；登机口最常听到的祝福", "口语表达"],
                  ["thank you for flying with us", "感谢您乘坐我们的航班；thank you for + 动词ing", "口语表达"],
                ],
                [
                  ["Have a pleasant trip, and thank you for staying with us.", "祝您旅途愉快，感谢您入住我们酒店。"],
                ],
              ),
            ],
          },
        ],
      },
    ],
  },
};

export const SEED_BOOKS: SeedBook[] = [penang, aroundTown, alice, airportTextbook];
