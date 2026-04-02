# 管理端模块：管理员登录

> 依赖全局文件：`product/GLOBAL.md`
> 涉及 API：`POST /admin/login`

---

## 一、认证方式

- **固定管理员账号 + 密码**（存在后端环境变量中，不走 Supabase 用户体系）
- 登录成功后颁发独立 Admin JWT（`role: admin` claim），有效期 **8 小时**
- 所有 `/admin/*` 接口验证此 Token

---

## 二、路由

`/admin/login`

---

## 三、UI

极简。白底或深色底，一个输入框组合。不需要和用户端一致的视觉风格，以功能为主。
