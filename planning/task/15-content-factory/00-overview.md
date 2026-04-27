# 15 · 内容工厂任务清单

## 来源覆盖

- PRD：`planning/prds/14-content-factory/01-functional-requirements.md`、`02-data-model-api.md`。
- 技术：`planning/spec/06-ai-factory.md`、`planning/rules.md`。
- 后台：`AD-FR-007` v1 占位与手动导入入口。

## 冲突裁决

- PRD 中真实 LangGraph/LLM/TTS 生成流程保留为工作流契约与 v1.5 设计，本期 W0 只实现手动 CSV/YAML 导入、workflow/mock 数据、审校队列、版本与成本字段，不接真实 AI/TTS。
- 来源句：`planning/rules.md` 写明“本期 AI 不做真功能，只落接口契约 + mock adapter。”

## 任务清单

- [ ] CF-01 建立 `factory_workflows`、`factory_node_runs`、`factory_content_versions`。来源句：`planning/prds/14-content-factory/02-data-model-api.md` DDL 定义这些表。
- [ ] CF-02 建立 WorkflowAdapter 接口和 mock runner，状态持久化、可重跑节点、输入输出 JSON。来源句：`CF-FR-001` 写明“状态持久化（PG）+ 可重跑节点；输入参数 + 输出 JSON”。
- [ ] CF-03 lesson_generation 只实现 mock 节点与 fixture 输出，完整记录 outline/kp/pinyin/red_line/translate/quiz/tts/persist/review 节点。来源句：`CF-FR-002` 工作流步骤。
- [ ] CF-04 article_generation 只实现 mock 节点与 fixture 输出，句子化、拼音、4 语翻译、key_points、TTS 占位。来源句：`CF-FR-003`。
- [ ] CF-05 novel_chapter_generation 只实现 mock 节点与 fixture 输出，金句、快测、TTS 占位。来源句：`CF-FR-004`。
- [ ] CF-06 quiz_generation 只实现从已有知识点生成 fixture 题目，不真实调用模型。来源句：`CF-FR-005`。
- [ ] CF-07 tts_batch 只写 `seed://` 或 fixture audio_url，不真实合成。来源句：`CF-FR-006` 与 `planning/rules.md` AI/TTS mock 裁决。
- [ ] CF-08 translation_only 只走本地 fixture/人工导入，不真实模型。来源句：`CF-FR-007`。
- [ ] CF-09 实现 `/admin/content/factory` 监控页：状态、触发人、耗时、当前节点、节点日志、输入输出、暂停/恢复/重跑/取消。来源句：`CF-FR-008`。
- [ ] CF-10 实现成本核算字段与月成本曲线，值来自 mock tokens/tts_chars。来源句：`CF-FR-009`。
- [ ] CF-11 实现并发与队列占位：全局 20、单租户 5、FIFO + 优先级，但 dev 可配置为低并发。来源句：`CF-FR-010`。
- [ ] CF-12 工作流完成写 `content_review_workflow status=to_review`，按语种分配 reviewer。来源句：`CF-FR-011`。
- [ ] CF-13 实现内容版本快照与一键回滚。来源句：`CF-FR-012`。
- [ ] CF-14 实现 CSV/YAML 手动导入入口：DC 文章、CR 知识点/题目、NV 章节、GM 词包。来源句：`AD-FR-007` 写明“v1：页面为 v1.5 即将上线占位，仅提供手动导入工具入口（CSV/YAML）”。
- [ ] CF-15 导入前执行 schema 校验、红线 Layer1、内容区规则校验、审校队列创建。来源句：`CF-FR-011` 与内容区文档均要求内容边界/审校。
- [ ] CF-16 Worker 使用 BullMQ 处理导入任务和 mock workflows。来源句：`planning/spec/02-tech-stack.md` 写明“队列 | BullMQ | 跑在 worker 容器”。

## 验收与测试

- [ ] CF-T01 后台触发 mock lesson workflow，节点日志完整，最终进入审校队列。来源句：`CF-FR-002` 与 `CF-FR-011`。
- [ ] CF-T02 上传 CSV/YAML 生成 draft 内容，校验失败返回行号和字段错误。来源句：`AD-FR-007`。
- [ ] CF-T03 禁止任何真实 LLM/TTS 网络调用；缺 key 时任务仍成功跑 fake。来源句：`planning/rules.md` “本期 dev 不集成任何真实 AI 调用”。
