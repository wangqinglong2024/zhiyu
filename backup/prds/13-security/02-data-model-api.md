# 13.2 · 安全 · 数据模型与实现

## 数据模型

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,           -- 'login_failed','signature_invalid','bot_suspected','red_line_blocked','rate_limit_hit',...
  user_id UUID,
  anon_id TEXT,
  ip TEXT,
  device_id TEXT,
  user_agent TEXT,
  details JSONB,
  severity TEXT DEFAULT 'info',       -- info/warn/error/critical
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sec_type_date ON security_events(event_type, created_at DESC);
CREATE INDEX idx_sec_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_sec_ip ON security_events(ip, created_at DESC);

CREATE TABLE blocked_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ip','email','device','user_id')),
  entity_value TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ,           -- NULL = permanent
  blocked_by TEXT,                     -- 'auto','admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_value)
);

CREATE TABLE api_signature_nonces (
  nonce TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
-- TTL via cron: DELETE FROM api_signature_nonces WHERE expires_at < NOW()

CREATE TABLE red_line_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('exact','contains','regex')),
  category TEXT NOT NULL,              -- 'political','religious','royal_th','sensitive_history',...
  language TEXT,                       -- NULL = all
  severity TEXT DEFAULT 'block',       -- block/warn/log
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## HMAC 签名实现

### 客户端
```typescript
function signRequest(method, path, body, secret) {
  const ts = Date.now().toString();
  const nonce = uuid();
  const bodyHash = sha256(body || '');
  const payload = `1.${ts}.${nonce}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const sig = hmacSHA256(secret, payload).hex();
  return {
    'X-Sig-V': '1',
    'X-Sig-Ts': ts,
    'X-Sig-Nonce': nonce,
    'X-Sig': sig,
  };
}
```

### 服务端中间件
```typescript
async function verifySignature(req) {
  const { 'x-sig-v': v, 'x-sig-ts': ts, 'x-sig-nonce': nonce, 'x-sig': sig } = req.headers;
  if (v !== '1') return false;
  if (Math.abs(Date.now() - parseInt(ts)) > 300_000) return false;
  if (await redis.exists(`nonce:${nonce}`)) return false;
  await redis.setex(`nonce:${nonce}`, 3600, '1');

  const secret = await getUserSecret(req.user_id);
  const bodyHash = sha256(req.rawBody);
  const expected = hmacSHA256(secret, `1.${ts}.${nonce}.${req.method}.${req.path}.${bodyHash}`).hex();
  return expected === sig;
}
```

## 音频签名 URL

```typescript
function signAudioURL(path, userId) {
  const exp = Math.floor(Date.now() / 1000) + 300; // 5min
  const sig = hmacSHA256(AUDIO_SECRET, `${path}.${exp}.${userId}`).hex().slice(0, 32);
  return `https://cdn.zhiyu.app${path}?u=${userId}&exp=${exp}&sig=${sig}`;
}
```

## 内容水印（零宽字符）

```typescript
function watermark(text, userId, sessionId) {
  const userHash = sha256(userId).slice(0, 8);
  const sessHash = sha256(sessionId).slice(8, 16);
  const bits = (userHash + sessHash).split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
  // 在每个非空白字符后插入零宽字符 (U+200B=0, U+200C=1)
  let i = 0;
  return text.split('').flatMap(ch => {
    if (i >= bits.length) return [ch];
    const wm = bits[i++] === '0' ? '\u200B' : '\u200C';
    return [ch, wm];
  }).join('');
}
```

## 红线检测流程

```
内容输入
  ↓
Layer 1: 词典匹配（fast）
  ↓ 命中 block 类 → 立即拒
  ↓ 命中 warn → 标记继续
  ↓
Layer 2: LLM 语义（Claude Sonnet 4.5）
  prompt: "判断以下内容是否涉及政治 / 宗教 / 王室 / 敏感历史，输出 JSON"
  ↓ critical → 拒
  ↓ warn → 待人工审
  ↓ pass → 通过
  ↓
入库
```

## 性能
- HMAC 校验 P95 < 50ms
- 红线检测：Layer 1 < 20ms，Layer 2 < 2s（异步）
- 音频签名生成 < 5ms
