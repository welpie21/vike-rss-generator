# Feed Validation

The plugin includes optional spec-compliance validation that runs after feed generation.

## How It Works

After serializing each feed, the validator checks for missing required fields per the feed spec and logs warnings. Validation never fails the build — it only produces `console.warn` messages.

## What Gets Validated

### RSS 2.0

- Channel must have `title`, `link`, `description`
- Each item must have at least `title` or `description`

### Atom 1.0

- Feed must have `title` and `id`
- Each entry must have `title`
- Each entry should have `updated` (pubDate)

### JSON Feed 1.1

- Feed must have `title`
- Each item must have `id` (guid)

## Example Warnings

```
[vike-rss-generator] RSS feed "blog": missing required channel <title>.
[vike-rss-generator] RSS feed "blog": item "https://example.com/post" must have at least a <title> or <description>.
[vike-rss-generator] Atom feed "blog": entry "https://example.com/post" is missing recommended <updated>.
```

## Dry Run Mode

Use `dryRun: true` to preview generated feeds without writing to disk:

```ts
vikeRss({
  baseUrl: "https://example.com",
  groups: [{ id: "blog", title: "Blog", description: "Feed" }],
  dryRun: true,
});
```

In dry run mode, the complete feed content is logged to the console for each group and format.
