# 操作诊断与自愈运行手册 (Operational Runbook & Self-Healing Guide)

> **版本**: v1.0 | **最后更新**: 2025-07-16
>
> **本文件覆盖**：生产故障诊断方法论、按层分类的排错决策树、自动化诊断脚本、自愈与预防机制。
> 与 `deployment.md` 互补 — 后者管"怎么部署和监控"，本文件管"出了问题怎么科学定位和修复"。
> **核心理念**：AI 驱动开发中，诊断不靠猜、不靠试，靠**决策树 + 日志证据 + 可复现脚本**。

---

## 一、诊断方法论

### 1. 故障初诊四象限

收到故障报告后，首先按两个维度分类：

| | **单一端点/功能** | **全局/多功能** |
|---|---|---|
| **确定性复现** | A：代码 Bug（定位到具体函数） | B：基础设施故障（数据库/网关/DNS） |
| **间歇性出现** | C：竞态条件/资源争用 | D：资源泄漏/容量瓶颈 |

- **A 类**：直接查日志定位堆栈 → 修复 → 回归测试
- **B 类**：先确认基础设施存活（Docker ps、Nginx、Supabase）→ 恢复服务 → 根因分析
- **C 类**：增加日志密度 → 尝试构造并发压力复现 → 加锁/队列化
- **D 类**：查看资源趋势图（内存/连接数/磁盘）→ 定位泄漏点 → 修复 + 扩容

### 2. 黄金诊断顺序

**永远从外到内、从下到上**排查：

```
Step 1 → 基础设施层：服务器可达？Docker 容器运行？端口开放？
Step 2 → 网关层：      Nginx 日志有无 502/504？upstream 可达？
Step 3 → 应用层：      后端日志最近错误？启动正常？健康检查通过？
Step 4 → 数据层：      数据库连接正常？慢查询？锁等待？磁盘满？
Step 5 → 业务层：      具体接口逻辑错误？参数校验？第三方依赖超时？
```

### 3. 诊断纪律

- **先收集证据，再做假设**：禁止未看日志就"猜"原因
- **一次只改一个变量**：验证假设时禁止同时改多处
- **保留现场快照**：修复前先 `docker logs > /tmp/incident-{date}.log`
- **必须写事后记录**：每次 P0/P1 故障后填写事故记录（模板见 `deployment.md`）

---

## 二、按层诊断指南

### 2.1 Docker & 容器层

#### 症状：容器启动失败

```bash
# 第一步：查看容器状态
docker compose ps -a

# 第二步：查看退出日志
docker compose logs --tail=50 <service>

# 第三步：常见原因判断
```

| 日志关键词 | 根因 | 修复 |
|-----------|------|------|
| `ModuleNotFoundError` / `Cannot find module` | 依赖未安装 / Dockerfile COPY 遗漏 | 检查 package.json 和 Dockerfile |
| `port already in use` | 端口被占 | `lsof -i :<port>` 找到占用进程 |
| `no space left on device` | 磁盘满 | `docker system prune -f` + 清理旧镜像 |
| `permission denied` | 文件权限 / 非 root 用户问题 | 检查 Dockerfile USER 指令和卷权限 |
| `OOMKilled` | 内存超限 | 增大 `mem_limit` 或优化内存使用 |

#### 症状：容器频繁重启

```bash
# 检查重启次数和原因
docker inspect <container> --format='{{.RestartCount}} {{.State.OOMKilled}}'

# 查看内存使用趋势
docker stats --no-stream

# 如果 OOMKilled=true → 内存泄漏诊断流程（见 2.2）
# 如果 OOMKilled=false → 检查健康检查是否超时
docker inspect <container> --format='{{json .State.Health}}'
```

#### 症状：容器间网络不通

```bash
# 确认容器在同一 Docker 网络
docker network inspect <network>

# 从容器内部测试连通性
docker exec <container> curl -s http://<service>:<port>/health

# 常见原因：服务名拼写错误、depends_on 缺失、端口未 EXPOSE
```

#### 自动化诊断脚本

```bash
#!/bin/bash
# scripts/diagnose-docker.sh — Docker 层快速诊断
echo "=== 容器状态 ==="
docker compose ps -a
echo ""
echo "=== 资源使用 ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo ""
echo "=== 磁盘使用 ==="
docker system df
echo ""
echo "=== 最近错误日志 ==="
for svc in $(docker compose ps --services); do
  ERR=$(docker compose logs --tail=20 "$svc" 2>&1 | grep -iE "error|exception|fatal|killed" | tail -5)
  if [ -n "$ERR" ]; then
    echo "--- $svc ---"
    echo "$ERR"
  fi
done
```

---

### 2.2 后端 (Express/Node.js) 层

#### 症状：API 返回 5xx

```bash
# 第一步：查看最近错误日志
docker compose logs --tail=100 backend | grep -E "ERROR|Error|500"

# 第二步：区分错误类型
```

| 错误类型 | 识别方式 | 处理 |
|---------|---------|------|
| **代码异常** | 有 Error stack + 具体行号 | 定位代码修复 |
| **依赖超时** | `ETIMEDOUT` / `ECONNREFUSED` | 检查 Supabase/外部 API 存活 |
| **数据库错误** | `pg` / `supabase` 异常 | 跳转 2.4 数据库层诊断 |
| **验证错误** | `ZodError` | 检查请求参数和 Zod Schema |

#### 症状：API 响应缓慢（P95 > 1s）

```bash
# 第一步：确认是哪个端点慢
# 在 Nginx access log 中按响应时间排序
awk '{print $NF, $7}' /var/log/nginx/access.log | sort -rn | head -20

# 第二步：排查顺序
# 1. 数据库慢查询？ → 跳转 2.4
# 2. 外部 API 调用慢？ → 加超时配置 + 重试
# 3. 计算密集？ → 考虑缓存或异步任务
# 4. N+1 查询问题？ → 检查 ORM 查询模式
```

#### 症状：内存持续增长

```bash
# 第一步：确认内存趋势
docker stats --no-stream

# 第二步：常见泄漏源排查清单
# □ axios 实例未复用（每次请求创建新实例）→ 改为全局单例
# □ 数据库连接池未设上限 → 确认 pool max 配置
# □ 大列表查询未分页 → 强制 LIMIT
# □ 文件/流未关闭 → 使用 try-finally 或 Readable.destroy()
# □ 全局缓存无过期策略 → 设置 TTL 或 max
```

#### 断路器模式（防止级联故障）

```typescript
// 对外部依赖（第三方 API、微信支付等）使用重试 + 指数退避
import axios from 'axios'

async function callExternalApi(url: string, retries = 3): Promise<unknown> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await axios.get(url, { timeout: 5000 })
      return resp.data
    } catch (err) {
      if (attempt === retries) throw err
      const delay = Math.min(1000 * 2 ** (attempt - 1), 10000)
      await new Promise(r => setTimeout(r, delay))
    }
  }
}
```

---

### 2.3 前端 (React) 层

#### 症状：白屏

```
排查决策树：
1. 打开浏览器 DevTools → Console 有红色错误？
   ├─ Yes → 读错误信息，定位组件/文件
   └─ No → 继续 ↓
2. Network 面板 → JS/CSS 资源加载成功？
   ├─ 404 → 检查 Nginx 静态文件路由 / Vite base 配置
   ├─ CORS → 检查 Nginx CORS 头 / API 地址配置
   └─ 200 但空白 → 继续 ↓
3. 检查 index.html 中 <div id="root"> 是否被正确挂载
4. 检查环境变量 VITE_* 是否在构建时正确注入
```

#### 症状：组件崩溃（Error Boundary 捕获）

```typescript
// 标准 Error Boundary 实现（项目中应有全局兜底）
// 崩溃时显示友好页面 + 上报错误信息

// 排查步骤：
// 1. Error Boundary 中的 error.message 和 error.stack 定位源文件
// 2. 检查是否为 undefined 属性访问（最常见）
// 3. 检查是否为异步状态竞态（组件卸载后 setState）
// 4. 用 React DevTools Profiler 检查 render 崩溃点
```

#### 症状：前端性能问题

| 指标 | 目标值 | 诊断工具 | 常见原因 |
|------|--------|---------|---------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Lighthouse | 大图未压缩 / 字体阻塞 / 首屏数据慢 |
| **FID** (First Input Delay) | < 100ms | Chrome Performance | 长任务阻塞主线程 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse | 图片无尺寸 / 动态内容插入 |
| **Bundle Size** | < 300KB (gzip) | `npx vite-bundle-visualizer` | 未 tree-shake / 大依赖未按需引入 |

```bash
# 分析前端构建产物大小
cd frontend && npx vite build -- --report
# 或使用 rollup-plugin-visualizer 生成可视化报告
```

---

### 2.4 数据库 (PostgreSQL / Supabase) 层

#### 症状：连接失败

```bash
# 第一步：确认数据库进程存活
docker compose exec supabase-db pg_isready

# 第二步：检查连接数是否耗尽
docker compose exec supabase-db psql -U postgres -c \
  "SELECT count(*) AS active, max_conn FROM pg_stat_activity, 
   (SELECT setting::int AS max_conn FROM pg_settings WHERE name='max_connections') mc
   GROUP BY max_conn;"

# 如果 active ≈ max_conn → 连接池泄漏
# 紧急处理：终止空闲连接
docker compose exec supabase-db psql -U postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE state = 'idle' AND query_start < now() - interval '10 minutes';"
```

#### 症状：慢查询

```sql
-- 启用 pg_stat_statements（如未启用）
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查找最慢的 10 条查询
SELECT 
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) AS pct,
  left(query, 120) AS query_preview
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 对可疑查询执行 EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ... -- 粘贴慢查询
```

#### 症状：缺失索引检测

```sql
-- 查找全表扫描频繁的表（候选加索引）
SELECT 
  schemaname, relname AS table_name,
  seq_scan, seq_tup_read,
  idx_scan, idx_tup_fetch,
  CASE WHEN seq_scan > 0 
    THEN round(seq_tup_read::numeric / seq_scan, 0) 
    ELSE 0 END AS avg_rows_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_tup_read DESC
LIMIT 10;

-- 查找未使用的索引（候选清理）
SELECT 
  schemaname, relname AS table_name, indexrelname AS index_name,
  idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

#### 症状：锁等待 / 死锁

```sql
-- 查看当前锁等待
SELECT 
  blocked.pid AS blocked_pid,
  blocked.query AS blocked_query,
  blocking.pid AS blocking_pid,
  blocking.query AS blocking_query,
  now() - blocked.query_start AS wait_duration
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid
JOIN pg_locks kl ON kl.locktype = bl.locktype 
  AND kl.database IS NOT DISTINCT FROM bl.database
  AND kl.relation IS NOT DISTINCT FROM bl.relation
  AND kl.page IS NOT DISTINCT FROM bl.page
  AND kl.tuple IS NOT DISTINCT FROM bl.tuple
  AND kl.transactionid IS NOT DISTINCT FROM bl.transactionid
  AND kl.pid != bl.pid
  AND kl.granted
JOIN pg_stat_activity blocking ON blocking.pid = kl.pid
WHERE NOT bl.granted;

-- 紧急解锁（谨慎使用）
-- SELECT pg_terminate_backend(<blocking_pid>);
```

#### RLS 权限调试

```sql
-- 模拟特定用户的 RLS 上下文
SET request.jwt.claims = '{"sub": "用户UUID", "role": "authenticated"}';
SET role TO authenticated;

-- 测试查询（应该只返回该用户有权限看到的行）
SELECT * FROM target_table LIMIT 5;

-- 还原
RESET role;
RESET request.jwt.claims;
```

---

### 2.5 Nginx 网关层

#### 症状：502 Bad Gateway

```bash
# 第一步：查看 Nginx 错误日志
tail -50 /opt/gateway/logs/error.log

# 第二步：常见原因
```

| 日志关键词 | 根因 | 修复 |
|-----------|------|------|
| `connect() failed (111: Connection refused)` | 后端容器未启动/端口错误 | `docker compose ps` 确认后端存活 |
| `upstream timed out` | 后端处理超时 | 增大 `proxy_read_timeout` 或优化后端 |
| `no live upstreams` | 所有后端实例不可用 | 检查健康检查配置和后端日志 |

#### 症状：CORS 预检失败

```nginx
# 正确的 CORS 配置（必须同时处理 OPTIONS 预检）
location /api/ {
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Request-ID' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Max-Age' 86400;
        return 204;
    }
    # ... proxy_pass 配置
}
```

#### SSL 证书问题诊断

```bash
# 检查证书有效期
echo | openssl s_client -servername ideas.top -connect ideas.top:443 2>/dev/null | \
  openssl x509 -noout -dates

# 如果过期 → 续签 Let's Encrypt
certbot renew --dry-run  # 先测试
certbot renew            # 正式续签
nginx -s reload          # 重新加载
```

---

### 2.6 认证 & 权限层

#### 症状：Token 验签失败 (401)

```
排查清单：
□ Token 是否过期？ → 解码 JWT 检查 exp 字段
□ JWT_SECRET 前后端是否一致？ → 对比 env.md 中的 JWT_SECRET
□ Token 算法是否匹配？ → 必须 HS256
□ 前端请求是否携带了 Authorization 头？ → Network 面板检查
□ Nginx 是否转发了 Authorization 头？ → 确认 proxy_set_header
```

```bash
# 解码 JWT Token（不验签，仅查看 payload）
echo "<token>" | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -m json.tool
```

#### 症状：RLS 规则拒绝访问

```
排查顺序：
1. 确认请求使用的是 ANON_KEY 还是 SERVICE_ROLE_KEY
2. 在 Supabase Studio → SQL Editor 中模拟用户上下文（见 2.4 RLS 调试）
3. 检查 RLS 策略中的 auth.uid() 是否正确匹配
4. 检查是否遗漏了对应操作的策略（SELECT/INSERT/UPDATE/DELETE）
```

---

### 2.7 支付 & 第三方集成层

#### 症状：微信支付回调丢失

```
排查决策树：
1. Nginx access.log 中有回调请求记录吗？
   ├─ No → 回调 URL 配置错误 / 微信无法到达服务器（防火墙/DNS）
   └─ Yes → 继续 ↓
2. 后端日志中有处理记录吗？
   ├─ No → Nginx 路由未匹配 / 后端未启动
   └─ Yes → 继续 ↓
3. 签名验证通过了吗？
   ├─ No → 密钥/证书配置错误 → 检查 env.md 中的微信支付配置
   └─ Yes → 继续 ↓
4. 业务处理成功了吗？
   ├─ No → 查看具体业务错误日志
   └─ Yes → 是否返回了正确的响应？（微信要求返回 SUCCESS）
```

#### 防重复扣款检查

```sql
-- 检查是否有重复支付流水
SELECT 
  out_trade_no, COUNT(*) AS cnt, 
  array_agg(DISTINCT status) AS statuses
FROM payment_log
GROUP BY out_trade_no
HAVING COUNT(*) > 1;

-- 如果有重复 → 检查幂等键是否正确实现
-- 幂等规则：同一 out_trade_no 只处理第一次成功回调
```

---

### 2.8 WebSocket / Realtime 层

#### 症状：Realtime 连接频繁断开

```
排查清单：
□ Nginx WebSocket 代理配置是否正确？
  → 必须有 proxy_set_header Upgrade $http_upgrade;
  → 必须有 proxy_set_header Connection "upgrade";
□ Nginx proxy_read_timeout 是否过短？
  → WebSocket 空闲超时建议 ≥ 300s
□ 客户端是否实现了自动重连？
  → Supabase Realtime 自带重连，但需确认未被覆盖
```

#### Realtime 重连最佳实践

```typescript
// 指数退避重连策略
const channel = supabase
  .channel('my-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
    handleChange(payload);
  })
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      // Supabase 客户端会自动重试
      // 但如果持续失败，记录并通知
      console.error('Realtime channel error, will auto-retry');
    }
  });

// 页面可见性切换时重新订阅（移动端常见问题）
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    channel.subscribe();
  }
});
```

---

## 三、性能基准与优化

### 3.1 性能目标红线

| 指标 | 目标 | 告警阈值 | 测量方式 |
|------|------|---------|---------|
| 首屏加载 (LCP) | < 2.0s | > 3.0s | Lighthouse / Web Vitals |
| API P95 延迟 | < 500ms | > 1000ms | Nginx access log 分析 |
| API P99 延迟 | < 1000ms | > 2000ms | Nginx access log 分析 |
| 5xx 错误率 | < 0.1% | > 1% | Nginx error log 统计 |
| 前端 Bundle (gzip) | < 300KB | > 500KB | `vite build` 输出 |
| 数据库查询 P95 | < 100ms | > 500ms | pg_stat_statements |
| Docker 内存 | < 80% limit | > 90% | `docker stats` |

### 3.2 性能诊断脚本

```bash
#!/bin/bash
# scripts/diagnose-performance.sh — 性能快速诊断

echo "=== API 响应时间 Top 10（最近 1000 条请求）==="
tail -1000 /opt/gateway/logs/access.log | \
  awk '{print $NF"ms", $7}' | sort -rn | head -10

echo ""
echo "=== 数据库活跃连接与慢查询 ==="
docker compose exec -T supabase-db psql -U postgres -c "
  SELECT pid, now() - query_start AS duration, left(query, 80) AS query
  FROM pg_stat_activity
  WHERE state = 'active' AND query_start < now() - interval '1 second'
  ORDER BY query_start;"

echo ""
echo "=== Docker 资源使用 ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.MemUsage}}"
```

### 3.3 常见性能优化 Pattern

| 问题 | 识别方式 | 解决方案 |
|------|---------|---------|
| **N+1 查询** | 循环中多次 DB 查询 | 改为 JOIN 或 IN 批量查询 |
| **缺失索引** | EXPLAIN 显示 Seq Scan + 行数多 | 对 WHERE/JOIN/ORDER BY 列加索引 |
| **大列表无分页** | 单次返回 1000+ 行 | 强制 LIMIT + 分页（见 api-design.md） |
| **重复计算** | 相同参数频繁调用同函数 | node-cache / lru-cache 或 Redis 缓存 |
| **前端大 Bundle** | vite-bundle-visualizer 红色块 | 动态 import() + React.lazy |
| **图片未优化** | LCP 指向大图 | WebP 格式 + `loading="lazy"` + CDN |
| **连接未复用** | 每次请求创建新 axios 实例 | 全局 axios 单例复用 |

---

## 四、缓存策略

### 4.1 多级缓存架构

```
请求 → [浏览器缓存] → [CDN/Nginx 缓存] → [Redis 应用缓存] → [数据库]
         Cache-Control    proxy_cache       TTL-based          源数据
```

### 4.2 缓存使用规范

| 数据类型 | 缓存位置 | TTL | 失效策略 |
|---------|---------|-----|---------|
| 静态资源 (JS/CSS/图片) | 浏览器 + CDN | 1 年 (含 hash 文件名) | 文件名变化自动失效 |
| API 列表查询 | Redis | 5-60 分钟 | 写入时主动清除 |
| 用户 Session/Token | Redis | 与 Token 过期时间对齐 | 登出时主动删除 |
| 配置/字典数据 | lru_cache + Redis | 1-24 小时 | 后台更新后清除 |
| 实时数据 (余额/状态) | **不缓存** | — | 每次从数据库读取 |

### 4.3 缓存避坑

- **禁止缓存含用户敏感信息的响应**（Cache-Control: no-store）
- **Redis 缓存 Key 规范**：`{业务}:{资源}:{ID}` → 如 `product:list:page1`
- **缓存穿透防护**：查询为空时也缓存空结果（TTL 短，如 60s）
- **缓存雪崩防护**：TTL 加随机偏移量（±10%），避免同时过期

---

## 五、自愈与预防机制

### 5.1 自动化健康检查增强

```bash
#!/bin/bash
# scripts/health-watchdog.sh — 配合 cron 每 5 分钟执行
# 0,5,10,15,20,25,30,35,40,45,50,55 * * * * /opt/scripts/health-watchdog.sh

BACKEND_URL="http://localhost:8000/health"
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL:-}"

# 检查后端健康
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL")

if [ "$HTTP_CODE" != "200" ]; then
  echo "[$(date)] Backend health check failed: HTTP $HTTP_CODE" >> /var/log/watchdog.log
  
  # 自动重启后端容器
  docker compose restart backend
  echo "[$(date)] Backend container restarted" >> /var/log/watchdog.log
  
  # 发送告警（如果配置了 Webhook）
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -s -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\": \"⚠️ 后端健康检查失败 (HTTP $HTTP_CODE)，已自动重启\"}"
  fi
fi

# 检查磁盘使用
DISK_PCT=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_PCT" -gt 85 ]; then
  echo "[$(date)] Disk usage: ${DISK_PCT}%" >> /var/log/watchdog.log
  # 自动清理 30 天以上的日志
  find /var/log -name "*.log" -mtime +30 -delete
  docker system prune -f --filter "until=72h"
fi
```

### 5.2 预防性检查清单（每周执行）

```markdown
## 周运维检查清单

### 基础设施
- [ ] Docker 容器全部运行且无频繁重启
- [ ] 磁盘使用 < 70%
- [ ] SSL 证书有效期 > 30 天
- [ ] 数据库备份正常执行（检查最近 7 天的备份文件）

### 性能
- [ ] API P95 延迟稳定在目标范围内
- [ ] 无新增慢查询（> 500ms）
- [ ] 前端 Lighthouse 评分 > 90
- [ ] Docker 容器内存无持续增长趋势

### 安全
- [ ] 无异常登录尝试（检查 auth.audit_log_entries）
- [ ] 依赖包无高危漏洞（`npm audit`）
- [ ] RLS 策略覆盖所有公开表

### 数据
- [ ] 数据库连接数在合理范围（< 60% max_connections）
- [ ] 无未使用的索引占用空间
- [ ] 备份恢复测试通过（每月至少一次）
```

### 5.3 故障知识库

每次故障解决后，按以下格式记录到 `product/incident-log.md`：

```markdown
## [日期] 故障标题

- **发现时间**：
- **恢复时间**：
- **影响范围**：
- **严重级别**：P0 / P1 / P2 / P3
- **症状**：
- **根因**：
- **修复措施**：
- **预防措施**：（代码/配置/流程改进）
- **教训**：（一句话总结）
```

---

## 六、AI 诊断工作流

> 本节面向 AI 编程助手——当用户报告问题时，按此流程诊断。

### 6.1 AI 接收故障报告后的标准流程

```
1. 信息收集（向用户确认）
   → 什么时候开始出现？
   → 影响所有用户还是个别？
   → 最近有没有做过部署/修改？

2. 快速分类（按一-1 四象限）
   → 确定性 vs 间歇性？单一 vs 全局？

3. 证据收集（AI 自动执行）
   → docker compose ps -a
   → docker compose logs --tail=100 <service>
   → 查看 Nginx error.log
   → 查看数据库连接数和慢查询

4. 假设验证（AI 按决策树逐一排查）
   → 从最可能的根因开始
   → 每次只验证一个假设

5. 修复 + 验证
   → 修复后必须确认症状消失
   → 补写回归测试

6. 事后记录
   → 按 5.3 模板填写故障知识库
```

### 6.2 常用诊断命令速查

```bash
# 查看所有容器状态
docker compose ps -a

# 查看某个服务最近日志
docker compose logs --tail=100 <service>

# 查看容器资源使用
docker stats --no-stream

# 查看 Nginx 错误日志
tail -100 /opt/gateway/logs/error.log

# 查看数据库活跃连接
docker compose exec -T supabase-db psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# 测试后端健康
curl -s http://localhost:8000/health | python3 -m json.tool

# 测试数据库连通性
docker compose exec -T supabase-db pg_isready

# 检查端口监听
ss -tlnp | grep -E '80|443|8000|5432'

# 检查磁盘空间
df -h /

# 解码 JWT Token
echo "<token>" | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -m json.tool
```

---

## 附录：诊断脚本集合

将以下脚本放在项目 `scripts/` 目录下：

| 脚本 | 用途 | 执行频率 |
|------|------|---------|
| `diagnose-docker.sh` | Docker 层快速诊断（见 2.1） | 故障时手动执行 |
| `diagnose-performance.sh` | 性能瓶颈快速定位（见 3.2） | 故障时 / 每周 |
| `health-watchdog.sh` | 自动健康检查 + 自愈（见 5.1） | cron 每 5 分钟 |
| `db-find-slow-queries.sql` | 慢查询识别（见 2.4） | 每周 |
| `db-find-missing-indexes.sql` | 缺失索引检测（见 2.4） | 每月 |
| `db-check-locks.sql` | 锁等待检测（见 2.4） | 故障时 |
