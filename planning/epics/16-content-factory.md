# Epic E16 · AI 内容工厂（Content Factory）

> 阶段：M2-M5 · 优先级：P0 · 估算：8 周（贯穿）

## 摘要
LangGraph + Claude + DeepSeek 编排，自动生成文章 / 课程节 / 小说章 / 词包，人审 + 评分 + 发布。

## 范围
- prompt_templates / factory_tasks / generations 模型
- 4 类内容工作流
- 5 语翻译 + TTS
- 人审 UI
- 成本 / 质量监控

## Stories

### ZY-16-01 · prompt_templates 表 + 模板管理后台
**AC**
- [ ] 表 + 版本号
- [ ] 后台 CRUD
- [ ] 变量预览
**Tech**：spec/06 § 4
**估**: M

### ZY-16-02 · LangGraph 集成 + checkpointer
**AC**
- [ ] LangGraph 包安装
- [ ] PG checkpointer
- [ ] 演示 graph 可重放
**Tech**：spec/06 § 3
**估**: L

### ZY-16-03 · Anthropic + DeepSeek 客户端封装
**AC**
- [ ] 统一接口（generate / stream）
- [ ] 成本上报
- [ ] 限速 + 重试
- [ ] 缓存（Redis）
**Tech**：spec/07 § 4
**估**: L

### ZY-16-04 · 文章生成工作流
**AC**
- [ ] outline → draft → polish → split → pinyin → translate → audio → cover → eval
- [ ] 自动重试 ≤ 2
- [ ] 评分 ≥ 0.7 通过
**估**: L

### ZY-16-05 · 课程节生成工作流
**AC**
- [ ] 步骤设计 + payload + scoring
- [ ] 10-15 步骤
- [ ] 单节 < $0.50
**估**: L

### ZY-16-06 · 小说章生成工作流
**AC**
- [ ] 上下文记忆（前章）
- [ ] 3000 字
- [ ] 单章 < $1.50
**估**: L

### ZY-16-07 · 词包生成工作流
**AC**
- [ ] 主题词检索 / 生成
- [ ] HSK 关联
- [ ] 拼音 / 翻译 / 例句 / 音频
**估**: M

### ZY-16-08 · DeepSeek TTS 集成
**AC**
- [ ] 句级音频
- [ ] R2 存储
- [ ] CDN 分发
- [ ] 失败重试
**估**: M

### ZY-16-09 · 翻译节点（5 语）
**AC**
- [ ] Claude（en）+ DeepSeek（vi/th/id）+ pass-through（zh）
- [ ] 句级翻译缓存
- [ ] 批量
**估**: M

### ZY-16-10 · 自动评估器
**AC**
- [ ] 4 维度评分
- [ ] 综合阈值
- [ ] 触发重试 / 转人审
**Tech**：spec/06 § 8
**估**: M

### ZY-16-11 · 人审 UI（后台）
**AC**
- [ ] 任务队列 + 派发
- [ ] 编辑器（多语对比）
- [ ] 通过 / 修改 / 打回 / 废弃
- [ ] SLA 计时
**Tech**：ux/12 § 8
**估**: L

### ZY-16-12 · 成本 + 质量仪表板
**AC**
- [ ] 月度 / 任务级成本
- [ ] 成功率 / 评分
- [ ] LangSmith 集成
- [ ] 预算告警
**估**: M

## 风险
- AI 输出质量不稳 → 人审 + 反馈训练
- 成本超支 → 严格配额 + 缓存

## DoD
- [ ] 4 类工作流可一键
- [ ] 单任务成本达标
- [ ] 人审 UI 完整
- [ ] LangSmith 可见
