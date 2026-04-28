# ACR-02 · 4 主题与 12 阶段元信息管理

## PRD 原文引用

- `AD-FR-006`：“CR：tracks/stages 树形。”
- `planning/prds/03-courses/04-data-model-api.md` §1.1-1.2：tracks/stages 字段定义。
- `planning/ux/00-index.md`：“系统课程用户可见术语统一叫‘主题’...历史文档或代码里的 track 仅作为内部 code。”

## 需求落实

- 页面：`/admin/content/courses/:theme`、`/admin/content/courses/:theme/stages/:stage`。
- 组件：ThemeEditForm、StageEditForm、TranslationsEditor（多语 tabs）、IconUploader、HskRangePicker（仅 HSK 主题显示）、PrerequisiteAdvicePicker。
- API：
  - `GET/PATCH /admin/api/content/courses/tracks/:code`
  - `GET/PATCH /admin/api/content/courses/stages/:id`
  - `POST /admin/api/content/courses/stages/:id/publish`
  - `POST /admin/api/content/courses/stages/:id/archive`

## 状态逻辑

- 4 个主题不可删（system seed），内部 `track_code` 只读；仅可改 name_translations / description / icon / display_order。
- Stage status 切换：draft → published（发布）；published → archived（撤回）。
- HSK 字段仅 HSK 主题显示；切换其他主题时该字段隐藏。
- 多语翻译：tab 切换；缺失语标红 + ”待翻译“。

## 不明确 / 风险

- 风险：误改内部 `track_code` 会破坏所有引用。
- 处理：`track_code` 只读；表单对运营展示“主题 code”，不可编辑。

## 技术假设

- TranslationsEditor 复用 ADC（发现中国后台）已实现的组件。
- 写操作均经 audit_logs（before/after diff）。

## 最终验收清单

- [ ] 4 主题编辑（name/icon/order）保存成功。
- [ ] HSK Stage 1 编辑 hsk_level_range，电商 Stage 1 不显示该字段。
- [ ] 多语翻译完整度图标显示正确（5 语：zh + 4 ui_lang）。
- [ ] 发布 / 撤回写 published_at + audit_log。
- [ ] 内部 `track_code` 不可编辑，UI 文案显示“主题”。
