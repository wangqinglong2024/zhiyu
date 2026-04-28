# 06 · 用户账号（User Account · UA）

> **代号**：UA | **优先级**：P0 | 提供注册 / 登录 / 个人中心 / 偏好 / 数据导出与销户

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 注册方式：邮箱 + 密码、Google OAuth（v1）；Apple / Facebook v1.5
- 邮箱验证：必需（验证码 6 位 / 15min 有效）
- 密码：最小 8 位 + 数字 + 字母
- 销户：软删（90 天恢复期）+ 数据导出（JSON / CSV）
- 偏好：UI 语言 / 母语 / 拼音模式 / TTS 语速 / TTS 音色 / 字号 / 翻译显示模式 / 是否接收邮件
- Persona 标签：欢迎流程后写入 user_profiles
- 多设备登录：JWT + 7 天 refresh / 30 天 max
- 设备指纹：FingerprintJS（未登录访问限制 + 反作弊）
- 合规：PDPL / PDPA / UU PDP — 数据导出 30 天内、删除 30 天内、cookie 同意
