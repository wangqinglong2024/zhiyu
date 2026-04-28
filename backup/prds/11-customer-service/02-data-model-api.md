# 11.2 · 客服 · 数据模型与 API

## 数据模型

```sql
CREATE TABLE cs_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('account','payment','content','learning','referral','other')),
  status TEXT NOT NULL DEFAULT 'pending', -- pending/active/waiting/resolved/closed_no_response
  assigned_csr_id UUID REFERENCES users(id),
  language TEXT,                          -- 用户母语
  user_unread_count INT DEFAULT 0,
  csr_unread_count INT DEFAULT 0,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  rating_comment TEXT,
  rated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_cs_user ON cs_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_cs_assigned ON cs_conversations(assigned_csr_id, status, last_message_at DESC);
CREATE INDEX idx_cs_pending ON cs_conversations(status, language, created_at) WHERE status='pending';

CREATE TABLE cs_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES cs_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user','csr','system')),
  sender_id UUID,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','system')),
  content TEXT,
  image_url TEXT,
  meta JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_msgs_conv ON cs_messages(conversation_id, created_at);

ALTER TABLE cs_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_user ON cs_conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY rlsp_csr ON cs_conversations FOR SELECT USING (
  EXISTS(SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('cs','admin'))
);
ALTER TABLE cs_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY rlsp_user_msgs ON cs_messages FOR SELECT USING (
  EXISTS(SELECT 1 FROM cs_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY rlsp_csr_msgs ON cs_messages FOR SELECT USING (
  EXISTS(SELECT 1 FROM admin_users WHERE id = auth.uid() AND role IN ('cs','admin'))
);
```

## API

### 用户端
- `POST /api/cs/conversations` — `{category, content, image?}` → 创建 + 首消息
- `GET /api/cs/conversations` — 我的所有会话
- `GET /api/cs/conversations/:id/messages?before=`
- `POST /api/cs/conversations/:id/messages` — 发消息
- `POST /api/cs/conversations/:id/read` — 标已读
- `POST /api/cs/conversations/:id/rate` — `{rating, comment}`

### 客服端
- `GET /api/cs/queue?language=` — 待接单
- `POST /api/cs/queue/:conv_id/claim` — 抢单
- `GET /api/cs/my-conversations` — 我接的
- `POST /api/cs/conversations/:id/messages` — 客服回复
- `POST /api/cs/conversations/:id/resolve` — 关闭

### Realtime
- 订阅：`supabase.channel('conversation:{id}')`
- 事件：`message_inserted`

## 路由算法

```typescript
async function routeNewConversation(convId) {
  const conv = await getConversation(convId);
  // 工作时间外
  if (!isWorkingHours()) {
    await notifyOfflineCSR(conv);
    return;
  }
  // 找在线 CSR + 同语种 + 工单最少
  const candidates = await db.query(`
    SELECT u.id, COUNT(c.id) as load
    FROM admin_users u
    LEFT JOIN cs_conversations c ON c.assigned_csr_id = u.id AND c.status IN ('active','waiting')
    WHERE u.role='cs' AND u.is_online=true AND $1 = ANY(u.languages)
    GROUP BY u.id ORDER BY load ASC LIMIT 1
  `, [conv.language]);

  if (candidates[0] && candidates[0].load < 5) {
    await assignCSR(convId, candidates[0].id);
  }
  // 否则保留 pending，等 CSR 主动接
}
```

## 性能
- 发送 P95 < 300ms
- Realtime 延迟 < 1s
- 历史加载 P95 < 500ms（分页 50/页）

## 自动归档
- daily cron：last_message_at + 7d 且 status=resolved → archived_at = NOW()
- archived 消息只读，搜索仍可见
