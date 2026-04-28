# 应用端：TTS 与朗读

> 设计要点（PM 答 Q10）：
> - **由用户点击触发**；后端不预生成、不自动重试。
> - 全平台共享缓存；首位用户触发，后续命中即返回。
> - 失败不限次重试，由用户再次点击；不阻塞接口可用性。
>
> 上游 TTS 调用在 dev/未配密钥环境走 **Mock**（按 zhiyu-docker-policy）；详见 [07-AI补充接口.md](./07-AI补充接口.md)。

---

## C4 · 触发/获取句子 TTS

**对应需求中的操作**：F2-用户 §一 · 应用端「每个句子一个语音播放按钮，调 AI 接口播放并缓存」

**方法**：POST
**路径**：`/api/v1/china/sentences/:id/audio`
**权限**：公开（无需登录；按 IP 限流，仅对真实生成计数，缓存命中不消耗配额）

**业务校验**：
- 句子必须存在；其所属文章必须 `status='published' AND deleted_at IS NULL`，否则 404。
- 当前 `audio_status` 决定行为（见下文「状态机交互」）。

**请求参数**：

| 参数 | 位置 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| `id` | path | uuid | ✅ | 句子 UUID |
| `voice` | body | string | ❌ | 可选音色 ID，默认服务端配置 |
| `Idempotency-Key` | header | string | ❌ | 同一用户多次点击建议带，防止重复发起上游调用 |

请求体：

```json
{ "voice": "zh-CN-XiaoxiaoNeural" }
```

**状态机交互**（服务端在事务内执行）：

| 当前状态 | 行为 | 返回 |
|---------|------|------|
| `ready` | 直接返回缓存 | 200，`audio.url` 可播 |
| `pending` | `UPDATE ... SET audio_status='processing'` 抢占 → 同步调用 TTS（或 mock）→ 上传 Storage → 写回 `ready` | 200，`audio.url` 可播 |
| `processing`（被其他请求占用） | 同步轮询 ≤ 30s；如仍 processing 返回 202 让前端稍后重试 | 202 / 200 |
| `failed` | 视为可重试：与 `pending` 相同流程 | 200 / 502 |

**成功响应 200**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sentence_id": "5b7c...",
    "audio": {
      "status": "ready",
      "url":    "https://storage.zhiyu.app/china-tts/A7K2P9X3M4QR/0001.mp3",
      "duration_ms": 4820,
      "provider": "azure",
      "voice": "zh-CN-XiaoxiaoNeural",
      "generated_at": "2026-04-28T10:00:00+08:00",
      "from_cache": false
    }
  }
}
```

**响应 202 Accepted**（处理中，让前端稍后重试）：

```json
{
  "code": 20200,
  "message": "音频生成中，请稍候重试",
  "data": { "sentence_id":"5b7c...", "audio": { "status":"processing" } }
}
```

**错误场景**：

| HTTP | code | 触发条件 | 错误信息 |
|------|------|---------|---------|
| 404 | 40400 | 句子不存在/所属文章未发布 | 句子不存在 |
| 429 | 42900 | 同 IP 真实触发（非缓存命中）频率超限（默认 20 次/分钟） | 操作过于频繁 |
| 502 | 50200 | 上游 TTS 调用失败/超时 | 语音生成失败，请稍后重试 |
| 504 | 50400 | 上游超时（默认 15s） | 语音生成超时，请稍后重试 |

**失败时的副作用**：写入 `audio_status='failed'`、`audio_error=<原因>`；用户点击即可再次触发，不限次数（PM 答 Q10）。

---

## 缓存键 / Storage 路径

- Storage 桶：`china-tts`（公开读、service-role 写）
- Object key：`<article_code>/<seq_no_padded>.mp3`，例：`A7K2P9X3M4QR/0001.mp3`
- 数据库 `audio_url_zh` 写入 Storage 公开访问 URL。
- **重排副作用**（PM 答 Q8）：句子 `seq_no` 变化 → DB 中 `audio_url_zh` 清空 + `audio_status='pending'`；老 mp3 文件不立即删，由 `cron_china_purge_orphan_audio` 周清理。

---

## 限流与并发

| 维度 | 阈值 | 说明 |
|------|------|------|
| 单 IP | 20 次 POST /audio / min | 防恶意触发付费 TTS（PM 答 F2-Q3） |
| 单句子 | 同一时刻仅 1 个 `processing`（DB 行锁 + 状态 CAS） | 第二个请求转 202 |
| 缓存命中 | 命中 `audio_status='ready'` 直接返回，**不计入限流计数**（PM 答 F2-Q3 重点） | 已生成的句子不消耗配额 |

---

## I1 · TTS Mock 内部回调（仅 dev/无密钥）

详见 [07-AI补充接口.md](./07-AI补充接口.md)。
