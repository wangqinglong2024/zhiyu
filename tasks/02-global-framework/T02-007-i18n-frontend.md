# T02-007: 多语言系统 — 前端 i18n 框架

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 10

## 需求摘要

实现知语 Zhiyu 前端完整的多语言框架。包含：UI 语言切换（zh/en/vi）、内容学习模式切换（拼音+汉字 / 纯汉字）、解释语言联动规则、浏览器语言自动检测、语言包异步加载与缓存、`useTranslation` Hook。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/03-language-system.md` — 完整 i18n 规则
  - §一: UI 语言 3 种（zh/en/vi），浏览器检测默认语言
  - §二: 学习模式 2 种（拼音+汉字 / 纯汉字），仅影响内容展示
  - §三: 解释语言联动规则：UI 为 zh 时禁用解释语言切换；UI 为 en/vi 时解释语言自动跟随 UI 语言，用户可手动切换
- 设计规范: `grules/01-rules.md` §二.3 — 语言体系说明
- 编码规范: `grules/05-coding-standards.md` §二.1 — 前端规范（no any / Zod / TanStack Query）
- 关联任务: T02-006（后端 API 就绪）→ 本任务 → T02-008（主题系统）、全部前端模块

## 技术方案

### 语言系统三维度

| 维度 | 选项 | 存储位置 | 默认值 |
|------|------|---------|--------|
| UI 语言 | zh / en / vi | profiles.ui_language (登录) / localStorage (未登录) | 浏览器语言自动检测 |
| 学习模式 | pinyin / hanzi_only | profiles.learning_mode (登录) / localStorage (未登录) | pinyin |
| 解释语言 | zh / en / vi | profiles.explanation_language (登录) / localStorage (未登录) | 跟随 UI 语言 |

### 浏览器语言检测逻辑

```typescript
function detectBrowserLanguage(): 'zh' | 'en' | 'vi' {
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  if (lang.startsWith('vi')) return 'vi'
  return 'en'  // 默认 fallback
}
```

### 联动规则

```
UI 语言 → 设为 zh:
  - 解释语言切换 → 禁用（自动设为 zh）
  
UI 语言 → 设为 en:
  - 解释语言切换 → 启用（默认跟随设为 en）
  
UI 语言 → 设为 vi:
  - 解释语言切换 → 启用（默认跟随设为 vi）

用户手动切换解释语言 → 不再自动跟随 UI 语言（直到 UI 语言再次变更）
```

### 组件架构

```
frontend/src/features/i18n/
├── contexts/
│   └── I18nContext.tsx             # 三维度语言状态 Context + Provider
├── hooks/
│   ├── use-translation.ts         # t('key') 翻译 Hook
│   ├── use-language.ts            # 切换语言相关操作
│   └── use-learning-mode.ts       # 学习模式切换
├── services/
│   └── i18n-service.ts            # 语言包加载 API 调用
├── utils/
│   ├── detect-language.ts         # 浏览器语言检测
│   └── format.ts                  # 插值格式化 t('hello', { name: 'xxx' })
├── types.ts                       # UILanguage, LearningMode, ExplanationLanguage 类型
└── index.ts
```

### 语言包加载策略

1. 首屏加载：`/api/v1/i18n/{lang}/common` + `/api/v1/i18n/{lang}/auth`（关键 namespace）
2. 懒加载：各模块进入时加载对应 namespace（discover/course/game）
3. 缓存：TanStack Query `staleTime: 1 hour`，语言切换时重新拉取

### `useTranslation` Hook API

```typescript
const { t, lang, setLang, learningMode, setLearningMode } = useTranslation()

// t('auth.login.title')  → 返回对应语言翻译
// t('welcome', { name: '张三' })  → 插值: "欢迎，张三"
// t('missing.key')  → 开发模式显示红色 key，生产模式显示 key 本身
```

## 范围（做什么）

- 实现 `I18nContext` 及 `I18nProvider`（三维度状态管理）
- 实现 `useTranslation` Hook（t 函数 + 插值支持）
- 实现 `useLanguage` Hook（切换 UI 语言 + 联动逻辑）
- 实现 `useLearningMode` Hook（拼音/纯汉字切换）
- 实现浏览器语言自动检测
- 实现语言包异步加载（按 namespace 懒加载）
- 实现解释语言联动规则（UI=zh 时禁用切换）
- 登录用户：语言偏好写入 profiles 表
- 未登录用户：语言偏好存 localStorage
- 开发模式缺失翻译键醒目提示

## 边界（不做什么）

- 不实现后端翻译 API（T02-006 已完成）
- 不实现管理后台翻译管理界面（T13）
- 不实现文章/课程内容级别的翻译（各模块自行处理）
- 不实现语言切换 UI 组件（T02-012 Header 组件中实现）

## 涉及文件

- 新建: `frontend/src/features/i18n/contexts/I18nContext.tsx`
- 新建: `frontend/src/features/i18n/hooks/use-translation.ts`
- 新建: `frontend/src/features/i18n/hooks/use-language.ts`
- 新建: `frontend/src/features/i18n/hooks/use-learning-mode.ts`
- 新建: `frontend/src/features/i18n/services/i18n-service.ts`
- 新建: `frontend/src/features/i18n/utils/detect-language.ts`
- 新建: `frontend/src/features/i18n/utils/format.ts`
- 新建: `frontend/src/features/i18n/types.ts`
- 新建: `frontend/src/features/i18n/index.ts`
- 修改: `frontend/src/App.tsx`（挂载 I18nProvider）

## 依赖

- 前置: T02-006（后端 i18n API 提供翻译数据）
- 后续: 全部前端模块均依赖 `useTranslation` Hook

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户首次访问，浏览器语言为越南语  
   **WHEN** 页面加载  
   **THEN** UI 自动显示越南语文案

2. **GIVEN** 当前 UI 语言为 en  
   **WHEN** 调用 `setLang('zh')`  
   **THEN** UI 文案切换为中文 + 解释语言自动设为 zh + 解释语言切换禁用

3. **GIVEN** 当前 UI 语言为 zh  
   **WHEN** 调用 `setLang('en')`  
   **THEN** UI 文案切换为英文 + 解释语言自动设为 en + 解释语言切换启用

4. **GIVEN** 翻译键 `auth.login.title` 存在  
   **WHEN** 调用 `t('auth.login.title')`  
   **THEN** 返回对应语言翻译文案

5. **GIVEN** 翻译键 `missing.key` 不存在  
   **WHEN** 调用 `t('missing.key')` 在开发模式  
   **THEN** 返回红色标记的 "missing.key"

6. **GIVEN** 用户已登录  
   **WHEN** 切换 UI 语言  
   **THEN** 偏好同步写入 profiles.ui_language

7. **GIVEN** 用户未登录  
   **WHEN** 切换 UI 语言  
   **THEN** 偏好存入 localStorage

8. **GIVEN** 学习模式为 pinyin  
   **WHEN** 查看中文内容  
   **THEN** 拼音注音 + 汉字同时显示

9. **GIVEN** 切换 UI 语言到 vi  
   **WHEN** 查看 auth namespace  
   **THEN** 如果 auth namespace 翻译未加载，先显示加载态，加载完成后切换

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. Browser MCP 访问前端
4. 验证默认语言检测（模拟不同浏览器语言）
5. 切换 UI 语言到 zh/en/vi，验证文案切换
6. 验证解释语言联动规则
7. 验证所有 GIVEN-WHEN-THEN 验收标准

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 三语切换正常（zh/en/vi）
- [ ] 浏览器语言自动检测正确
- [ ] 解释语言联动规则正确
- [ ] 翻译插值正确
- [ ] 缺失翻译键开发模式提示正确
- [ ] 控制台无 Error 级别日志

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-007-i18n-frontend.md`

## 自检重点

- [ ] 安全：用户输入不会注入翻译文案（插值需 HTML 转义）
- [ ] 性能：语言包按 namespace 懒加载，非一次全量
- [ ] 性能：TanStack Query 缓存 + staleTime 避免重复请求
- [ ] 联动：UI=zh 时解释语言切换必须禁用
- [ ] 类型安全：UILanguage | LearningMode | ExplanationLanguage 类型正确
