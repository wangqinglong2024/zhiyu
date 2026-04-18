-- =====================================================
-- 多语言翻译表：UI 文案的多语言版本
-- =====================================================

CREATE TABLE i18n_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 翻译键（如 "nav.home"、"btn.submit"）
  translation_key VARCHAR(200) NOT NULL,

  -- 语言代码
  language language_code NOT NULL,

  -- 翻译值
  translation_value TEXT NOT NULL,

  -- 命名空间（按模块分组：common, auth, course, game 等）
  namespace VARCHAR(50) NOT NULL DEFAULT 'common',

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 唯一约束：同一命名空间下，一个 key + 一种语言只有一条记录
  UNIQUE (namespace, translation_key, language)
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_i18n_namespace_lang ON i18n_translations(namespace, language);
CREATE INDEX idx_i18n_key ON i18n_translations(translation_key);

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE i18n_translations ENABLE ROW LEVEL SECURITY;

-- 翻译表公开可读（前端需要加载多语言文案）
CREATE POLICY "i18n_select_public"
  ON i18n_translations FOR SELECT
  USING (TRUE);

-- 写操作仅 service_role 可执行（管理后台通过后端 API）

-- =====================================================
-- 自动更新 updated_at
-- =====================================================
CREATE TRIGGER i18n_updated_at
  BEFORE UPDATE ON i18n_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE i18n_translations IS '多语言翻译表：UI 文案的多语言版本，管理后台可编辑';
COMMENT ON COLUMN i18n_translations.namespace IS '命名空间：common/auth/course/game 等';
