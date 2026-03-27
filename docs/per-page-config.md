# Per-Page Config

Pages opt into feeds by exporting config from a co-located `+rss.ts` file.

## Static Config

The simplest form is a static object:

```ts
import type { RssPageConfig } from "vike-rss-generator";

export const rss: RssPageConfig = {
  group: "blog",
  title: "My Post Title",
  description: "A summary of the post",
  pubDate: new Date("2026-03-01"),
};
```

## Multi-Group Targeting

A single page can appear in multiple feeds by exporting an array. Each entry can have different metadata:

```ts
import type { RssPageConfig } from "vike-rss-generator";

export const rss: RssPageConfig = [
  {
    group: "blog",
    title: "Full Post",
    description: "Detailed summary",
    content: "<p>Full HTML content...</p>",
    pubDate: new Date("2026-03-01"),
    categories: ["tech"],
  },
  {
    group: "app",
    title: "Minimal Post",
    // No content or description — just title + link for app consumption
  },
];
```

## Async Function

For dynamic data from `+data.ts`, use an async function:

```ts
import type { RssPageConfigFn } from "vike-rss-generator";

export const rss: RssPageConfigFn = async (ctx) => ({
  group: "blog",
  title: ctx.data.title,
  description: ctx.data.excerpt,
  pubDate: ctx.data.publishedAt,
  categories: ctx.data.tags,
});
```

The function receives a context object with:

| Field | Type | Description |
| --- | --- | --- |
| `url` | `string` | Concrete URL path (e.g., `/blog/post-1`) |
| `routeParams` | `Record<string, string>` | Route parameters (e.g., `{ slug: "post-1" }`) |
| `data` | `unknown` | Page data from `+data.ts` |

Async functions also support returning an array for multi-group output.

## Item Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `group` | `string` | Unless `defaultGroup` set | Target group ID |
| `link` | `string` | No | Override auto-derived item link URL |
| `title` | `string` | Yes | Item title |
| `description` | `string` | No | Summary/excerpt |
| `content` | `string` | No | Full HTML content |
| `pubDate` | `Date \| string \| number` | No | Publication date |
| `author` | `string` | No | Author name or email |
| `categories` | `string[]` | No | Category tags |
| `guid` | `string` | No | Unique identifier (defaults to page URL) |
| `enclosure` | `{ url, length, type }` | No | Media attachment |
| `customFields` | `Record<string, ...>` | No | Additional XML elements |

## Pages Without `+rss.ts`

Pages without a `+rss.ts` file are excluded from all feeds.
