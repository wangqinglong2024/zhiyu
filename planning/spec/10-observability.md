# 10 · 可观测性（Observability）

## 一、三大支柱

### 1.1 Logs (Better Stack / Logtail)
- 结构化 JSON
- 字段：ts / level / service / env / version / trace_id / span_id / user_id / message / context

### 1.2 Metrics
- 应用：Render 内置 + 自定义 Prometheus
- 业务：PostHog / 自有
- 基础设施：Cloudflare Analytics / Supabase Dashboard

### 1.3 Traces (Sentry Performance)
- HTTP request → 数据库 → AI / 第三方
- 分布式追踪 OpenTelemetry（v1.5 引入）

## 二、错误监控

### 2.1 Sentry
- FE + BE
- Source map 上传
- Release tracking
- 用户级 fingerprint
- 自动分组

### 2.2 错误分级
| Level | 处理 |
|---|---|
| Fatal | PagerDuty 立即 |
| Error | Slack 通知 |
| Warning | 仪表板 |
| Info | 仅日志 |

### 2.3 Filters
- 已知 / 第三方错误 fingerprint 自动 ignore
- 用户网络错误 sample 10%

## 三、日志

### 3.1 Pino
```ts
import pino from 'pino';
const logger = pino({
  level: env.LOG_LEVEL || 'info',
  transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});
```

### 3.2 结构化字段
```json
{
  "ts": "2026-04-25T10:00:00Z",
  "level": "info",
  "service": "api",
  "env": "prod",
  "version": "1.0.3",
  "trace_id": "abc",
  "user_id": "u_123",
  "method": "POST",
  "path": "/v1/lessons/start",
  "status": 200,
  "duration_ms": 87,
  "message": "lesson_started"
}
```

### 3.3 敏感数据
- 中间件自动脱敏
- 字段黑名单（password / token / card）

### 3.4 保留
- 30d 热查询
- 365d 归档（R2）

## 四、指标

### 4.1 应用指标
- request_count
- request_duration_seconds (p50/p95/p99)
- error_count by code
- queue_depth by name
- queue_processed
- db_pool_usage
- cache_hit_rate

### 4.2 业务指标
- DAU / MAU
- 注册数 / 转化率
- 付费数 / 收入
- 课程 / 游戏 完成率
- 客服 SLA
- AI 任务成功率 / 成本

### 4.3 仪表板
- Better Stack 主仪表板
- PostHog 业务漏斗
- Metabase BI（v1.5）
- Supabase 内置

## 五、追踪

### 5.1 请求 ID
- 中间件生成 X-Request-Id
- 透传到下游
- 关联日志

### 5.2 Sentry Performance
```ts
const txn = Sentry.startTransaction({ op: 'http.server', name: req.path });
Sentry.getCurrentHub().configureScope((s) => s.setSpan(txn));
```

### 5.3 OpenTelemetry (v1.5)
- 标准化 Tracing
- 跨服务

## 六、健康检查

### 6.1 `/health`
- 返回 200 OK + version + uptime

### 6.2 `/ready`
- 检查 DB / Redis / 外部依赖
- Render 健康探测

### 6.3 `/metrics`
- Prometheus 格式（仅内网）

## 七、SLO / SLI

### 7.1 SLI
- API 可用性 = 成功响应 / 总请求
- API P95 延迟
- 错误预算

### 7.2 SLO（v1）
| 服务 | 目标 |
|---|---|
| API 可用性 | 99.5% / 月 |
| API P95 | < 300ms |
| API 错误率 | < 1% |
| 学习引擎成功率 | > 99% |
| 工厂任务成功率 | > 95% |
| 支付回调处理 | < 30s |

### 7.3 错误预算
- 月预算 = (1 - SLO) × 时长
- 超预算冻结新功能

## 八、告警

### 8.1 通道
- Slack：警告 / 一般
- PagerDuty：严重 / 紧急
- 邮件：日报 / 周报

### 8.2 规则
| 规则 | 通道 |
|---|---|
| API 错误率 > 5% / 5min | Slack |
| API 错误率 > 10% / 5min | PagerDuty |
| API P95 > 1s / 10min | Slack |
| DB CPU > 90% | Slack |
| Queue depth > 1000 | Slack |
| Sentry new issue (高频) | Slack |
| 支付失败率 > 5% | PagerDuty |
| AI 成本 > 月预算 80% | Slack |
| 部署失败 | Slack |

### 8.3 静默
- 维护窗口
- 已知问题
- 周末降级

## 九、运维仪表板

### 9.1 应用面板
- 实时流量
- 错误率
- 延迟分位数
- 队列状态

### 9.2 业务面板
- 实时注册 / 付费
- AI 任务进展
- 内容产出
- 客服在线

### 9.3 财务面板
- 实时收入
- 月度对比
- 退款 / 分销

## 十、行为分析（PostHog）

### 10.1 事件埋点
详见 07-integrations.md § 10

### 10.2 漏斗
- 注册：访问 → 注册页 → 完成
- 付费：见付费墙 → 选套餐 → 完成
- 学习：进入课程 → 第一节 → 完成第一节

### 10.3 留存
- DAU / WAU / MAU
- 7 / 30 / 90 日留存
- 学习留存（按轨道）

### 10.4 队列
- 用户分群（注册时间 / 国家 / 付费）
- 行为对比

## 十一、A/B 测试

### 11.1 工具
- PostHog Feature Flag
- 自有 Feature Flag 系统

### 11.2 流程
- 设计假设
- 计算样本量
- 上线 + 监测
- 评估 + 决策
- 全量 / 回滚

### 11.3 实验示例
- 付费墙文案
- 引导流程长度
- 课程难度
- 通知时机

## 十二、用户反馈

### 12.1 内置反馈
- 个人中心 → 反馈
- Bug / 建议 / 内容报错
- 自动附 user_id / version / 路径

### 12.2 NPS
- 触发条件：用户 ≥ 30 天 + 完成 ≥ 3 节
- 月度

### 12.3 应用商店评分（v1.5）
- 触发：连续 7 天 + 完成 ≥ 5 节
- 限频每用户 6 月

## 十三、事故管理

### 13.1 流程
1. 检测（监控 / 用户报告）
2. 评估（严重程度）
3. 通报（状态页 / Slack）
4. 处理
5. 恢复
6. 复盘 RCA

### 13.2 状态页
- BetterStack StatusPage
- 服务状态 + 历史事件
- 订阅通知

### 13.3 Postmortem
- 严重事件必写
- 模板：时间线 / 影响 / 根因 / 改进

## 十四、性能预算监控

### 14.1 Lighthouse CI
- 每 PR 跑
- 阈值不下降

### 14.2 Web Vitals 上报
- 实际用户数据 RUM
- 按页面 / 国家 / 设备分群

### 14.3 Bundle Size
- bundlewatch / size-limit
- 增长 > 5% PR 阻塞

## 十五、检查清单

- [ ] Sentry FE/BE 集成
- [ ] Better Stack 日志 + 监控
- [ ] PostHog 行为
- [ ] 状态页上线
- [ ] PagerDuty 集成
- [ ] SLO 定义 + 监控
- [ ] 告警全部配置
- [ ] 运维 + 业务仪表板
- [ ] Web Vitals RUM
- [ ] Bundle size CI
- [ ] 事故响应流程
