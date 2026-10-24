---
title: "API 接入指南"
description: "通过 REST API 读取文档、同步内容，并把 HappyDays非官方文档接入你的工作流。"
topic: "开发者"
topic_id: "developer"
author: "陆行舟"
author_role: "平台工程师"
updated: "2026-10-20"
reading_time: 10
emoji: "⌘"
order: 8
slug: "api-guide"
source: "../../index.html#/doc/api-guide"
tags:
  - "API"
  - "开发"
  - "Webhook"
---

# API 接入指南

*通过 REST API 读取文档、同步内容，并把 HappyDays非官方文档接入你的工作流。*

HappyDays 公开 API 采用 REST 风格，请求与响应均为 JSON。你可以读取知识库目录、创建草稿、同步外部内容，或通过 Webhook 接收文档变更事件。

> [!NOTE]
> **基础地址**
>
> 所有接口以 `https://api.happydays.wiki/v1` 为前缀。示例中的令牌仅作演示，请勿把真实密钥写入代码仓库。

## 认证

在「空间设置 → 开发者 → API 令牌」中创建令牌，并通过 `Authorization` 请求头传递。令牌继承创建者的权限，建议为每个集成单独创建，并遵循最小权限原则。

```bash
curl https://api.happydays.wiki/v1/docs \
  -H "Authorization: Bearer $HAPPYDAYS_API_TOKEN" \
  -H "Accept: application/json"
```

## 发起第一个请求

下面这个例子列出当前空间最近更新的 10 篇文档。响应中的 `cursor` 用于获取下一页。

```javascript
const response = await fetch(
  "https://api.happydays.wiki/v1/docs?limit=10&sort=updated_at",
  {
    headers: {
      Authorization: "Bearer " + process.env.HAPPYDAYS_API_TOKEN,
      Accept: "application/json"
    }
  }
);

if (!response.ok) {
  throw new Error("Request failed: " + response.status);
}

const { data, next_cursor } = await response.json();
console.log(data.map(doc => doc.title));
```

```json
{
  "data": [
    {
      "id": "doc_8f3k2m",
      "title": "欢迎来到 HappyDays非官方文档",
      "slug": "welcome",
      "space_id": "space_happydays",
      "status": "published",
      "updated_at": "2026-10-21T09:30:00Z"
    }
  ],
  "next_cursor": "eyJvZmZzZXQiOjEwfQ",
  "has_more": true
}
```

## 核心资源

| 资源 | 方法 | 路径 | 说明 |
| --- | --- | --- | --- |
| **文档** | `GET` | `/docs` | 分页列出文档 |
| **文档** | `GET` | `/docs/:id` | 读取文档正文与元数据 |
| **文档** | `POST` | `/docs` | 创建草稿 |
| **文档** | `PATCH` | `/docs/:id` | 更新标题或正文 |
| **知识库** | `GET` | `/spaces/:id/tree` | 读取目录树 |
| **评论** | `GET` | `/docs/:id/comments` | 读取文档评论 |

## 分页与过滤

列表接口统一使用游标分页，不接受页码。首次请求不传 `cursor`，之后把响应中的 `next_cursor` 原样带回即可。

```http
GET /v1/docs?limit=20&cursor=eyJvZmZzZXQiOjIwfQ&status=published&tag=api
```

支持的过滤参数包括 `status`、`tag`、`updated_since` 和 `author_id`。多个过滤条件之间是「与」关系，`limit` 最大为 100。

## 错误处理

所有错误都返回稳定的 JSON 结构和可追踪的 `request_id`。不要根据错误文案做逻辑判断，请使用状态码与 `code` 字段。

| 状态码 | code | 含义与处理方式 |
| --- | --- | --- |
| `400` | `invalid_request` | 参数缺失或格式错误，检查请求体 |
| `401` | `unauthorized` | 令牌无效或已过期，重新生成 |
| `403` | `forbidden` | 权限不足，确认令牌所属角色 |
| `404` | `not_found` | 资源不存在或对当前令牌不可见 |
| `409` | `conflict` | 并发修改冲突，重新拉取最新版本 |
| `429` | `rate_limited` | 请求过于频繁，按 Retry-After 退避 |

> [!WARNING]
> **重试策略**
>
> 仅对 429 与 5xx 响应进行重试，建议采用指数退避并加入随机抖动。不要自动重试 409，应该重新读取资源后由业务逻辑决定如何合并。

## 速率限制

每个令牌默认限制为每分钟 120 次请求，突发上限 30 次。响应头会返回当前窗口的使用情况：

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1761110400
Retry-After: 12
```

## Webhook 签名验证

事件推送使用 `X-HappyDays-Signature` 头，值为 `sha256=` 加 HMAC 摘要。请务必使用原始请求体计算签名，不要先解析再序列化。

```javascript
const crypto = require("crypto");

function verifySignature(rawBody, signature) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", process.env.HAPPYDAYS_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
```

验证失败时返回 `401` 并记录请求 ID；成功处理后返回 `2xx`。HappyDays 会在 24 小时内对失败事件重试 5 次，之后进入死信队列。
