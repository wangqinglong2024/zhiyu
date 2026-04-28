> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 10 · 支付（Payment · PY）

> **代号**：PY | **优先级**：P0 | **核心**：Paddle MoR + LemonSqueezy 备份；多档订阅

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 主通道：Paddle（Merchant of Record，自动处理 VAT/SST/PPN）
- 备份通道：LemonSqueezy（feature flag 切换）
- 不直接接信用卡 / 当地支付（合规复杂度太高）
- 计划：
  - 月会员 $4
  - 半年会员 $12（$2 / 月，限时促销，可下架）
  - 年会员 $40（$3.33 / 月）
  - 单段 $4（永久解锁该段，按 track + stage_no）
  - 9 段全包 $36（按 track，永久）
- 续费：自动续，可随时取消
- 退款政策：7 天内全额（SaaS 行业惯例）
- Webhook 幂等：event_id 去重
- 多币种：v1 仅 USD；v1.5 评估当地币种（VND / THB / IDR）
