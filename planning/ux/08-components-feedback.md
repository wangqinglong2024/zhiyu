# 08 · 反馈与状态组件

## 一、Toast

| type | Token | 图标 | 默认时长 |
|---|---|---|---:|
| success | celadon | Check | 3s |
| info | mist-blue | Info | 3s |
| warning | aged-gold | TriangleAlert | 5s |
| error | cinnabar | XCircle | 手动关闭 |
| loading | ink-muted | Loader | 完成后关闭 |

应用端 Toast 顶部居中，后台右上角。最多显示 3 个，多余排队。所有 Toast 通过 `aria-live` 公告。

## 二、Banner

- 顶部固定：离线、版本更新、维护提示。
- 内联：付费墙提示、权限不足、内容待审。
- 视觉使用 paper 实底或低透明 porcelain，确保长文案可读。

## 三、Confirm

- 删除、撤销、封禁、销户等危险动作必须二次确认。
- 严重危险操作要求输入确认词。
- 按钮顺序：取消在左，危险操作在右。

## 四、Empty State

空态由插画/图标、标题、说明、主操作组成。插画风格为线描 + 宣纸/青瓷/朱砂小面积，不使用卡通刻板中国符号。

| 场景 | 视觉锚点 | CTA |
|---|---|---|
| 无搜索结果 | 放大镜 + 水墨淡纹 | 重置筛选 |
| 无收藏 | 书签线描 | 去发现 |
| 无笔记 | 纸页线描 | 开始学习 |
| 网络错误 | 断线图标 | 重试 |
| 403 | 锁 + 印章 | 去登录/返回 |
| 404 | 空白书页 | 回首页 |

## 五、Skeleton / Loading

- 列表用骨架，不用全屏 spinner。
- 全屏 loading 仅用于启动和切语言。
- Skeleton 使用纸色渐层，减弱动效下静态显示。

## 六、错误状态

- 表单错误：字段下方文本 + 图标 + `aria-describedby`。
- 页面错误：ErrorBoundary 显示重试、回首页、反馈入口。
- API 错误：通过错误 code 在客户端本地化，不直接展示后端栈。

## 七、离线状态

- 顶部 banner 显示离线。
- 已缓存内容可读，不可用操作 disable 并解释。
- 用户数据写操作必须提示“联网后再试”，不做假成功。

## 八、触觉反馈

- 点击：light。
- 成功：success。
- 错误：error。
- 长按菜单：medium。
- 游戏最后 5 秒倒计时：light，用户可关闭。

## 九、验收

- [ ] 所有 loading/empty/error/offline 状态覆盖关键页面。
- [ ] Toast、Banner、错误状态支持 4 语。
- [ ] 危险操作均有确认与审计入口。
- [ ] 减弱动效与无障碍公告可用。