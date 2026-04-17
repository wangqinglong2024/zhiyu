# QA 测试规范 (QA Testing Standards)

> **版本**: v2.0 | **最后更新**: 2026-04-17
>
> **适用范围**：所有基于 Vite React/TS + Express/TS/Node.js + Supabase + Docker 技术栈的项目。
> **核心工具**：Browser MCP（Puppeteer）进行真实浏览器测试；gstack `/browse` + `/qa` 技能。
> **铁律**：所有服务必须通过 Docker 启动后测试。禁止在宿主机安装 Node.js 等运行时直接测试。

---

## 一、测试环境要求

### 1. Docker 强制规则
```
⚠️ 绝对禁止在宿主机环境启动服务进行测试 ⚠️
```
- 前端：必须通过 Docker 容器运行（Nginx 托管构建产物 或 Vite dev server 容器化）
- 后端：必须通过 Docker 容器运行 Express/Node.js（在容器内启动）
- 数据库：Supabase 本身已是 Docker 部署，直接使用
- 网关：通过 `/opt/gateway/` 的 Nginx 容器统一代理

### 2. 测试环境启动流程
```bash
# 1. 构建并启动所有服务
docker compose up -d --build

# 2. 确认服务健康
docker compose ps                     # 所有容器 Up
docker compose logs --tail=20 backend # 后端无报错
docker compose logs --tail=20 frontend # 前端构建成功

# 3. 确认网络连通
# 前端通过 Nginx 反向代理可访问
# 后端 API 通过 Nginx 路由可达
# Supabase 通过 Docker 网络（global-data-link）互通
```

### 3. Docker Compose 测试配置要点
```yaml
# 测试用的 Docker Compose 必须确保：
services:
  frontend:
    build: ./frontend
    # 挂载到 Nginx 或独立容器
  backend:
    build: ./backend
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - gateway_net
      - global-data-link
networks:
  gateway_net:
    external: true
  global-data-link:
    external: true
```

---

## 二、Browser MCP 测试方法论

### 1. 工具说明
Browser MCP（基于 Puppeteer）已配置就绪，AI 可直接调用以下能力：
- 导航到指定 URL
- 截取页面截图
- 点击按钮/链接
- 填写表单
- 读取页面文本内容
- 执行 JavaScript 表达式
- 监控控制台错误
- 检查元素可见性/状态

### 2. 测试执行原则
- **以用户视角测试**：不看源码，只通过界面操作验证功能
- **每次交互后检查控制台**：JS 错误即使不影响界面展示，也算 Bug
- **截图作为证据**：关键步骤必须截图，修复前后必须有对比截图
- **测试真实数据流**：请求必须经过完整链路 → Nginx → Express/Node.js → Supabase

---

## 三、测试层级与分类

### 1. 冒烟测试（Smoke Test）— 每次部署后必做
验证核心链路是否能跑通，耗时 < 2 分钟：

| 检查项 | 方法 | 通过标准 |
|--------|------|---------|
| 首页加载 | 导航到首页，检查标题 | 页面正常渲染，无白屏 |
| 控制台干净 | 读取控制台消息 | 无 Error 级别日志 |
| API 健康 | 访问 `/api/v1/health` | 返回 200 |
| 静态资源 | 检查图片/字体/CSS 加载 | 无 404 请求 |
| 核心导航 | 点击前 5 个导航链接 | 全部正常跳转 |

### 2. 功能测试（Functional Test）— 每个功能任务完成后必做
针对当前开发的具体功能，验证完整业务流程：

```
测试流程模板：
1. 前置条件准备（登录/创建测试数据）
2. 执行核心操作（填表单、点按钮、触发业务）
3. 验证结果（页面变化、数据库写入、Toast 提示）
4. 验证边界情况（空输入、超长文本、重复提交）
5. 验证错误处理（无网络、Token 过期、权限不足）
6. 截图记录
```

### 3. 端到端测试（E2E Test）— 关键业务流程
完整模拟用户从进入到完成目标的全链路：

**典型 E2E 场景：**
- 新用户：打开首页 → 注册 → 验证邮箱 → 完善资料 → 进入主功能页
- 核心业务：登录 → 创建资源 → 编辑 → 保存 → 刷新验证持久化
- 支付流程：选商品 → 加购物车 → 下单 → 调起支付 → 回调验证

### 4. 回归测试（Regression Test）— 修复 Bug 后必做
```
回归测试流程：
1. 复现原始 Bug（截图记录 Bug 现场）
2. 应用修复代码
3. 重新部署 Docker 容器（docker compose up -d --build）
4. 再次执行触发 Bug 的操作
5. 确认 Bug 已修复（截图记录修复后状态）
6. 测试相邻功能无回归（修复没有引入新问题）
7. 提交回归测试用例（永久保留，防止复发）
```

---

## 四、测试执行标准流程

### Phase 1：环境确认
```
□ Docker 服务全部 Running（docker compose ps）
□ 前端页面可正常访问
□ 后端 API 可正常响应
□ Supabase 数据库连接正常
□ Nginx 代理转发正常
```

### Phase 2：基线截图
```
□ 首页截图（Light 模式 + Dark 模式）
□ 核心功能页截图
□ 空状态页截图
□ 记录当前控制台状态（应无 Error）
```

### Phase 3：功能遍历
```
对每个页面/功能：
□ 导航到目标页面
□ 截图记录初始状态
□ 执行所有可交互元素（按钮、链接、表单）
□ 每次交互后检查控制台
□ 验证数据变更是否正确持久化（刷新页面确认）
□ 测试表单验证（提交空值、超长值、特殊字符）
□ 测试加载状态和错误状态
```

### Phase 4：响应式测试（断点参考 `ui-design.md` §五）
```
□ 桌面视窗 (1280x720) 截图
□ 平板视窗 (768x1024) 截图
□ 手机视窗 (375x812) 截图
□ 超宽屏 (1920x1080) 无错位
□ 毛玻璃效果在各尺寸下正常渲染
□ 色彩/字体/间距/圆角体系一致（参照 ui-design.md §八 设计 QA 清单）
```

### Phase 5：记录与报告

---

## 四-B、测试数据管理

### 原则
- 测试数据与生产数据严格隔离
- 测试完成后必须清理，禁止残留脏数据
- 禁止使用真实用户数据做测试

### 测试用户约定
```
测试账号统一前缀：test_
测试邮箱格式：test_xxx@test.local
测试手机号：以 100 开头的假号码（如 10012345678）
```

### 种子数据脚本
```sql
-- scripts/seed-data.sql
-- 每个项目维护一份，用于初始化测试环境

-- 测试用户（通过 Supabase Auth API 创建，不直接操作 auth.users）
-- 在此放业务数据种子

INSERT INTO public.categories (name, sort_order) VALUES
  ('测试分类A', 1),
  ('测试分类B', 2);

-- 标记为种子数据，方便清理
-- 所有种子数据的 created_by 统一使用固定 test UUID
```

### 清理规则
- 每次完整 QA 测试结束后，执行清理脚本删除 `test_` 前缀的测试数据
- 禁止用 `TRUNCATE` 或 `DELETE FROM table`（误杀真实数据）
- 清理脚本必须带 WHERE 条件精确删除

---

## 五、Bug 报告格式

每个 Bug 必须包含以下信息：

```markdown
### BUG-NNN: 简短标题

**严重级别**: 严重 / 高 / 中 / 低
**分类**: 功能 / 视觉 / 性能 / 控制台错误 / 安全
**影响页面**: /path/to/page

**复现步骤**:
1. 打开 xxx 页面
2. 点击 xxx 按钮
3. 输入 xxx 内容
4. 观察到...

**预期行为**: 应该显示成功提示并跳转到列表页
**实际行为**: 页面卡死，控制台报错 TypeError

**截图证据**:
- 操作前: [截图路径]
- 操作后: [截图路径]
- 控制台错误: [截图路径]

**环境信息**:
- 视窗尺寸: 1280x720
- Docker 容器状态: Running
- 浏览器: Chromium (Puppeteer)
```

---

## 六、Bug 修复验证流程

### 修复 → 验证 → 提交（原子循环）

```
对每个 Bug：

1. 定位问题源码
   - 根据 Bug 报告的页面/错误信息搜索代码
   - 只修改直接相关的文件（最小化变更原则）

2. 编写修复代码
   - 一个 Bug 一个修复，禁止在修 Bug 时顺手重构

3. 重新构建 Docker 容器
   docker compose up -d --build <对应服务>

4. 浏览器验证
   - 重复 Bug 的复现步骤
   - 截图记录修复后的状态
   - 检查控制台无新增错误
   - 测试相邻功能无回归

5. 原子提交
   git add <修复相关文件>
   git commit -m "fix(<scope>): BUG-NNN — 简短描述"

6. 编写回归测试
   - 测试必须模拟触发 Bug 的条件
   - 测试通过后提交
   git commit -m "test(<scope>): 回归测试 BUG-NNN"
```

---

## 七、健康评分体系

> 对每次完整 QA 测试输出一个健康评分，量化应用质量。

### 评分维度与权重

| 维度 | 权重 | 评分规则 |
|------|------|---------|
| 控制台健康 | 15% | 0 Error = 100分；1-3 = 70；4-10 = 40；10+ = 10 |
| 功能完整性 | 25% | 按核心功能通过率计算 |
| 视觉正确性 | 15% | 严重布局问题 -25/条，中等 -8/条，轻微 -3/条 |
| 响应式适配 | 10% | 3 个主要视窗均正常 = 100 |
| 性能感知 | 10% | 页面加载 <2s = 100，2-5s = 60，>5s = 20 |
| 安全基线 | 15% | 对照安全规范检查表打分 |
| 用户体验 | 10% | 交互流畅度、错误提示友好度、空状态处理 |

### 综合评分
```
健康分 = Σ(维度分数 × 权重)

≥ 90分：可发布（优秀）
70-89分：需修复高优问题后可发布
50-69分：需较大改进
< 50分：不可发布，需全面修复
```

---

## 八、自我调控机制

> 防止 QA 过程中陷入无限修复循环。

### 停止信号
- 连续修复 3 个 Bug 后引入新问题 → 停下评估整体方案
- 累计修改 > 15 个文件 → 停下检查是否偏离任务范围
- 修复同一区域的代码 > 3 次 → 停下，可能是架构问题需要重新设计
- 单次 QA 修复超过 20 个 Bug → 强制停止，上报状态

### WTF 风险指数
```
从 0% 开始计算：
  每次回退(revert)：      +15%
  每次修复触及 > 3 个文件：+5%
  修复数超过 15 个后：     每个 +1%
  触及不相关文件：         +20%

风险 > 20% → 必须暂停，向用户报告当前状态
```

---

## 九、测试场景模板库

> 以下是常见业务场景的测试 checklist，开发新功能时按需选用。

### 登录/注册
```
□ 正常注册流程（合法邮箱 + 合法密码）
□ 重复邮箱注册 → 应提示"已注册"
□ 密码强度不足 → 应提示密码规则
□ 空表单提交 → 应显示字段校验错误
□ 登录成功 → 跳转到主页，Header 显示用户信息
□ 登录失败 → 显示明确的错误提示（不泄露"用户存在"信息）
□ Token 过期 → 自动跳转到登录页
□ 连续多次登录失败 → 应触发限流
```

### CRUD 操作
```
□ 创建：填写完整字段 → 提交成功 → 列表刷新可见
□ 创建：必填字段留空 → 提交被拦截，显示校验提示
□ 读取：列表分页加载正常，翻页无重复数据
□ 读取：空列表显示友好空状态（非白屏）
□ 更新：修改字段 → 保存成功 → 刷新后数据持久化
□ 删除：需二次确认 → 确认后删除 → 列表移除该项
□ 删除：取消确认 → 数据不变
□ 权限：用户 A 不可修改/删除用户 B 的数据
```

### 文件上传
```
□ 上传合法文件 → 成功，显示预览
□ 上传超大文件 → 提示文件大小限制
□ 上传非法格式 → 提示格式不支持
□ 上传 0 字节文件 → 合理处理
□ 网络中断时上传 → 不卡死，有错误提示
```

### 实时功能（Realtime）
```
□ 订阅建立 → WebSocket 连接成功
□ 数据变更 → 前端实时收到更新
□ 断网重连 → 自动重新订阅
□ 多用户同时操作 → 数据一致性
```

---

## 十、测试报告模板

```markdown
# QA 测试报告

## 概要
- **项目**: [项目名]
- **测试日期**: YYYY-MM-DD
- **测试范围**: [本次测试覆盖的功能/页面]
- **Docker 环境**: 全部服务通过 Docker 启动 ✅
- **健康评分**: XX/100

## 测试环境
- 前端容器: [镜像名:版本]
- 后端容器: [镜像名:版本]
- Supabase: [版本]
- Nginx 网关: [配置摘要]

## 测试结果摘要
| 指标 | 数值 |
|------|------|
| 测试页面数 | N |
| 发现 Bug 数 | N |
| 已修复 Bug 数 | N |
| 修复验证通过 | N |
| 延迟修复 | N |
| 截图数量 | N |

## Bug 列表
### 严重 (Critical)
（无 / BUG-NNN 列表）

### 高 (High)
（无 / BUG-NNN 列表）

### 中 (Medium)
（无 / BUG-NNN 列表）

### 低 (Low)
（无 / BUG-NNN 列表）

## 健康评分明细
| 维度 | 得分 | 说明 |
|------|------|------|
| 控制台健康 | /100 | |
| 功能完整性 | /100 | |
| 视觉正确性 | /100 | |
| 响应式适配 | /100 | |
| 性能感知 | /100 | |
| 安全基线 | /100 | |
| 用户体验 | /100 | |
| **综合** | **/100** | |

## 修复记录
| Bug | 修复状态 | Commit | 截图 |
|-----|---------|--------|------|
| BUG-001 | ✅ 验证通过 | abc1234 | 前/后 |

## 延迟修复项
| Bug | 原因 | 建议处理时间 |
|-----|------|------------|

## 回归测试
| Bug | 回归测试文件 | 通过 |
|-----|------------|------|
```

---

## 十一、Docker 故障排查清单

> 测试失败时，按以下顺序逐层排查，从基础设施到应用层。

### Layer 0：Docker 引擎
```bash
docker compose ps                          # 所有容器状态必须为 Up
docker compose logs --tail=50 <service>    # 查看最近日志
docker inspect <container> --format '{{.State.ExitCode}}'  # 退出码非 0 = 异常
```

### Layer 1：网络连通性
```bash
# 容器间能否互通
docker compose exec backend ping frontend
docker compose exec backend curl -f http://frontend:80
# Supabase 连接
docker compose exec backend curl -f $SUPABASE_URL/rest/v1/ -H "apikey: $SUPABASE_ANON_KEY"
```

### Layer 2：端口映射
```bash
# 宿主机能否访问
curl -f http://localhost:${DEV_FE_PORT:-3100}    # 前端
curl -f http://localhost:${DEV_BE_PORT:-8100}/api/v1/health  # 后端
```

### Layer 3：应用层
```bash
# 前端构建是否成功
docker compose exec frontend ls /usr/share/nginx/html/index.html
# 后端是否正常启动
docker compose exec backend node -e "console.log('OK')"
# 环境变量是否注入
docker compose exec backend env | grep SUPABASE
```

### 常见问题速查

| 现象 | 原因 | 修复 |
|------|------|------|
| 容器反复重启 | 启动命令失败或 OOM | 检查 logs + 增加 memory limit |
| 前端白屏 | Vite 构建失败或 nginx.conf 错误 | 检查构建日志 + try_files 配置 |
| 后端 502 | Nginx upstream 地址错误 | 检查 proxy_pass 指向容器名:端口 |
| CORS 报错 | Nginx 和 Express 双重 CORS 冲突 | 统一在一层处理，禁止两层都加 |
| Supabase 连接超时 | 网络名错误或 Supabase 未启动 | 确认 `global-data-link` 网络存在 |
| 环境变量为空 | `.env` 文件路径错误或变量名拼写 | `docker compose config` 验证 |

---

## 十二、性能基线测试

> 每次发版前必须测量并记录以下性能指标。

### 前端性能基线

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| 首屏加载 (FCP) | < 1.5s | Lighthouse / Browser MCP |
| 最大内容绘制 (LCP) | < 2.5s | Lighthouse |
| 累计布局偏移 (CLS) | < 0.1 | Lighthouse |
| 首次输入延迟 (INP) | < 200ms | Lighthouse |
| JS Bundle 大小 | < 300KB (gzip) | `npx vite-bundle-visualizer` |

### 后端性能基线

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| API 响应时间 (P50) | < 100ms | 日志统计 / 健康检查 |
| API 响应时间 (P95) | < 500ms | 日志统计 |
| 数据库查询时间 | < 50ms (单查询) | PostgreSQL `pg_stat_statements` |
| 内存使用 | < 256MB (Node.js) | `docker stats` |
| 容器启动时间 | < 10s | Docker healthcheck 首次通过时间 |

### 自动化性能回归检测
```bash
# 在 CI/CD 或发版前运行
# 1. 构建并启动
docker compose up -d --build

# 2. 等待健康检查通过
until curl -f http://localhost:8100/api/v1/health; do sleep 2; done

# 3. 运行 Lighthouse（需 chrome headless）
npx lighthouse http://localhost:3100 --output=json --output-path=./perf-report.json --chrome-flags="--headless --no-sandbox"

# 4. 提取关键指标并与基线比较
# FCP/LCP/CLS 超过基线 20% → 标记为性能回归
```

---

## 十三、CI/CD 集成规范

> 虽然 AI 开发以本地 Docker 为主，但项目成熟后应建立自动化流水线。

### GitHub Actions 标准模板
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 前端检查
      - name: Frontend lint & build
        run: |
          cd frontend
          npm ci
          npm run build        # 零编译错误

      # 后端检查
      - name: Backend lint & build
        run: |
          cd backend
          npm ci
          npm run build        # TypeScript 编译

      # Docker 构建验证
      - name: Docker build
        run: docker compose build

      # 集成测试（可选，需要 Supabase 连接）
      # - name: Integration test
      #   run: docker compose up -d && ./scripts/run-tests.sh
```

### 质量门禁（CI 必须通过）
- 前端 `npm run build` 零错误
- 后端 TypeScript 编译零错误
- Docker 镜像构建成功
- （可选）Lighthouse 性能评分 ≥ 80
- （可选）单元测试通过率 100%
