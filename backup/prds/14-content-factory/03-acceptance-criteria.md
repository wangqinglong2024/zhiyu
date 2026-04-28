# 14.3 · 内容工厂 · 验收准则

## 功能
- [ ] CF-AC-001：lesson_generation 端到端 < 5min
- [ ] CF-AC-002：article_generation 端到端 < 3min
- [ ] CF-AC-003：novel_chapter_generation < 5min
- [ ] CF-AC-004：quiz_generation 输出 10 题，干扰项合理
- [ ] CF-AC-005：tts_batch 100 句 < 5min
- [ ] CF-AC-006：4 语翻译完整覆盖
- [ ] CF-AC-007：红线检测双层（critical 拒）
- [ ] CF-AC-008：失败节点 3 次重试
- [ ] CF-AC-009：监控页节点日志
- [ ] CF-AC-010：成本核算准确
- [ ] CF-AC-011：审校自动入队
- [ ] CF-AC-012：版本回滚
- [ ] CF-AC-013：并发控制（全局 20 / 单租 5）

## 非功能
- [ ] 单节成本 < $0.10
- [ ] LLM 调用成功率 > 99%
- [ ] TTS 成功率 > 99.5%
- [ ] 工作流状态持久化（崩溃可恢复）

## 测试用例
1. 触发 HSK stage 4 chapter 1 lesson 1 生成 → 5min 内完成 → 入审校队列
2. Claude API 失败 → 重试 → 成功
3. 红线 critical 命中 → workflow failed
4. 同时触发 30 个工作流 → 20 个 running，10 个 queued
5. 重跑失败节点 → 仅该节点重跑，下游不受影响
6. 回滚到 v1 → 资源恢复 v1 内容

## 内容验收（W0）
- [ ] 4 轨道 × 前 3 阶段全部经工厂生产
- [ ] 红线 0 命中触发
- [ ] 母语审校首次通过率 > 85%
- [ ] 总成本 < $5,000
