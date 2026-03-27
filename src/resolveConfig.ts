import type {
	ResolvedConfig,
	ResolvedGroupConfig,
	RssGroupConfig,
	RssPluginOptions,
} from "./types.ts";

export function resolveConfig(options: RssPluginOptions): ResolvedConfig {
	const baseUrl = options.baseUrl.replace(/\/+$/, "");

	return {
		baseUrl,
		groups: options.groups.map((g) => resolveGroupConfig(g, baseUrl)),
		defaultGroup: options.defaultGroup,
		include: options.include ?? [],
		exclude: options.exclude ?? [],
		concurrency: options.concurrency ?? 10,
		dryRun: options.dryRun ?? false,
	};
}

function resolveGroupConfig(
	group: RssGroupConfig,
	baseUrl: string,
): ResolvedGroupConfig {
	const rawFormats = group.format ?? "rss";
	const formats = Array.isArray(rawFormats) ? rawFormats : [rawFormats];

	const rawCategory = group.category;
	const category = rawCategory
		? Array.isArray(rawCategory)
			? rawCategory
			: [rawCategory]
		: undefined;

	return {
		id: group.id,
		name: group.name ?? group.id,
		outDir: group.outDir,
		formats,
		title: group.title,
		description: group.description,
		link: group.link ?? baseUrl,
		language: group.language,
		copyright: group.copyright,
		managingEditor: group.managingEditor,
		webMaster: group.webMaster,
		ttl: group.ttl,
		image: group.image,
		category,
		skipHours: group.skipHours,
		skipDays: group.skipDays,
		selfLink: group.selfLink ?? true,
		maxItems: group.maxItems,
		sortBy: group.sortBy ?? "pubDate",
		sortOrder: group.sortOrder ?? "desc",
		prettyXml: group.prettyXml ?? false,
		extension: group.extension,
		namespaces: group.namespaces ?? {},
		stylesheet: group.stylesheet,
		hub: group.hub,
	};
}
