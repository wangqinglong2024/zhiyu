# 12 · 实时与 IM（Realtime & IM）

## 一、用途

1. 客服 IM（用户 ↔ 客服）
2. 实时通知（系统 / 客服回复 / 学习提醒）
3. 学习同步（v1.5：好友学习圈）
4. 游戏对战（v3，不在范围）

## 二、技术选型

- **WebSocket**：Socket.io v4（跨浏览器兼容好）
- **后端**：Node.js + ws / Socket.io 服务
- **Redis Pub/Sub**：跨实例广播
- **fallback**：Server-Sent Events (轻量通知)

## 三、连接架构

```
[Client] ───WS─── [WS Gateway] ──── [Redis Pub/Sub] ──── [App API]
                       ↑
                       │ Auth via JWT
                       │
                  [Multiple Replicas]
```

### 3.1 WS Gateway
- 独立服务（apps/ws）或并入 API（v1）
- 多副本水平扩展
- Redis adapter（Socket.io）

### 3.2 部署
- v1：单 API 进程内 Socket.io（简单）
- v1.5：独立 ws 服务，Redis 共享 session

## 四、认证

### 4.1 握手
```ts
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyJWT(token);
  if (!user) return next(new Error('UNAUTHORIZED'));
  socket.data.user = user;
  next();
});
```

### 4.2 房间
- 每用户加入个人房：`user:${userId}`
- 客服会话房：`conv:${conversationId}`
- 后台客服监听全队列

## 五、客服 IM

### 5.1 用户端事件
```ts
socket.emit('conv:join', { conversationId });
socket.emit('msg:send', { conversationId, body });
socket.on('msg:new', (msg) => { ... });
socket.on('typing', ({ userId }) => { ... });
socket.on('agent:assigned', ({ agentId }) => { ... });
```

### 5.2 客服端事件
```ts
socket.emit('agent:online');
socket.on('conv:assigned', (conv) => { ... });
socket.emit('msg:send', { conversationId, body });
socket.emit('typing', { conversationId });
socket.emit('conv:close', { conversationId });
```

### 5.3 派单逻辑
- 用户首消息 → assigned=null
- 派发服务每秒轮询：找在线 + 当前会话 < 5 的客服
- 找不到 → 系统消息"等待客服接入"

### 5.4 离线
- 客服离线 → 转工单
- 用户离线 → 消息存 DB，下次登录推送

### 5.5 持久化
- 消息全部入 messages 表（异步）
- WS 仅传输

## 六、通知推送

### 6.1 类型
- 系统公告
- 学习提醒
- 客服回复
- 知语币活动
- 新内容

### 6.2 触达方式
1. WS 推（在线）
2. Web Push (OneSignal) 兜底
3. Email （重要 / 长效）

### 6.3 用户偏好
- /settings 控制每类是否推送
- 静音时段

## 七、心跳与断线

### 7.1 心跳
- ping interval 25s
- pong timeout 60s

### 7.2 断线重连
- 客户端自动重连（指数退避）
- max 5 次
- 失败 → 提示用户

### 7.3 状态恢复
- 重连后 socket.emit('resume')
- 服务端推送丢失消息

## 八、广播

### 8.1 房间广播
```ts
io.to(`conv:${id}`).emit('msg:new', msg);
io.to(`user:${id}`).emit('notification', n);
```

### 8.2 全局广播
- 系统公告
- 维护提醒

### 8.3 跨实例（Redis Adapter）
```ts
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

## 九、限速

### 9.1 消息限速
- 用户：10 msg/min
- 后台客服：60 msg/min

### 9.2 连接限速
- 单 IP：10 连接

## 十、安全

### 10.1 认证
- 必须有效 JWT
- token 过期断开重连

### 10.2 授权
- 仅会话参与者可加入房
- 客服角色校验

### 10.3 内容
- XSS 转义
- 恶意 URL 检测
- 文件上传走 R2 presign

### 10.4 反垃圾
- 重复消息检测
- 关键词
- 用户举报

## 十一、可观测

### 11.1 指标
- 在线连接数
- 消息吞吐
- 平均会话时长
- 客服响应时间

### 11.2 日志
- 连接 / 断开
- 异常消息

## 十二、备选 SSE（长连接通知）

### 12.1 用途
- 简单通知推送（无双向）
- 浏览器支持好
- 不需 Socket.io

### 12.2 实现
```ts
app.get('/v1/sse/notifications', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  const userId = req.user.id;
  const subscriber = subscribeToUser(userId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });
  req.on('close', () => subscriber.unsubscribe());
});
```

## 十三、Push (Web Push)

### 13.1 OneSignal SDK
- 注册 SW
- 用户授权
- token 上传后端

### 13.2 触发
- 后端 → OneSignal API
- 多语言 payload
- 点击跳转 URL

### 13.3 限制
- iOS Safari 16.4+
- 用户主动添加到主屏后才支持

## 十四、邮件（兜底）

### 14.1 触发
- 离线 + 重要事件
- 用户偏好

### 14.2 模板
- React Email
- 4 语版本

## 十五、容量规划

### 15.1 v1
- 同时在线 1k
- 单实例 1 个
- Redis 1 实例

### 15.2 v1.5
- 同时在线 10k
- 多实例（2-4）
- Redis cluster

### 15.3 v2
- 同时在线 50k+
- 独立 ws 服务
- 分片（按 user_id hash）

## 十六、检查清单

- [ ] Socket.io 集成
- [ ] JWT 握手认证
- [ ] 房间 + Redis Adapter
- [ ] 客服 IM 完整流程
- [ ] 消息持久化
- [ ] 推送 OneSignal 集成
- [ ] SSE fallback
- [ ] 心跳 + 断线重连
- [ ] 限速 + 反垃圾
- [ ] 监控连接数 + 吞吐
