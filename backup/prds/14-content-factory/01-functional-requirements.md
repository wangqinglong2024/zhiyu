> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 14.1 · 内容工厂 · 功能需求

## CF-FR-001：工作流定义
- LangGraph DAG，节点 + 条件分支
- 可并行（如多语翻译并行）
- 状态持久化（PG）+ 可重跑节点
- 输入参数 + 输出 JSON

## CF-FR-002：lesson_generation 工作流

```
[输入] track / stage_no / chapter_no / lesson_no / topic / hsk_level
  ↓
1. 生成节大纲（Claude）→ {objectives, kp_themes[12]}
  ↓
2. 生成 12 知识点（Claude）→ {zh, pinyin, type, examples[2-3]}
  ↓
3. 拼音校验 + tone 数字化（DeepSeek）
  ↓
4. 红线检测 Layer1 + Layer2（拒则停）
  ↓
5. 翻译 4 语 key_point + 例句（DeepSeek 并行）
  ↓
6. 生成节小测 10 题（Claude）
  ↓
7. TTS 批量（Azure）
  ↓
8. 入库 status=draft
  ↓
9. 推送到审校队列（content_review_workflow）
```

## CF-FR-003：article_generation 工作流

```
[输入] category / topic / hsk_level / target_length
  ↓
1. 生成大纲 + 摘要（Claude）
  ↓
2. 生成正文 zh（Claude）→ 句子化
  ↓
3. 拼音生成（DeepSeek）
  ↓
4. 红线检测
  ↓
5. 4 语翻译（DeepSeek 并行）
  ↓
6. 生成 key_points 3-5 条（Claude）
  ↓
7. TTS 批量（Azure）
  ↓
8. 入库 + 推审校
```

## CF-FR-004：novel_chapter_generation 工作流

```
[输入] novel_id / chapter_no / outline / prev_summary
  ↓
1. 生成正文 zh（Claude，长文 ≤ 3000 字）
  ↓
2. 句子化 + 拼音（DeepSeek）
  ↓
3. 红线检测
  ↓
4. 4 语翻译（DeepSeek 并行）
  ↓
5. 标识金句（Claude，3-5 句）
  ↓
6. 生成章末快测 3-5 题（Claude）
  ↓
7. TTS（ElevenLabs 高级旁白）
  ↓
8. 入库 + 推审校
```

## CF-FR-005：quiz_generation 工作流

```
[输入] target=lesson|chapter|stage / target_id / question_count
  ↓
1. 加载知识点
  ↓
2. 题型分配（按预设比例）
  ↓
3. 生成题干 + 选项（Claude）
  ↓
4. 干扰项合理性自评（Claude）→ 不合格重生成
  ↓
5. 翻译解释 + 题干 → 4 语
  ↓
6. 入库 status=active
```

## CF-FR-006：tts_batch
- 输入：sentence_ids 列表
- 提供商选择：Azure（默认）/ ElevenLabs（高级）
- 音色选择：female_zh_default / male_zh_default / 等
- 并发：5 并行
- 失败重试 3 次
- 输出 URL 写 content_sentences.audio

## CF-FR-007：translation_only
- 输入：source_text + target_langs
- LLM：DeepSeek（成本敏感）
- 上下文 prompt 包括行业 / HSK 等级 / 语气

## CF-FR-008：工作流监控
- `/admin/content/factory`
- 列表：状态 / 触发人 / 耗时 / 当前节点
- 详情：节点日志 / 输入 / 输出
- 操作：暂停 / 恢复 / 重跑节点 / 取消

## CF-FR-009：成本核算
- 每节点记录 LLM tokens / TTS 字符
- 单价配置 → 估算金额
- Dashboard 月成本曲线

## CF-FR-010：并发与队列
- 全局 LangGraph 工作流并发上限：20
- 单租户上限：5
- 排队策略：FIFO + 优先级（admin 手动 > 定时任务）

## CF-FR-011：审校触达
- 工作流完成 → 写 content_review_workflow status=to_review
- 按语种自动分配 reviewer（同 CS 路由策略）
- 审校通过 → 资源 status=published

## CF-FR-012：版本回滚
- 每次重生成保留旧版本
- 管理员可一键回滚到任意历史版本

## 性能
- 单节生成端到端 < 5min（不含审校）
- 单文章 < 3min
- 单章节小说 < 5min
- TTS 批量（100 句）< 5min
