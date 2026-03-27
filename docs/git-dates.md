# Git Dates

Derive publication dates from git commit history using the `getLastModFromGit` helper from the sibling package `vike-sitemap-generator`, or implement your own git-based date resolution.

## Using Git History for pubDate

You can use git log to find the last modification date of a source file and pass it to `+rss.ts`:

```ts
import type { RssPageConfigFn } from "vike-rss-generator";
import { execSync } from "node:child_process";

function getGitDate(filePath: string): Date | undefined {
  try {
    const output = execSync(
      `git log -1 --format=%cI -- "${filePath}"`,
      { encoding: "utf-8" },
    ).trim();
    return output ? new Date(output) : undefined;
  } catch {
    return undefined;
  }
}

export const rss: RssPageConfigFn = async (ctx) => ({
  group: "blog",
  title: ctx.data.title,
  pubDate: getGitDate(`src/content/blog/${ctx.routeParams.slug}.md`),
});
```

## With vike-sitemap-generator

If you're also using `vike-sitemap-generator`, you can reuse its `getLastModFromGit` helper:

```ts
import { getLastModFromGit } from "vike-sitemap-generator";
import type { RssPageConfigFn } from "vike-rss-generator";

export const rss: RssPageConfigFn = async (ctx) => ({
  group: "blog",
  title: ctx.data.title,
  pubDate: await getLastModFromGit(`src/content/blog/${ctx.routeParams.slug}.md`)
    .then(dateStr => dateStr ? new Date(dateStr) : undefined),
});
```

## Date Formats

The plugin accepts multiple date input formats:

| Input type | Example |
| --- | --- |
| `Date` object | `new Date("2026-01-01")` |
| ISO string | `"2026-01-01T00:00:00.000Z"` |
| Unix timestamp | `1735689600000` |

Dates are automatically formatted per feed spec:
- RSS 2.0: RFC 2822 (`Mon, 01 Jan 2026 00:00:00 GMT`)
- Atom 1.0: ISO 8601 (`2026-01-01T00:00:00.000Z`)
- JSON Feed: ISO 8601 (`2026-01-01T00:00:00.000Z`)
