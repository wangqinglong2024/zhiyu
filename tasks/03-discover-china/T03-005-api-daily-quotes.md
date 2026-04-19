# T03-005: 后端 API — 每日金句

> 分类: 03-发现中国 (Discover China)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 4

## 需求摘要

为「每日金句」功能开发后端 API 接口，包含：获取当日金句接口（含节日优先级、降级兜底逻辑）、金句历史列表接口。需实现节日金句优先级查询（四大传统节日 > 其他传统节日 > 节气 > 国际节日 > 常规）和无金句时的降级策略。

## 相关上下文

- 产品需求: `product/apps/02-discover-china/01-category-homepage.md` §二 — 每日金句卡片
- 产品需求: `product/apps/02-discover-china/06-data-nonfunctional.md` §一.1 — 金句数据流向
- 设计规范: `grules/04-api-design.md` — API 设计规约
- 设计规范: `grules/05-coding-standards.md` §三 — 后端规范（三层分离、Zod）
- 数据库: T03-002（daily_quotes 表）

## 技术方案

### API 端点设计

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/v1/daily-quotes/today` | Level 0（公开） | 获取当日金句 |
| GET | `/api/v1/daily-quotes` | Level 0（公开） | 金句历史列表（分页） |

### 获取当日金句 API

```
GET /api/v1/daily-quotes/today

Response 200:
{
  "code": 0,
  "data": {
    "id": "uuid",
    "quoteZh": "千里之行，始于足下。",
    "quotePinyin": "Qiān lǐ zhī xíng, shǐ yú zú xià.",
    "sourceZh": "老子《道德经》",
    "interpretationZh": "再远大的目标，都要从脚下的第一步开始。",
    "quoteEn": "A journey of a thousand miles begins with a single step.",
    "interpretationEn": "Even the grandest goals must begin with a single first step.",
    "quoteVi": "Hành trình vạn dặm bắt đầu từ một bước chân.",
    "interpretationVi": "Mục tiêu dù lớn lao đến đâu cũng phải bắt đầu từ bước đầu tiên.",
    "scheduledDate": "2026-04-18",
    "isHoliday": false,
    "holidayName": null,
    "holidayType": 5,
    "bgImageUrl": "https://..."
  }
}
```

**查询优先级逻辑**（在 Service 层实现）：

```
1. 查询当天排期的已发布金句
   a. 若有节日金句 → 按 holiday_type ASC 取最高优先级
   b. 若有常规金句 → 返回
2. 若当天无排期金句 → 降级查询最近一天的已发布金句
3. 若金句库完全为空 → 返回 null（data: null），前端隐藏金句区域
```

### 金句历史列表 API

```
GET /api/v1/daily-quotes?page=1&page_size=10

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      { "id": "uuid", "quoteZh": "...", "scheduledDate": "2026-04-18", ... }
    ],
    "total": 50,
    "page": 1,
    "page_size": 10,
    "has_next": true
  }
}
```

**业务逻辑**：
- 仅返回 scheduled_date ≤ 当天的已发布金句
- 按 scheduled_date DESC 排序
- 不含未来排期的金句

### 三层架构

```
backend/src/
├── routers/v1/
│   └── daily-quotes.router.ts   -- 路由定义 + Zod 校验
├── services/
│   └── daily-quote.service.ts   -- 业务逻辑（优先级、降级）
└── repositories/
    └── daily-quote.repository.ts -- Supabase 查询
```

### 缓存策略

- 当日金句接口响应添加 `Cache-Control: public, max-age=300`（5 分钟缓存）
- 金句在 0:00 UTC 自动切换，前端刷新页面后获取新金句

## 范围（做什么）

- 创建 `daily-quotes.router.ts` — 金句路由
- 创建 `daily-quote.service.ts` — 金句业务逻辑（含优先级/降级）
- 创建 `daily-quote.repository.ts` — 金句数据库查询
- 注册路由到 v1 路由汇总
- 实现节日优先级查询和降级兜底策略

## 边界（不做什么）

- 不写金句管理后台 API（Admin 模块）
- 不写金句前端组件（T03-007, T03-010）
- 不实现金句推送通知（后续迭代）
- 不实现 0:00 UTC 定时任务（前端刷新触发即可）

## 涉及文件

- 新建: `backend/src/routers/v1/daily-quotes.router.ts`
- 新建: `backend/src/services/daily-quote.service.ts`
- 新建: `backend/src/repositories/daily-quote.repository.ts`
- 修改: `backend/src/routers/v1/index.ts` — 注册新路由

## 依赖

- 前置: T03-002（daily_quotes 表已创建）
- 后续: T03-007（类目首页金句展示）, T03-010（金句分享）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 今日有一条已发布的常规金句  
   **WHEN** 调用 `GET /api/v1/daily-quotes/today`  
   **THEN** 返回该金句的完整信息（含 zh/pinyin/en/vi 全部字段）

2. **GIVEN** 今日同时有一条节日金句（holiday_type=1）和一条常规金句  
   **WHEN** 调用 `GET /api/v1/daily-quotes/today`  
   **THEN** 返回节日金句（优先级更高），isHoliday=true

3. **GIVEN** 今日无排期金句，但昨日有  
   **WHEN** 调用 `GET /api/v1/daily-quotes/today`  
   **THEN** 返回昨日金句（降级策略）

4. **GIVEN** 金句库完全为空  
   **WHEN** 调用 `GET /api/v1/daily-quotes/today`  
   **THEN** 返回 `{ "code": 0, "data": null }`

5. **GIVEN** 有 25 条已发布金句  
   **WHEN** 调用 `GET /api/v1/daily-quotes?page=1&page_size=10`  
   **THEN** 返回 10 条金句 + total=25 + has_next=true

6. **GIVEN** 有未来日期排期的金句  
   **WHEN** 调用 `GET /api/v1/daily-quotes` 列表接口  
   **THEN** 未来日期的金句不在列表中

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 插入测试金句数据（含节日金句和常规金句）
5. 通过 curl 调用 today 接口，验证优先级逻辑
6. 清空当日金句，验证降级逻辑
7. 调用列表接口验证分页

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 当日金句接口正确返回（含节日优先级）
- [ ] 降级策略正确（无当日金句时返回最近金句）
- [ ] 空库返回 data: null
- [ ] 历史列表分页正确
- [ ] 未来金句不在列表中
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/03-discover-china/` 下创建同名结果文件

结果文件路径: `/tasks/result/03-discover-china/T03-005-api-daily-quotes.md`

## 自检重点

- [ ] 安全：金句接口无需认证（Level 0），但仅暴露 published 状态
- [ ] 性能：当日金句查询使用 scheduled_date 索引
- [ ] 健壮性：降级策略覆盖所有边界（无当日金句、空库）
- [ ] 缓存：响应头 Cache-Control 正确设置
