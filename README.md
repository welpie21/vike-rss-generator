# vike-rss-generator

A Vite plugin and Vike extension that generates RSS 2.0, Atom 1.0, and JSON Feed 1.1 files from your Vike routes at build time. Define feed membership per-page using co-located `+rss.ts` files.

## Features

- **Three feed formats** — RSS 2.0, Atom 1.0, JSON Feed 1.1 (generate one or all)
- **Groups** — multiple feed channels (e.g., blog feed, changelog feed, podcast feed)
- **Per-page config** — `+rss.ts` files with static objects, arrays for multi-group, or async functions
- **Vike integration** — extends Vike's config system so `+rss.ts` is typed and collected automatically
- **Zero runtime dependencies** — hand-rolled XML serialization, no external libraries
- **CDATA wrapping** — HTML content automatically wrapped in `<![CDATA[...]]>`
- **Feed validation** — optional spec-compliance warnings without failing the build
- **Dry run mode** — preview generated feeds without writing to disk
- **Custom namespaces** — iTunes, Dublin Core, Media RSS, or any custom XML namespace
- **Podcast support** — enclosure elements for media attachments
- **Sorting and limits** — sort by pubDate/title, cap feed size with `maxItems`
- **Self-referencing links** — automatic `<atom:link rel="self">` (RSS best practice)
- **XSL stylesheets** — optional `xml-stylesheet` processing instruction
- **WebSub** — optional hub link for real-time push notifications

## Installation

```bash
bun add vike-rss-generator
```

## Quick Start

### 1. Add the Vite plugin

```ts
// vite.config.ts
import { vikeRss } from "vike-rss-generator";

export default {
  plugins: [
    vikeRss({
      baseUrl: "https://example.com",
      groups: [
        {
          id: "blog",
          title: "My Blog",
          description: "Latest posts from my blog",
          link: "https://example.com/blog",
        },
      ],
    }),
  ],
};
```

### 2. Register the Vike extension

```ts
// pages/+config.ts
import vikeRssConfig from "vike-rss-generator/config";

export default {
  extends: [vikeRssConfig],
};
```

### 3. Add `+rss.ts` to pages

```ts
// pages/blog/@slug/+rss.ts
import type { RssPageConfig } from "vike-rss-generator";

export const rss: RssPageConfig = {
  group: "blog",
  title: "My Post Title",
  description: "A summary of the post",
  pubDate: new Date("2026-03-01"),
};
```

That's it. When you build your app (`vite build`), the feed file is generated automatically.

## Feed Formats

Each group can generate one or more formats:

```ts
groups: [
  {
    id: "blog",
    title: "Blog",
    description: "Feed",
    format: ["rss", "atom", "json"], // generates blog.xml, blog.atom.xml, blog.json
  },
];
```

| Format | Default extension | Content type |
| --- | --- | --- |
| `"rss"` | `.xml` | `application/rss+xml` |
| `"atom"` | `.atom.xml` (or `.xml` if only format) | `application/atom+xml` |
| `"json"` | `.json` | `application/feed+json` |

## Groups

Groups define feed channels. Each group produces separate feed files.

```ts
vikeRss({
  baseUrl: "https://example.com",
  groups: [
    {
      id: "blog",
      title: "Blog",
      description: "Latest posts",
      format: "rss",
      language: "en",
      maxItems: 20,
    },
    {
      id: "changelog",
      title: "Changelog",
      description: "Product updates",
      format: ["rss", "atom"],
      outDir: "feed",
    },
  ],
});
```

### Group Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | Identifier referenced by `+rss.ts` files |
| `name` | `string` | `id` | Output filename (without extension) |
| `outDir` | `string` | build root | Output directory relative to build output |
| `format` | `FeedFormat \| FeedFormat[]` | `"rss"` | Feed format(s) to generate |
| `title` | `string` | — | Channel title (required) |
| `description` | `string` | — | Channel description (required) |
| `link` | `string` | `baseUrl` | Channel link URL |
| `language` | `string` | — | Feed language code |
| `copyright` | `string` | — | Copyright notice |
| `managingEditor` | `string` | — | Editor email |
| `webMaster` | `string` | — | Webmaster email |
| `ttl` | `number` | — | Time-to-live in minutes |
| `image` | `RssChannelImage` | — | Channel image |
| `category` | `string \| string[]` | — | Channel categories |
| `skipHours` | `number[]` | — | Hours (0-23) to skip polling |
| `skipDays` | `string[]` | — | Days to skip polling |
| `selfLink` | `boolean` | `true` | Include `<atom:link rel="self">` |
| `maxItems` | `number` | unlimited | Maximum items in feed |
| `sortBy` | `"pubDate" \| "title" \| Function` | `"pubDate"` | Sort field |
| `sortOrder` | `"asc" \| "desc"` | `"desc"` | Sort direction |
| `prettyXml` | `boolean` | `false` | Indent XML output |
| `extension` | `string` | format default | Custom file extension (e.g. `".rss"`) |
| `namespaces` | `Record<string, string>` | `{}` | Custom XML namespaces |
| `stylesheet` | `string` | — | XSL stylesheet URL |
| `hub` | `string` | — | WebSub hub URL |

## Per-Page Config (`+rss.ts`)

### Static config

```ts
import type { RssPageConfig } from "vike-rss-generator";

export const rss: RssPageConfig = {
  group: "blog",
  title: "My Post",
  description: "Post summary",
  pubDate: new Date("2026-01-01"),
  categories: ["tech"],
};
```

### Multi-group targeting

```ts
export const rss: RssPageConfig = [
  {
    group: "blog",
    title: "Full Post",
    content: "<p>Full HTML content</p>",
    pubDate: new Date("2026-01-01"),
  },
  {
    group: "app",
    title: "Minimal Post",
  },
];
```

### Async function

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

### Item Fields

| Field | Type | Description |
| --- | --- | --- |
| `group` | `string` | Target group ID |
| `link` | `string` | Override auto-derived item link URL |
| `title` | `string` | Item title (required) |
| `description` | `string` | Summary/excerpt |
| `content` | `string` | Full HTML content |
| `pubDate` | `Date \| string \| number` | Publication date |
| `author` | `string` | Author name or email |
| `categories` | `string[]` | Category tags |
| `guid` | `string` | Unique identifier (defaults to URL) |
| `enclosure` | `{ url, length, type }` | Media attachment |
| `customFields` | `Record<string, string \| Record<string, string>>` | Custom XML elements |

## Plugin Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | — | Base URL (required) |
| `groups` | `RssGroupConfig[]` | — | Feed group definitions (required) |
| `defaultGroup` | `string` | — | Default group for pages without explicit group |
| `include` | `(string \| RegExp)[]` | `[]` | URL patterns to include |
| `exclude` | `(string \| RegExp)[]` | `[]` | URL patterns to exclude |
| `concurrency` | `number` | `10` | Max concurrent async resolutions |
| `dryRun` | `boolean` | `false` | Log output without writing files |

## Documentation

- [Getting Started](docs/getting-started.md)
- [Groups](docs/groups.md)
- [Per-Page Config](docs/per-page-config.md)
- [Formats](docs/formats.md)
- [Custom Output Directory](docs/custom-output-directory.md)
- [Content in Feeds](docs/content-in-feeds.md)
- [Podcast Feeds](docs/podcast-feeds.md)
- [Git Dates](docs/git-dates.md)
- [Validation](docs/validation.md)
- [Advanced Options](docs/advanced-options.md)

## License

MIT
