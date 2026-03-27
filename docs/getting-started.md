# Getting Started

## Installation

```bash
bun add vike-rss-generator
```

Peer dependencies: `vike >= 0.4.250` and `vite >= 7.0.0`.

## Setup

### 1. Add the Vite plugin

In your `vite.config.ts`, add the `vikeRss` plugin with a `baseUrl` and at least one group:

```ts
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
        },
      ],
    }),
  ],
};
```

### 2. Register the Vike extension

In your root `+config.ts`, extend with the RSS config so Vike recognizes `+rss.ts` files:

```ts
import vikeRssConfig from "vike-rss-generator/config";

export default {
  extends: [vikeRssConfig],
};
```

### 3. Create a `+rss.ts` file

Add a `+rss.ts` file next to any page that should appear in the feed:

```ts
// pages/blog/@slug/+rss.ts
import type { RssPageConfig } from "vike-rss-generator";

export const rss: RssPageConfig = {
  group: "blog",
  title: "My First Post",
  description: "An introduction to my blog",
  pubDate: new Date("2026-01-15"),
};
```

### 4. Build

Run `vite build`. The plugin generates feed files during the SSR build pass. By default, the output goes to `dist/client/blog.xml`.

## Next Steps

- [Define multiple groups](groups.md)
- [Use async config functions](per-page-config.md)
- [Generate multiple formats](formats.md)
