# Podcast Feeds

Generate podcast-compatible RSS feeds with enclosure elements and custom namespaces.

## Enclosures

Add media attachments to feed items using the `enclosure` field:

```ts
export const rss: RssPageConfig = {
  group: "podcast",
  title: "Episode 1: Introduction",
  description: "Welcome to the show",
  pubDate: new Date("2026-01-01"),
  enclosure: {
    url: "https://example.com/episodes/ep1.mp3",
    length: 12345678,
    type: "audio/mpeg",
  },
};
```

This produces:

```xml
<enclosure url="https://example.com/episodes/ep1.mp3" length="12345678" type="audio/mpeg"/>
```

## iTunes Namespace

For Apple Podcasts compatibility, add the iTunes namespace and custom fields:

```ts
vikeRss({
  baseUrl: "https://example.com",
  groups: [
    {
      id: "podcast",
      title: "My Podcast",
      description: "A great podcast",
      namespaces: {
        itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
      },
    },
  ],
});
```

Then use `customFields` in `+rss.ts` to add iTunes-specific elements:

```ts
export const rss: RssPageConfig = {
  group: "podcast",
  title: "Episode 1",
  description: "First episode",
  enclosure: {
    url: "https://example.com/ep1.mp3",
    length: 12345678,
    type: "audio/mpeg",
  },
  customFields: {
    "itunes:duration": "45:30",
    "itunes:episode": "1",
    "itunes:episodeType": "full",
  },
};
```

## Format Differences

| Format | Enclosure representation |
| --- | --- |
| RSS 2.0 | `<enclosure url="..." length="..." type="..."/>` |
| Atom 1.0 | `<link rel="enclosure" href="..." length="..." type="..."/>` |
| JSON Feed | `attachments: [{ url, mime_type, size_in_bytes }]` |
