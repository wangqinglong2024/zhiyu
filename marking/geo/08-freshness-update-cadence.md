# 内容新鲜度运维 SOP

> **数据**：65% AI 爬虫抓取目标集中在发布 < 1 年内容；内容 > 3 月未更新 → 引用率断崖下跌。

---

## 1. 新鲜度 4 大信号

LLM 判定内容新鲜度的 4 个信号：
1. **页面可见 Last Updated 时间**
2. **Schema dateModified 字段**
3. **HTTP Last-Modified 头**
4. **Sitemap lastmod 字段**

**4 处必须同步**，差异会触发不信任。

---

## 2. 内容刷新优先级

| 类型 | 必须刷新周期 | 备注 |
|------|------------|------|
| 数据报告 | 季度 | 数字必须更新 |
| 版本相关（HSK 4.0）| 年度 | 标准变化时立即 |
| 节日时序内容 | 年度 | 中秋/春节按年度 |
| 课程介绍页 | 季度 | 价格/优惠/数据 |
| 评测/对比页 | 季度 | 竞品价格/功能 |
| HSK 词条 | 年度 | 例句 / 数据 |
| 文化长文 | 年度 | 引用源验证 |

---

## 3. 季度刷新 SOP

每季度（Q1/Q2/Q3/Q4 第 1 个月）：

```markdown
1. 数据团队跑脚本：列出所有 dateModified > 90 天的高优先级页面（Top 500）
2. 内容编辑按列表逐一处理：
   - 验证统计数据（如"600 words"是否仍然准确）
   - 更新所有数字
   - 更新所有外链（用 broken link checker）
   - 在 BLUF 段加 "Last verified [Month Year]"
   - 改 dateModified
   - 至少改 ≥ 5% 实质内容（不是改个日期就完）
3. 工程提交 sitemap lastmod 更新
4. IndexNow + GSC URL Inspection 推送
5. 监测被引率变化
```

---

## 4. 实时刷新触发

下列事件**立即**触发对应内容刷新：
- HSK 标准变化
- 节日新日期发布
- Wikipedia 词条重大编辑
- 主要竞品价格 / 功能变化
- 新法规（GDPR、东南亚教育新规）

---

## 5. "假更新"的红线（不要做）

❌ 只改 dateModified 不改实质内容（Google 已能识别）
❌ 用 AI 一键 rephrase（语义无变化）
❌ 加无关时间戳（"Updated for 2026" 但内容仍是 2024）

✅ 每次"刷新"必须实质改 ≥ 5% 内容（数字 / 例子 / 链接 / 段落）

---

## 6. 自动化告警

```sql
-- 每周一跑
SELECT slug, last_modified, last_verified
FROM pages
WHERE priority >= 80
  AND last_modified < NOW() - INTERVAL '90 days'
ORDER BY priority DESC
LIMIT 100;
```

输出告警邮件给内容总监。

---

## 7. 时间戳显示规范

**页面右上角**：
```
Last Updated: May 1, 2026 ✓ Verified by Dr. Wei Liu
```

**BLUF 内**：
```
... Last verified May 2026.
```

**Schema**：
```json
"datePublished": "2025-12-01T00:00:00Z",
"dateModified": "2026-05-01T00:00:00Z"
```

**HTTP**：
```
Last-Modified: Fri, 01 May 2026 00:00:00 GMT
```

**Sitemap**：
```xml
<lastmod>2026-05-01</lastmod>
```

---

## 8. KPI

| KPI | 目标 |
|-----|-----|
| Top 500 页面 90 天内被刷新比例 | 100% |
| Top 500 页面平均 dateModified 距今 | < 60 天 |
| 季度刷新完成率 | 100% |
| 4 处时间戳一致性 | 100% |
