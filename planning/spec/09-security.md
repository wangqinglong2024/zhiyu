# 09 · 安全与合规（Security & Compliance）

## 一、威胁模型

### 1.1 主要威胁
- 账号盗用（撞库 / 钓鱼）
- API 滥用（爬虫 / DoS）
- 内容窃取（付费内容下载）
- 支付欺诈
- 分销刷单
- AI 滥用（Token 浪费）
- 数据泄露（GDPR / PDPA 违规）
- 内容合规（政治 / 宗教）

### 1.2 资产分级
| 等级 | 资产 |
|---|---|
| Critical | 用户支付 / 密码 hash / TOTP |
| High | 用户邮箱 / 手机 / 学习数据 |
| Medium | 内容版权 / 后台 |
| Low | 公开内容 |

## 二、认证

### 2.1 用户认证
- 密码 bcrypt cost 12
- JWT HS256，access 15min，refresh 30d
- Refresh 在 Redis（可强制踢出）
- OAuth：Google / Apple / TikTok（v1.5）
- 邮箱验证：必填（24h 内）
- 手机验证：可选（v1.5）

### 2.2 后台认证
- 邮箱 + 密码 + TOTP
- 失败 5 次锁 15min
- IP 白名单（可选）
- 强密码（min 12，含大小写 + 数字 + 符号）
- 90 天强制改密

### 2.3 Session
- 设备列表可见
- 远程登出
- 异常登录通知（新设备 / 新 IP / 新国家）

### 2.4 密码策略
- 用户：min 8 + 强度 ≥ medium
- 后台：min 12 + 强 + 90 天
- 历史 5 个不可重复
- 重置：邮箱 link，1h 过期

## 三、授权

### 3.1 用户
- 默认 `user` 角色
- VIP（订阅）
- 分销员（推广解锁）

### 3.2 后台 RBAC
角色矩阵：
| Role | Permissions |
|---|---|
| super_admin | * |
| admin | content:*, user:read|update, order:read |
| content_editor | content:create|update, factory:trigger |
| reviewer | content:review |
| support_agent | user:read, support:*, ticket:* |
| finance | order:*, refund:* |
| analyst | reports:read |

### 3.3 RLS（Postgres）
- 用户表数据行级隔离
- notes / favorites / progress 等
- 后台 bypass（service_role）

### 3.4 资源验证
- 全部 API 验证 user_id 匹配
- 不仅前端隐藏

## 四、数据保护

### 4.1 加密
- 传输：TLS 1.3
- 静态：Supabase 内置
- 应用层：敏感字段 AES-GCM（手机 / 身份）
- 备份：R2 SSE

### 4.2 PII 处理
- 最小收集
- 用户可下载（GDPR Right to Access）
- 用户可删除（GDPR Right to Erasure）
- 软删 + 30d 后硬删

### 4.3 日志脱敏
- 不记录密码 / token / 卡号
- 邮箱 mask（abc***@xxx.com）
- IP 仅必要

## 五、API 安全

### 5.1 输入校验
- Zod 全部入口
- SQL 参数化
- 文件类型 MIME + magic 校验
- 上传大小限制

### 5.2 Rate Limit
- 全局 + 端点级
- IP + user 双键

### 5.3 CORS
- 严格白名单
- credentials only when needed

### 5.4 CSRF
- SameSite=Strict cookie
- Custom header X-Csrf-Token（关键操作）
- Origin 校验

### 5.5 XSS
- React 默认 escape
- DOMPurify 富文本
- CSP 严格

### 5.6 SSRF
- 后端 URL fetch 白名单
- 不允许内网 IP

## 六、HTTP 安全头

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: ... (详 16-performance § 6.2)
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

## 七、支付安全

### 7.1 Paddle MoR
- Paddle 处理 PCI 合规
- 不在我方存卡号
- Webhook 签名校验
- 幂等

### 7.2 反欺诈
- IP / 设备 / 行为指纹
- 异常订单人审
- 退款率监控

### 7.3 分销反作弊
- 自我邀请检测（同设备 / IP / 邮箱前缀）
- 突增告警
- 佣金 issue 前反作弊复审（不提供提现，无提现审核环节）

## 八、AI 安全

### 8.1 滥用防护
- 用户 token 配额（v1.5 用户可调用 AI）
- 后台单任务上限
- 模型黑名单 prompt 检测

### 8.2 Prompt Injection
- 用户输入隔离（system vs user）
- 输出二次过滤
- 关键操作要求人确认

### 8.3 内容安全
- 政治 / 暴力 / 色情 关键词
- 文化敏感
- AI 输出审查

## 九、合规

### 9.1 GDPR (欧盟用户)
- 隐私政策明示
- Cookie 同意 banner
- DPO 联系方式
- 数据下载 / 删除工具
- DPA 与第三方签订

### 9.2 PDPA (新加坡 / 泰国 / 马来)
- 同 GDPR 类似
- 区域差异处理

### 9.3 越南 PDP Law
- 数据本地化（v2 评估）
- 跨境传输报备

### 9.4 印尼 PDP Law
- 数据本地化（v2 评估）
- 同意机制

### 9.5 COPPA / 未成年
- v1 不针对 13 以下
- 注册时年龄验证
- 监护人同意（v1.5）

### 9.6 内容合规
- 各国敏感内容
- 人工审稿
- 报告机制

## 十、隐私政策与条款

### 10.1 必备文件
- Privacy Policy（5 语）
- Terms of Service（5 语）
- Cookie Policy
- Refund Policy
- Acceptable Use Policy

### 10.2 关键内容
- 收集数据 + 用途
- 第三方共享
- 用户权利
- 联系方式

### 10.3 同意
- 注册勾选
- 重要变更重新同意

## 十一、漏洞管理

### 11.1 SAST
- GitHub CodeQL
- npm audit
- Snyk

### 11.2 DAST
- OWASP ZAP（v1.5）
- 季度渗透测试

### 11.3 依赖
- Dependabot / Renovate
- 高危 24h 修
- 季度全量更新

### 11.4 漏洞响应
- security@zhiyu.io
- bug bounty 平台（v1.5：HackerOne）
- 90 天披露

## 十二、备份 / 恢复

### 12.1 备份
- DB PITR + daily snapshot
- R2 versioning
- 异地备份 (v1.5)

### 12.2 演练
- 每季度
- 完整恢复时长 < 4h

## 十三、审计

### 13.1 后台操作审计
- 所有写操作记录
- 不可篡改 (append-only)
- 7 年保留

### 13.2 用户行为
- 关键操作日志
- 隐私 + 安全事件

### 13.3 第三方审计
- v2 SOC 2 评估

## 十四、事件响应

### 14.1 流程
1. 检测（监控告警）
2. 评估（严重程度）
3. 隔离（限速 / 下线）
4. 修复
5. 通报（用户 / 监管）
6. 复盘 + 改进

### 14.2 严重事件
- 数据泄露 → 72h 内通报监管
- 大规模故障 → 状态页 + 邮件
- 演练每半年

## 十五、安全运营

### 15.1 监控
- 失败登录告警
- 异常 API 模式
- 异常支付
- 后台敏感操作

### 15.2 培训
- 每季度团队安全培训
- Phishing 演练

## 十六、第三方合规

### 16.1 DPA
- 与 Supabase / Cloudflare / Anthropic 等签 DPA

### 16.2 子处理者清单
- 公开
- 变更通知用户

## 十七、检查清单

- [ ] OWASP Top 10 全覆盖
- [ ] PCI 不接触卡号
- [ ] GDPR / PDPA 合规
- [ ] 隐私政策 / TOS 5 语
- [ ] RBAC + RLS
- [ ] 加密传输 + 静态
- [ ] 审计日志
- [ ] 漏洞响应流程
- [ ] 备份 + 演练
- [ ] 安全头全部配置
