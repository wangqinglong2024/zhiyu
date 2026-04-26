# ZY-06-06 · 中文全文搜索（jieba 分词 + Postgres FTS）

> Epic：E06 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 用中文 / 英文 / 拼音搜索文章 / 词条 / 课程
**So that** 不必逐分类找。

## 上下文
- Postgres `tsvector` + `pg_jieba`（容器内安装）；西文走 default config。
- 拼音搜索：单独构建 `pinyin_tsv`（每词中文 → 拼音 abbr + full）。
- 索引粒度：articles.title + body 摘要、words.simplified+pinyin、courses.title、lessons.title、novels.title。
- 接全局搜索弹窗（ZY-05-04）。

## Acceptance Criteria
- [ ] supabase-db 镜像追加 `pg_jieba` 扩展（system/docker/supabase 自定义 Dockerfile）
- [ ] `tsvector` 列 + GIN 索引；触发器自动更新
- [ ] `GET /api/v1/search?q&types[]&lng` 返回多类型聚合
- [ ] 拼音 "zhongguo" → 命中 "中国"
- [ ] 高亮关键字（`<mark>` 包裹）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec supabase-db psql -U postgres -c "select to_tsvector('jiebacfg','中国文化博大精深')"
docker compose exec zhiyu-app-be pnpm vitest run search
```

## DoD
- [ ] 中英 / 拼音命中
- [ ] 响应 ≤ 200ms（10 万条）

## 不做
- 向量搜索（v1.5；pgvector 已开但本期不接）

## 依赖
- 上游：ZY-06-01 / 数据
- 下游：ZY-05-04
