> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 14 · 内容工厂（Content Factory · CF）

> **代号**：CF | **优先级**：**Post-MVP（v1.5）** | **核心**：LangGraph 工作流 + 双 LLM + TTS + 4 语翻译 + 母语审校

> **重要说明**：MVP（v1.0）阶段内容全部手动生成并入库，本模块作为后续自动化架构规划保留，不列入 v1 交付范围。代码库按该架构预留接口（content_*、prompt_templates、factory_tasks 表及 admin/factory 路由），但不实现 LangGraph 调度器。

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## MVP 内容入库路径（手动）
- 内容产出由外部人工/外部脚本完成，直接写入数据库（content_articles / content_chapters / lessons / quiz_*）
- 管理后台提供常规 CRUD 与审校工作台（需要）
- 仅保留质量闸 / 红线词检查作为发布前的校验

## v1.5 开启条件
- v1 上线 4 国 ≥ 3 个月，产品趋于稳定
- 手动产能出现瓶颈（月译者产能 < 50%需求）
- LLM / TTS 商业接口预算到位

## 关键决策（保留以备 v1.5 实现）
- 编排：LangGraph TS（基于 Vercel AI SDK）
- LLM：
  - Claude Sonnet 4.5（创意 / 复杂推理 / 审校）
  - DeepSeek V3（批量翻译 / 拼音生成 / 量大成本敏感）
  - 双模型按节点选择
- TTS：
  - Azure Speech Service（普通话 / 多音色 / 性价比）
  - ElevenLabs（高级旁白 / 小说音色）
- 翻译：vi/th/id/en 4 语种
- 工作流类别：
  - lesson_generation（课程节）
  - article_generation（DC 文章）
  - novel_chapter_generation（小说章节）
  - quiz_generation（题目）
  - tts_batch（批量 TTS）
  - translation_only（单独译）
- 红线词检测内嵌每步
- 失败重试 3 次 + 人工干预入口
