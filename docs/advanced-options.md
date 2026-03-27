# Advanced Options

## Custom XML Namespaces

Add namespace declarations at the channel level for extensions like Dublin Core, Media RSS, or iTunes:

```ts
{
  id: "blog",
  title: "Blog",
  description: "Feed",
  namespaces: {
    "dc": "http://purl.org/dc/elements/1.1/",
    "media": "http://search.yahoo.com/mrss/",
  },
}
```

Then reference those namespaces in per-item `customFields`:

```ts
export const rss: RssPageConfig = {
  group: "blog",
  title: "Post",
  customFields: {
    "dc:creator": "Author Name",
    "media:content": { url: "https://example.com/image.jpg", medium: "image" },
  },
};
```

String values produce `<dc:creator>Author Name</dc:creator>`. Object values produce self-closing elements with attributes: `<media:content url="..." medium="image"/>`.

## XSL Stylesheets

Add a visual stylesheet for browsers that render XML:

```ts
{
  id: "blog",
  title: "Blog",
  description: "Feed",
  stylesheet: "/feed.xsl",
}
```

Produces: `<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>`.

## WebSub / PubSubHubbub

Enable real-time push notifications via a WebSub hub:

```ts
{
  id: "blog",
  title: "Blog",
  description: "Feed",
  hub: "https://pubsubhubbub.appspot.com/",
}
```

Adds `<atom:link href="..." rel="hub"/>` to the feed.

## Self-Referencing Links

By default, each feed includes an `<atom:link rel="self">` element pointing to the feed's own URL (derived from `baseUrl` + output path). Disable per group:

```ts
{ selfLink: false }
```

## Sorting

Items are sorted by `pubDate` descending by default. Customize per group:

```ts
{
  sortBy: "title",
  sortOrder: "asc",
}
```

Or use a custom comparator:

```ts
{
  sortBy: (a, b) => a.title.localeCompare(b.title),
}
```

## Item Limits

Cap the number of items per feed:

```ts
{ maxItems: 20 }
```

Items are sorted first, then truncated.

## Include/Exclude Patterns

Filter pages globally beyond `+rss.ts` presence:

```ts
vikeRss({
  baseUrl: "https://example.com",
  groups: [...],
  include: [/^\/blog\//],         // only /blog/* pages
  exclude: ["/blog/drafts"],      // exclude specific paths
});
```

Supports exact strings and RegExp patterns.

## Concurrency

Control how many async `+rss.ts` functions run in parallel:

```ts
{ concurrency: 5 }  // default: 10
```

## Pretty Print

Enable indented XML output for debugging:

```ts
{ prettyXml: true }
```

Also affects JSON Feed formatting (`JSON.stringify` with 2-space indent).

## skipHours / skipDays

RSS 2.0 channel-level hints for aggregators:

```ts
{
  skipHours: [0, 1, 2, 3, 4, 5],
  skipDays: ["Saturday", "Sunday"],
}
```
