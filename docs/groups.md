# Groups

Groups define separate feed channels. Each group produces its own feed file(s).

## Defining Groups

```ts
vikeRss({
  baseUrl: "https://example.com",
  groups: [
    {
      id: "blog",
      title: "Blog",
      description: "Latest blog posts",
      format: "rss",
      language: "en",
      maxItems: 20,
    },
    {
      id: "changelog",
      title: "Changelog",
      description: "Product updates",
      format: ["rss", "atom"],
    },
  ],
});
```

## Group ID

The `id` is what `+rss.ts` files reference to target a group:

```ts
// +rss.ts
export const rss = {
  group: "blog", // matches the group with id: "blog"
  title: "My Post",
};
```

## Default Group

If many pages target the same group, set a `defaultGroup` so they don't need to specify `group` in every `+rss.ts`:

```ts
vikeRss({
  baseUrl: "https://example.com",
  defaultGroup: "blog",
  groups: [
    { id: "blog", title: "Blog", description: "Feed" },
  ],
});
```

Pages whose `+rss.ts` omits `group` are assigned to the default group. Pages without a `+rss.ts` file are always excluded.

## Output Filename

The `name` option controls the output filename (without extension). Defaults to the `id`:

```ts
{
  id: "blog",
  name: "feed",     // outputs: feed.xml instead of blog.xml
}
```

## Custom Extension

By default, the file extension is determined by the format (`.xml` for RSS/Atom, `.json` for JSON Feed). Set `extension` to override:

```ts
{
  id: "blog",
  name: "blog",
  extension: ".rss",  // outputs: blog.rss instead of blog.xml
}
```

When `extension` is set, it applies to all formats in the group.

## Channel Metadata

Each group supports RSS channel-level metadata:

| Field | Description |
| --- | --- |
| `title` | Channel title (required) |
| `description` | Channel description (required) |
| `link` | Channel URL (defaults to `baseUrl`) |
| `language` | Language code (e.g., `"en"`) |
| `copyright` | Copyright notice |
| `managingEditor` | Editor email |
| `webMaster` | Webmaster email |
| `ttl` | Time-to-live in minutes |
| `image` | Channel image (`{ url, title, link }`) |
| `category` | Category string or array |
| `skipHours` | Hours (0-23) to skip |
| `skipDays` | Days to skip |
