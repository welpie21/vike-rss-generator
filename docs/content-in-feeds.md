# Content in Feeds

Include full HTML content in feed items for readers that support inline content.

## Adding Content

Use the `content` field in your `+rss.ts`:

```ts
export const rss: RssPageConfig = {
  group: "blog",
  title: "My Post",
  description: "A brief summary",
  content: "<h1>Full Article</h1><p>The complete HTML content...</p>",
};
```

## CDATA Wrapping

HTML content in `description` and `content` fields is automatically wrapped in `<![CDATA[...]]>` sections to preserve HTML without XML escaping:

```xml
<description><![CDATA[<p>Summary with <strong>HTML</strong></p>]]></description>
<content:encoded><![CDATA[<h1>Full Article</h1><p>Content here...</p>]]></content:encoded>
```

If the content itself contains the `]]>` sequence, the plugin falls back to XML entity escaping instead.

## Format-Specific Behavior

| Format | Description field | Content field |
| --- | --- | --- |
| RSS 2.0 | `<description>` (CDATA) | `<content:encoded>` (CDATA) |
| Atom 1.0 | `<summary type="html">` (CDATA) | `<content type="html">` (CDATA) |
| JSON Feed | `summary` (plain string) | `content_html` (plain string) |

## Dynamic Content with Async Config

Use an async function to pull content from your data layer:

```ts
import type { RssPageConfigFn } from "vike-rss-generator";

export const rss: RssPageConfigFn = async (ctx) => ({
  group: "blog",
  title: ctx.data.title,
  description: ctx.data.excerpt,
  content: ctx.data.htmlContent,
  pubDate: ctx.data.publishedAt,
});
```
