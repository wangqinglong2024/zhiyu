# ZY-08-05 · 10-step 组件库

> Epic：E08 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 前端开发者
**I want** 10 类步骤各自的可复用 React 组件
**So that** lesson 编辑器与学习页共享展示，避免不一致。

## 上下文
- 物理路径：`system/packages/ui/src/learning/<step>/`
- 每个组件接收 `payload`（zod schema 校验后）+ `onComplete(result)` 回调。
- 步骤组件清单：
  - `StepIntro`（图文 / 视频 self-host）
  - `StepVocab`（卡片翻面 + 拼音 + TTS）
  - `StepSentence`（拼读 + 句子分词）
  - `StepPinyin`（拼音填空 / 配对）
  - `StepListen`（音频选项题）
  - `StepSpeak`（录音 + 浏览器音频比对，简化无 ASR）
  - `StepRead`（朗读全文 + 计时）
  - `StepWrite`（笔顺 canvas 描红）
  - `StepPractice`（小游戏复用 ZY-09 / 10）
  - `StepQuiz`（单选 / 多选 / 拖拽 / 连线）

## Acceptance Criteria
- [ ] 10 组件全部实现 + Storybook 故事
- [ ] 类型完整 + zod payload 校验
- [ ] a11y：键盘可操作
- [ ] 单测覆盖核心 payload 边界
- [ ] 笔顺 canvas 用 hanzi-writer（自托管）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/ui test learning
```

## DoD
- [ ] 10 组件全通
- [ ] Storybook 全故事

## 不做
- AI 评分（v1.5）

## 依赖
- 上游：ZY-02-05/06 / ZY-08-01
- 下游：ZY-08-04 / ZY-17 编辑器
