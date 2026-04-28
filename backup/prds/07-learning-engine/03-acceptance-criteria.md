# 7.3 · 学习引擎 · 验收准则

## 功能
- [ ] LE-AC-001：错题入 SRS 立即生效（状态 learning，due=now）
- [ ] LE-AC-002：4 档评分调用 ts-fsrs 正确更新 due
- [ ] LE-AC-003：到期题优先于新题
- [ ] LE-AC-004：每日复习上限默认 20，用户可调
- [ ] LE-AC-005：连续 Good 2 次 → resolved
- [ ] LE-AC-006：错题专攻按来源 / HSK 筛选，来源仅课程 / 游戏
- [ ] LE-AC-007：今日新题最多 10
- [ ] LE-AC-008：自由练习筛选生效
- [ ] LE-AC-009：仪表板掌握度热力图
- [ ] LE-AC-010：streak 跨时区准确
- [ ] LE-AC-011：streak freeze 消耗 50 币
- [ ] LE-AC-012：7/30/100 天里程碑奖励
- [ ] LE-AC-013：每日学习提醒邮件
- [ ] LE-AC-014：薄弱点诊断卡片

## 非功能
- [ ] SRS 调度 P95 < 200ms
- [ ] 评分提交 P95 < 300ms
- [ ] 仪表板 P95 < 500ms
- [ ] FSRS-5 算法准确（与 ts-fsrs 单元测一致）

## 关键测试用例
1. 用户 A 在节小测错题 X → SRS 即时含 X，state=learning, due=now
2. 评 Again → due 增 1min；评 Good → due 增 N 天
3. 跨时区：用户 GMT+7 学习到 23:50 → 当地日期算 streak
4. streak 22 天断 1 天 → streak 重置 0；用 freeze → 保留
5. 仪表板掌握度：HSK 4 主题"工厂"准确显示掌握率
6. 大量错题（500 张）查询 < 500ms
7. 小说与发现中国内容产生收藏、阅读、长按生词或阅读进度时，不会写入 `srs_cards` 或 `learning_wrong_set`
