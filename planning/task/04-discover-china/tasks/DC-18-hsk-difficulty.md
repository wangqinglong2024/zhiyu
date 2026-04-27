# DC-18 · 实现 HSK 难度计算与筛选

## PRD 原文引用

- `DC-FR-014`：“每篇文章计算 HSK 难度等级（基于词汇覆盖率）。”
- `DC-FR-014`：“算法：词频统计 → 最高词所需 HSK 等级。”
- `DC-FR-014`：“用户可按难度筛。”

## 需求落实

- 页面：类目列表页、文章详情页、后台文章编辑器。
- 组件：HskLevelBadge、HskFilter。
- API：文章发布/导入时计算；列表查询支持 `hsk_level`。
- 数据表：`content_articles.hsk_level`、`content_sentences.hsk_level`。
- 状态逻辑：后台可查看自动计算结果，但人工覆盖需记录审计。
- 词表：若 CR/LE 共享包尚不存在，本任务创建 `system/packages/content/src/hsk/wordlist.json` 与版本元数据，供 DC/CR 共用。
- 算法：分词后按词频覆盖率计算所需 HSK 等级；缺词按 HSK 6+ 处理并进入人工校准列表。
- 可测样例：任务必须提供至少 3 篇 fixture 文章，覆盖 HSK 1、HSK 3-5、HSK 6+ 的期望结果。

## 不明确 / 风险

- 风险：HSK 词表来源未在 DC PRD 定义。
- 处理：复用课程/题库词表；缺词按最高级或人工校准。

## 技术假设

- HSK 1-9 映射由 CR/LE 共享包提供；若项目最终采用 HSK 1-6，筛选 UI 仍按 PRD 映射为 HSK 1 / 2-3 / 4-5 / 6+。

## 最终验收清单

- [ ] 发布文章时写入 hsk_level。
- [ ] 列表 HSK 筛选生效。
- [ ] 文章页显示难度。
- [ ] 后台能看到计算依据或覆盖记录。
- [ ] HSK 算法有固定词表版本、fixture 和单元测试，结果可重复。