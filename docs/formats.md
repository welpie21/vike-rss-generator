# Feed Formats

vike-rss-generator supports three feed formats. Each group can generate one or multiple formats simultaneously.

## RSS 2.0 (default)

Standard XML feed. Output extension: `.xml`.

```ts
{ format: "rss" }
```

## Atom 1.0

Full Atom feed support. Output extension: `.atom.xml` (or `.xml` if it's the only format).

```ts
{ format: "atom" }
```

## JSON Feed 1.1

Modern JSON-based format. Output extension: `.json`.

```ts
{ format: "json" }
```

## Multiple Formats

Generate multiple formats from a single group:

```ts
{
  id: "blog",
  title: "Blog",
  description: "Feed",
  format: ["rss", "atom", "json"],
  // Produces: blog.xml, blog.atom.xml, blog.json
}
```

## File Naming

| Format | Single format | With RSS |
| --- | --- | --- |
| RSS | `{name}.xml` | `{name}.xml` |
| Atom | `{name}.xml` | `{name}.atom.xml` |
| JSON | `{name}.json` | `{name}.json` |

When Atom is the only format, it uses `.xml`. When both RSS and Atom are generated, Atom uses `.atom.xml` to avoid conflicts.

### Custom Extension

Set the `extension` option on a group to override the default file extension:

```ts
{ extension: ".rss" }  // outputs blog.rss instead of blog.xml
```

## Format Differences

| Feature | RSS 2.0 | Atom 1.0 | JSON Feed 1.1 |
| --- | --- | --- | --- |
| Date format | RFC 2822 | ISO 8601 | ISO 8601 |
| Content field | `content:encoded` | `content type="html"` | `content_html` |
| Summary field | `description` | `summary` | `summary` |
| Author | `author` (email) | `author > name` | `authors[].name` |
| Categories | `category` | `category term` | `tags` |
| Enclosure | `enclosure` element | `link rel="enclosure"` | `attachments` |
| Self link | `atom:link rel="self"` | `link rel="self"` | `feed_url` |
