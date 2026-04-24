# 中文学习课程体系 · 总索引

> **架构**：4 条独立轨道（电商 / 工厂 / HSK / 日常）× 12 阶段 × 12 章 × 12 节 × 12 知识点 = 单轨 20,736 知识点 / 4 轨道总计 82,944（去重后约 5-6 万独立内容）。
> **内容形态**：每个知识点 = 一行可批量导入的文本（字 / 词 / 短语 / 短句 / 中句 / 长句 / 复句），由系统自动出题与配音。
> **考核形态**：10 类固定题型（Q1-Q10），全静默，无 ASR；详见 [`shared/05-question-bank.md`](./shared/05-question-bank.md)。
> **视频形态**：每个知识点配 1 条 30s 课程视频，由平台自录，与课程一体化（**不做独立短视频选题策划**）。
---

## 一、4 条轨道

| 轨道 | 目标用户 | 进阶里程碑 | 入口 |
|---|---|---|---|
| 🛒 [电商](./ecommerce/00-index.md) | 跨境卖家、Tiki/Shopee 选品、直播带货 | 询价 → 砍价 → 1688 下单 → 谈 OEM → 跨境贸易 | [`ecommerce/`](./ecommerce/00-index.md) |
| 🏭 [工厂](./factory/00-index.md) | 中资厂蓝领、技术员、品检、翻译 | 普工 → 熟练工 → QC → 班组长 → 技术员 → 管理 | [`factory/`](./factory/00-index.md) |
| 📘 [HSK](./hsk/00-index.md) | 学生 / 求职加分 / 留学预备 | HSK 1 → HSK 2 → ... → HSK 9 | [`hsk/`](./hsk/00-index.md) |
| 🍜 [日常](./daily/00-index.md) | 18-35 泛人群（旅游 / 追剧 / 网购 / 社交） | 问候 → 旅游 → 点餐 → 网购 → 社交 → 文化 | [`daily/`](./daily/00-index.md) |

> 用户进 App 时选 1-2 个主轨道；多轨可并行学习。HSK 等级仅用于 HSK 轨道；其他 3 轨用各自业务/生活里程碑。

---

## 二、12 阶段难度梯度（含统一内容单位）

| 阶段 | 主单位 | 单条字数 | 累计字 | 累计词 | CEFR | 学时 |
|:---:|---|:---:|:---:|:---:|:---:|:---:|
| 1 | 字 + 拼音/笔画 | 1 | 50 | 100 | pre-A1 | 30h |
| 2 | 字 + 双字词 | 1-2 | 150 | 300 | A1 初 | 35h |
| 3 | 双字词 | 2 | 300 | 500 | A1 | 40h |
| 4 | 词 + 短语 | 2-4 | 500 | 900 | A2 | 45h |
| 5 | 短句 | 5-8 | 800 | 1500 | B1 初 | 50h |
| 6 | 短句 | 6-10 | 1200 | 2300 | B1 | 55h |
| 7 | 中句 | 8-12 | 1600 | 3400 | B2 初 | 60h |
| 8 | 中句 | 10-15 | 2000 | 4600 | B2 | 65h |
| 9 | 长句 | 12-18 | 2400 | 5800 | B2+ | 70h |
| 10 | 长句 + 复句 | 15-25 | 2800 | 7200 | C1 | 75h |
| 11 | 复句 | 20-30 | 3200 | 9000 | C1+ | 80h |
| 12 | 复句 + 短对话 | 25-40 | 3500+ | 11000+ | C2 | 90h |

详见 [`shared/00-stage-framework.md`](./shared/00-stage-framework.md)。

> **课程内容不收文章 / 段落**。整段阅读由 [`/china/`](../china/00-index.md)「发现中国」与小说专区承载，与课程系统解耦。

---

## 三、四级结构

```
轨道 (Track) 4
  └─ 阶段 (Stage) 12      ← 难度梯度
      └─ 章 (Chapter) 12  ← 主题模块
          └─ 节 (Lesson) 12  ← 子场景
              └─ 知识点 (Knowledge Point) 12  ← 一行可导入文本 + 自动出题
```

- **节** = 用户最小学习单位，5-8 分钟，12 知识点 + 12 题节小测
- **章** = 主题闭环，1-1.5 小时，结尾 36 题章单元测
- **阶段** = 升级里程碑，30-90 小时，结尾 80-150 题综合考核 + 数字证书

---

## 四、知识点数据格式（批量导入）

每个知识点 = CSV / JSONL 一行，字段固定：

```csv
id,track,stage,chapter,lesson,kpoint,unit_type,chinese,pinyin,vi,th,key_point
ec-s01-c01-l01-k01,ec,1,1,1,1,word,老板,lǎobǎn,ông chủ,เจ้านาย,电商对话开场万能称呼
```

完整规范见 [`shared/04-knowledge-point-format.md`](./shared/04-knowledge-point-format.md)。

---

## 五、考核与题型

10 类固定题型（Q1-Q10）+ 拼音入门专用 3 类（P1-P3），完整规范与自动出题算法见 [`shared/05-question-bank.md`](./shared/05-question-bank.md)。

| 级别 | 题数 | 通过线 | 备注 |
|---|:---:|:---:|---|
| 节小测 | 12 | 75% | 12 知识点 1:1，错题入 SRS |
| 章单元测 | 36 | 80% | 4 维度（听/读/写/用）单项 ≥ 60% |
| 阶段综合 | 80-150 | 80% / 85% | 阶段 11-12 提升至 85%，颁发数字证书 |

详见 [`shared/03-assessment-system.md`](./shared/03-assessment-system.md)。

---

## 六、共享资源

| 文件 | 内容 |
|---|---|
| [`shared/00-stage-framework.md`](./shared/00-stage-framework.md) | 12 阶段框架 + 4 轨独立里程碑 |
| [`shared/01-pinyin-system.md`](./shared/01-pinyin-system.md) | 拼音系统（声韵调 / 拼读规则）|
| [`shared/02-hanzi-foundation.md`](./shared/02-hanzi-foundation.md) | 汉字基础（笔画 / 笔顺 / 部首 / 结构）|
| [`shared/03-assessment-system.md`](./shared/03-assessment-system.md) | 三级考核体系（节 / 章 / 阶段）|
| [`shared/04-knowledge-point-format.md`](./shared/04-knowledge-point-format.md) | 知识点统一规范（导入字段 + unit_type）|
| [`shared/05-question-bank.md`](./shared/05-question-bank.md) | 10 类固定题型 + 自动出题引擎 |

---

## 七、文件结构

```
course/
  00-index.md
  shared/
    00-stage-framework.md     # 12 阶段 + 4 轨里程碑
    01-pinyin-system.md       # 拼音
    02-hanzi-foundation.md    # 汉字
    03-assessment-system.md   # 三级考核流程
    04-knowledge-point-format.md  # 导入字段
    05-question-bank.md       # 10 类题型
  ecommerce/    00-index.md + stage-01.md ~ stage-12.md
  factory/      00-index.md + stage-01.md ~ stage-12.md
  hsk/          00-index.md + stage-01.md ~ stage-12.md
  daily/        00-index.md + stage-01.md ~ stage-12.md
```
