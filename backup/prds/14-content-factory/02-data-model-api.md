> ⚠️ 本文件含历史 SaaS / 厂商命名，**以 [planning/00-rules.md](../../00-rules.md) §1.1 + [planning/00-saas-overrides.md](../../00-saas-overrides.md) 为准**。开发时按映射表取等价自托管 / Adapter 实现。

# 14.2 · 内容工厂 · 数据模型与实现

## 数据模型

```sql
CREATE TABLE factory_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type TEXT NOT NULL,          -- 'lesson_generation','article_generation',...
  triggered_by UUID,
  input JSONB NOT NULL,
  output JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending/running/paused/succeeded/failed/canceled
  current_node TEXT,
  total_nodes INT,
  completed_nodes INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  total_tts_chars INT DEFAULT 0,
  estimated_cost_usd DECIMAL(10,4),
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_status ON factory_workflows(status, created_at DESC);

CREATE TABLE factory_node_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES factory_workflows(id) ON DELETE CASCADE,
  node_name TEXT NOT NULL,
  status TEXT NOT NULL,                 -- pending/running/succeeded/failed
  attempt_no INT DEFAULT 1,
  provider TEXT,                        -- 'claude','deepseek','azure_tts','elevenlabs'
  input JSONB,
  output JSONB,
  tokens_in INT,
  tokens_out INT,
  duration_ms INT,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_node_workflow ON factory_node_runs(workflow_id, started_at);

CREATE TABLE factory_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  version_no INT NOT NULL,
  snapshot JSONB NOT NULL,
  workflow_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, version_no)
);
```

## LangGraph 实现示例

```typescript
import { StateGraph } from '@langchain/langgraph';

const lessonState = {
  input: null,
  outline: null,
  knowledge_points: [],
  pinyin_done: false,
  red_line_pass: false,
  translations: {},
  questions: [],
  audio_urls: {},
};

const graph = new StateGraph(lessonState)
  .addNode('outline', generateOutline)        // Claude
  .addNode('kp_generate', generateKPs)        // Claude
  .addNode('pinyin', addPinyin)               // DeepSeek
  .addNode('red_line', redLineCheck)
  .addNode('translate', translate4Langs)      // DeepSeek parallel
  .addNode('quiz_generate', generateQuiz)     // Claude
  .addNode('tts', batchTTS)                   // Azure
  .addNode('persist', persistToDB)
  .addNode('queue_review', queueForReview)
  .addEdge('outline', 'kp_generate')
  .addEdge('kp_generate', 'pinyin')
  .addEdge('pinyin', 'red_line')
  .addConditionalEdges('red_line', (s) => s.red_line_pass ? 'translate' : 'failed')
  .addEdge('translate', 'quiz_generate')
  .addEdge('quiz_generate', 'tts')
  .addEdge('tts', 'persist')
  .addEdge('persist', 'queue_review')
  .setEntryPoint('outline');
```

## API（管理后台调用）

- `POST /admin/api/factory/workflows`
  Body: `{workflow_type, input}` → `{workflow_id}`
- `GET /admin/api/factory/workflows/:id` — 状态 + 节点
- `POST /admin/api/factory/workflows/:id/cancel`
- `POST /admin/api/factory/workflows/:id/nodes/:name/retry`

## 提供商成本

| 提供商 | 模型 | 单价 |
|---|---|---|
| Claude Sonnet 4.5 | $3 / 1M in, $15 / 1M out | 创意类 |
| DeepSeek V3 | $0.27 / 1M in, $1.10 / 1M out | 批量类 |
| Azure Speech | $4 / 1M chars | 普通 TTS |
| ElevenLabs | $0.18 / 1K chars | 旁白 |

## 失败处理
- 节点失败 → 重试 3 次（exponential backoff）
- 全部失败 → workflow status=failed + 邮件运营 + 入手动队列
- 红线检测 critical → 直接 failed

## 性能 / 成本目标
- 单节生成成本 < $0.10
- 单文章成本 < $0.05
- 单小说章节成本 < $0.30
- W0 一次性 20K 知识点估算 < $5,000
