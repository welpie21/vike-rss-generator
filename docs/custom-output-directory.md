# Custom Output Directory

By default, feed files are written to the client build output root (typically `dist/client/`).

## Per-Group `outDir`

Set `outDir` on a group to write feed files to a subdirectory:

```ts
{
  id: "blog",
  title: "Blog",
  description: "Feed",
  outDir: "feed",
  // Output: dist/client/feed/blog.xml
}
```

## Multiple Groups, Same Directory

```ts
groups: [
  {
    id: "blog",
    title: "Blog",
    description: "Blog posts",
    outDir: "feed",
    // Output: dist/client/feed/blog.xml
  },
  {
    id: "changelog",
    title: "Changelog",
    description: "Updates",
    outDir: "feed",
    // Output: dist/client/feed/changelog.xml
  },
];
```

## Custom Filenames

Use `name` to control the filename (without extension):

```ts
{
  id: "blog",
  name: "rss",
  outDir: "feed",
  // Output: dist/client/feed/rss.xml
}
```

## How the Output Directory Is Resolved

The plugin runs during the SSR build pass. Vike uses `{outDirRoot}/server` for SSR and `{outDirRoot}/client` for the client build. The plugin automatically derives the client output directory from the SSR config by replacing the `/server` suffix with `/client`.

If a group has `outDir` set, that path is resolved relative to the client output directory.
