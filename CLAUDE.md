# vike-rss-generator

A Vite plugin and Vike extension that generates RSS/Atom/JSON Feed files from your Vike routes. Works in SSR, SSG, and SPA environments. Tightly integrated into the Vike modular config system so developers can define feed membership per-page using co-located `+rss.ts` files.

## Tech Stack

- **Language:** TypeScript (strict mode, ES2022, NodeNext modules)
- **Build:** tsup (dual entry: `src/index.ts` + `src/config.ts`, ESM, `dts: true`)
- **Runtime:** Node.js >= 18
- **Test runner:** Bun (`bun test`)
- **Linter/Formatter:** Biome (tabs, double quotes, recommended rules)
- **Peer dependencies:** Vite >= 7, Vike >= 0.4.250

## Project Structure

```
src/
├── index.ts              # Public API re-exports (plugin factory + types)
├── config.ts             # Vike extension (meta + global Config augmentation)
├── plugin.ts             # Vite plugin factory (closeBundle generation)
├── resolveConfig.ts      # Normalize and default plugin options
├── collector.ts          # Gather pages + per-page +rss.ts config via getVikeConfig
├── filter.ts             # Include/exclude logic for feed membership
├── metadata.ts           # Resolve per-item RSS metadata (async, batched concurrency)
├── serializer.ts         # Serialize feed data to XML (RSS 2.0), Atom, or JSON Feed
├── writer.ts             # Write feed files to disk
├── validator.ts          # Validate feed output against spec (optional)
└── types.ts              # All public and internal type definitions

test/                     # Unit tests (mirror src/ structure)
docs/                     # User-facing documentation guides
```

## Specification

### Core Behavior

- The plugin runs as a **Vite plugin** with `apply: "build"`. Feed generation happens in the **`closeBundle`** hook of the **SSR build pass**, using `getVikeConfig(viteConfig)` from `vike/plugin` to access route data and prerender page contexts.
- Works in SSR (dynamic server), SSG (prerendered), and SPA environments.

### Feed Formats

- **RSS 2.0** (default) — standard XML feed per the RSS 2.0 specification.
- **Atom 1.0** — full Atom feed support as an alternative format.
- **JSON Feed 1.1** — modern JSON-based feed format.
- Users can generate one or multiple formats per group.

### Base URL

- `baseUrl` is a **required** top-level plugin option. RSS feeds require fully qualified URLs for `<link>`, `<guid>`, and self-referencing `<atom:link>` elements.
- Trailing slashes are stripped automatically during config resolution.

### Groups (Feed Channels)

- Users define **groups** (also called channels or feeds) at the plugin level. Each group produces one or more feed files (depending on format).
- A group has:
  - `id` — the identifier that `+rss.ts` files reference to target this group (e.g., `"blog"`).
  - `name` — the output filename (e.g., `"blog"` produces `blog.xml`, `"blog.app"` produces `blog.app.xml`). Defaults to the `id` if omitted.
  - `outDir` — optional custom output directory relative to the build output root (e.g., `"feed"` writes to `dist/client/feed/`). Defaults to the build output root.
  - `format` — `"rss"` (default), `"atom"`, `"json"`, or an array for multiple formats (e.g., `["rss", "atom"]` produces both `blog.xml` and `blog.atom.xml`).
  - Channel-level metadata: `title`, `description`, `link`, `language`, `copyright`, `managingEditor`, `webMaster`, `ttl`, `image`, `category`, `skipHours`, `skipDays`.
  - `selfLink` — if `true` (default), includes an `<atom:link rel="self">` element pointing to the feed's own URL. Requires `baseUrl`.
  - `maxItems` — maximum number of items to include in the feed (e.g., `20` for the latest 20 posts). When set, items are sorted by `pubDate` descending and truncated. No limit by default.
  - `sortBy` — field to sort items by. Defaults to `"pubDate"`. Can also be `"title"` or a custom comparator function.
  - `sortOrder` — `"desc"` (default, newest first) or `"asc"`.
  - `prettyXml` — whether to indent/format the XML output. Defaults to `false` (minified).
- Multiple groups can exist simultaneously (e.g., a "blog" feed, a "changelog" feed, a "podcast" feed).
- A **default group** can be specified at the plugin level. Pages whose `+rss.ts` does not specify a group are assigned to the default group. If no default group is configured, pages without an explicit group assignment are excluded from all feeds.

### Per-Page Configuration (`+rss.ts`)

- Pages opt into one or more feed groups by exporting config from a co-located `+rss.ts` file.
- The `+rss.ts` export can be:
  - A **single config object** — targets one group with one set of metadata.
  - An **array of config objects** — targets multiple groups, each with its own metadata (e.g., full content for "blog", stripped for "app").
  - An **async function** receiving page context (route params, data) and returning a single config object or an array — useful for dynamic data.
- When targeting multiple groups from a single page, each entry in the array can have different metadata. This allows the same page to appear in a full-content feed and a minimal/stripped feed simultaneously.
- Per-page item metadata fields:
  - `group` — the `id` of the group this item belongs to. Required unless a default group is configured at the plugin level.
  - `title` — item title (required).
  - `description` — item summary or excerpt.
  - `content` — full HTML content of the item (wrapped in CDATA).
  - `pubDate` — publication date (`Date` object, ISO string, or Unix timestamp).
  - `author` — author name or email.
  - `categories` — array of category strings.
  - `guid` — globally unique identifier (defaults to the page URL).
  - `enclosure` — media attachment (`url`, `length`, `type`) for podcast support.
  - `customFields` — record of additional XML elements to inject per item (e.g., `{ "dc:creator": "Author Name", "media:content": { url: "...", medium: "image" } }`).
- Pages without a `+rss.ts` file are excluded from all feeds.

### Content Integration

- Optional integration with `vike-content-collection`: if the consuming app uses content collections, `+rss.ts` can reference collection entry data for title, description, dates, etc.
- The plugin itself does not depend on `vike-content-collection` — it reads whatever data is available through Vike's page config system.

### Advanced Features

- **Conditional inclusion** — global `include`/`exclude` patterns (glob or regex) to filter pages beyond `+rss.ts` presence.
- **Custom date handling** — support for `lastBuildDate` at channel level, `pubDate` per item. Accept `Date`, ISO string, or Unix timestamp.
- **Automatic `lastBuildDate`** — set to the build timestamp by default.
- **Git-based dates** — optional helper to derive `pubDate` from git commit history (last modified date of the source file).
- **CDATA wrapping** — HTML content in `description` or `content` fields is automatically wrapped in `<![CDATA[...]]>`.
- **Feed validation** — optional post-generation validation against the RSS 2.0 / Atom spec, logging warnings for missing required fields.
- **Dry run mode** — generate feeds in memory and log output without writing to disk.
- **Concurrency control** — configurable concurrency for async per-page metadata resolution.
- **Custom XML namespaces** — allow users to inject additional XML namespaces at the channel level (e.g., iTunes podcast namespace, Dublin Core, Media RSS).
- **Custom item fields** — per-item `customFields` record for injecting arbitrary XML elements (e.g., `dc:creator`, `media:content`). Works with any registered namespace.
- **Stylesheet reference** — optional `xml-stylesheet` processing instruction for XSL stylesheets.
- **Self-referencing link** — automatic `<atom:link rel="self">` element per feed (RSS best practice). Derived from `baseUrl` + group output path. Can be disabled per group.
- **Pretty XML** — optional indented/formatted XML output for debugging. Defaults to minified.
- **Item sorting** — items sorted by `pubDate` descending by default. Configurable per group: sort by any field, custom comparator, ascending or descending.
- **Item limit** — `maxItems` per group to cap feed size (e.g., latest 20 posts). Applied after sorting.
- **`skipHours` / `skipDays`** — RSS 2.0 channel-level elements that hint to aggregators when not to poll.
- **Hub / WebSub** — optional `<atom:link rel="hub">` element for real-time feed push notifications.
- **Feed pagination** — RFC 5005 paging (`<link rel="next">`, `<link rel="previous">`) for large feeds split across multiple files.

### Plugin API

```ts
import { vikeRss } from "vike-rss-generator";

// vite.config.ts
export default {
  plugins: [
    vikeRss({
      baseUrl: "https://example.com",
      groups: [
        {
          id: "blog",
          name: "blog",       // output: dist/client/feed/blog.xml
          outDir: "feed",     // output directory: dist/client/feed/
          format: "rss",
          title: "My Blog",
          description: "Latest posts from my blog",
          link: "https://example.com/blog",
          language: "en",
          maxItems: 20,
        },
        {
          id: "app",
          name: "blog.app",   // output: dist/client/feed/blog.app.xml (stripped version)
          outDir: "feed",
          format: "rss",
          title: "My Blog (App Feed)",
          description: "Minimal feed for app consumption",
          link: "https://example.com/blog",
        },
      ],
    }),
  ],
};
```

### Vike Extension

```ts
// +config.ts (root)
import vikeRssConfig from "vike-rss-generator/config";

export default {
  extends: [vikeRssConfig],
};
```

### Per-Page Usage

**Single group — static config:**

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

**Multiple groups — different metadata per group:**

A single `+rss.ts` can target multiple groups by exporting an array. Each entry provides group-specific metadata, so the same page can appear with full content in one feed and a minimal version in another.

```ts
// pages/blog/@slug/+rss.ts
import type { RssPageConfig } from "vike-rss-generator";

export const rss: RssPageConfig = [
  {
    group: "blog",
    title: "My Post Title",
    description: "A detailed summary of the post",
    content: "<p>Full HTML content of the article...</p>",
    pubDate: new Date("2026-03-01"),
    categories: ["tech", "tutorial"],
  },
  {
    group: "app",
    title: "My Post Title",
    // Minimal — no content or description, just title + link for app consumption
  },
];
```

**Multiple groups — async function with dynamic data:**

The async function variant also supports returning an array for multi-group output.

```ts
// pages/blog/@slug/+rss.ts
import type { RssPageConfigFn } from "vike-rss-generator";

export const rss: RssPageConfigFn = async (ctx) => [
  {
    group: "blog",
    title: ctx.data.title,
    description: ctx.data.excerpt,
    content: ctx.data.htmlContent,
    pubDate: ctx.data.publishedAt,
    categories: ctx.data.tags,
    author: ctx.data.author.email,
  },
  {
    group: "app",
    title: ctx.data.title,
    pubDate: ctx.data.publishedAt,
  },
];
```

**Single group — async function (simple case):**

```ts
// pages/blog/@slug/+rss.ts
import type { RssPageConfigFn } from "vike-rss-generator";

export const rss: RssPageConfigFn = async (ctx) => ({
  group: "blog",
  title: ctx.data.title,
  description: ctx.data.excerpt,
  pubDate: ctx.data.publishedAt,
  categories: ctx.data.tags,
});
```

## Vike Integration Pattern

1. **`src/config.ts`** — Vike extension module: registers `rss` as a meta key with `env: { config: true, server: true }`, augments `Vike.Config` globally so `+rss.ts` files are typed.
2. **`src/plugin.ts`** — Vite plugin: `apply: "build"`, runs in `closeBundle` on the SSR build pass, calls `getVikeConfig()` to collect all page configs including `+rss.ts` data.
3. **`src/collector.ts`** — iterates over Vike's page list, extracts `page.config.rss` from each page, resolves async config functions with page context.
4. **Pipeline:** `resolveConfig` -> `collect` -> `filter` -> `metadata` -> `serialize` -> `validate` (optional) -> `write`.

## Documentation

When code is changed, added, or removed, update **all** of the following to reflect the change:

- `docs/*.md` (the relevant guide)
- `README.md`
- `llms.txt`
- `llms-full.txt`

These files must stay accurate and consistent with the actual implementation.

### Documentation Guides (planned)

| Guide | Topic |
| --- | --- |
| `docs/getting-started.md` | Installation, basic setup, first feed |
| `docs/groups.md` | Defining multiple feed groups/channels |
| `docs/per-page-config.md` | Using `+rss.ts` files for item metadata |
| `docs/formats.md` | RSS 2.0 vs Atom vs JSON Feed output |
| `docs/custom-output-directory.md` | Changing where feed files are written |
| `docs/content-in-feeds.md` | Including full HTML content in feed items |
| `docs/podcast-feeds.md` | iTunes namespace and enclosure support |
| `docs/git-dates.md` | Deriving pubDate from git history |
| `docs/validation.md` | Feed validation and dry run mode |
| `docs/advanced-options.md` | Namespaces, stylesheets, concurrency |

## Unit Tests

Every feature or functionality must be tested. Use the Bun testing suite. The test file structure mirrors `src/`:

| Source file | Test file |
| --- | --- |
| `src/plugin.ts` | `test/plugin.test.ts` |
| `src/config.ts` | `test/config.test.ts` |
| `src/collector.ts` | `test/collector.test.ts` |
| `src/filter.ts` | `test/filter.test.ts` |
| `src/metadata.ts` | `test/metadata.test.ts` |
| `src/serializer.ts` | `test/serializer.test.ts` |
| `src/writer.ts` | `test/writer.test.ts` |
| `src/validator.ts` | `test/validator.test.ts` |
| `src/resolveConfig.ts` | `test/resolveConfig.test.ts` |

- New functionality must have corresponding tests.
- Modified behavior must have its tests updated to match.
- Removed functionality must have its tests removed.
- Run `bun test` to verify all tests pass before considering a change complete.

## Rules

### 1. Keep Documentation in Sync

See the Documentation section above. Every public API, option, type, or behavior change must be reflected across all documentation surfaces in the same change.

### 2. Keep Tests in Sync

See the Unit Tests section above.

### 3. Apply KISS and SOLID Principles

The library must follow **KISS (Keep It Simple, Stupid)** and **SOLID** principles at every level:

**KISS:**

- Prefer the simplest solution that solves the problem. Avoid premature abstraction and over-engineering.
- Keep the public API surface small and intuitive. A developer should be able to set up a basic feed in under 5 minutes.
- Minimize configuration required for common use cases. Sensible defaults should cover 80% of scenarios without any extra options.
- Avoid deep inheritance hierarchies or complex generics. Flat, readable code wins over clever code.
- Each function should be short and do one obvious thing. If a function needs a comment to explain what it does, it's too complex.

**SOLID:**

- **Single Responsibility:** Each module handles one concern — collecting, filtering, serializing, writing, and validating are all separate files.
- **Open/Closed:** Support new feed formats or namespaces through configuration and composition, not by modifying serializer internals.
- **Liskov Substitution:** Any feed format serializer should be interchangeable through a common interface.
- **Interface Segregation:** Keep type interfaces focused. Plugin options, per-page config, and channel metadata are separate types.
- **Dependency Inversion:** High-level pipeline code depends on abstractions (serializer interface, writer interface), not concrete implementations.

## Coding Conventions

- Use **tabs** for indentation and **double quotes** for strings (enforced by Biome).
- Use `.ts` extensions in all imports (`allowImportingTsExtensions` in tsconfig).
- Run `biome check .` (or `bun run lint`) to verify linting before finishing.
- Prefer named exports. The main `src/index.ts` re-exports the public API.
- All type definitions go in `src/types.ts`.
- **Always use `bun`** as the package manager. Never `npm`, `yarn`, or `pnpm`.

## Commands

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run build` | Build with tsup to `dist/` |
| `bun test` | Run all unit tests |
| `bun run lint` | Check code quality (Biome) |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run format` | Auto-format code (Biome) |

## Package Exports

```jsonc
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./config": {
      "types": "./dist/config.d.ts",
      "default": "./dist/config.js"
    }
  }
}
```

- `vike-rss-generator` — main entry: plugin factory, helper utilities, and all public types.
- `vike-rss-generator/config` — Vike extension config (used in `extends` only).
