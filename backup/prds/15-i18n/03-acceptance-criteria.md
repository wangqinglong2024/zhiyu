# 15.3 · i18n · 验收准则

## 功能
- [ ] I18N-AC-001：4 语种 UI 完整覆盖
- [ ] I18N-AC-002：缺失 key 回退 en + dev 警告
- [ ] I18N-AC-003：URL 前缀 /en /vi /th /id 正确
- [ ] I18N-AC-004：根 / 重定向到首选语
- [ ] I18N-AC-005：用户偏好覆盖浏览器
- [ ] I18N-AC-006：内容 4 语种 JSONB 切换实时
- [ ] I18N-AC-007：缺失语回退 en
- [ ] I18N-AC-008：字体动态加载（th=Sarabun, vi=Be Vietnam Pro）
- [ ] I18N-AC-009：date / 数字 本地化
- [ ] I18N-AC-010：hreflang + sitemap 每语独立
- [ ] I18N-AC-011：邮件 4 语种模板
- [ ] I18N-AC-012：错误码客户端可翻译
- [ ] I18N-AC-013：CI 缺 key 阻断

## 非功能
- [ ] locale 资源加载 < 200ms（CDN）
- [ ] 字体渲染 swap（无 FOIT）
- [ ] WCAG 字体可读性

## 测试用例
1. 浏览器 Accept-Language=vi → 根 / 重定向 /vi
2. 用户登录后切换至 th → cookie + preferences.ui_lang=th
3. 同页 EN → VI 切 → UI + 内容同时变
4. 一篇文章只有 en/vi 翻译，访问 /th/ → 内容回退 en，UI 仍 th
5. 泰文页字体使用 Sarabun
6. /th/discover/... 的 hreflang 含全 4 语 alt
7. PR 加新 key 仅 en → CI 失败

## 内容覆盖（W0）
- [ ] UI 4 语种 100%
- [ ] 600 文章 4 语种 100%
- [ ] 20K 知识点 4 语种 100%
- [ ] 邮件 4 语种 100%
- [ ] 隐私 / 服务条款 4 语种 100%
