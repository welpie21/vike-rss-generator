import { getVikeConfig } from "vike/plugin";
import type { ResolvedConfig as ViteResolvedConfig } from "vite";
import { collectPages } from "./collector.ts";
import { filterPages } from "./filter.ts";
import { resolveMetadata } from "./metadata.ts";
import { resolveConfig } from "./resolveConfig.ts";
import {
	serializeAtom,
	serializeJsonFeed,
	serializeRss,
} from "./serializer.ts";
import type {
	FeedFormat,
	ResolvedGroupConfig,
	RssFeedItem,
	RssPluginOptions,
	RssSortComparator,
} from "./types.ts";
import { validateFeed } from "./validator.ts";
import { resolveOutputPath, writeFeed } from "./writer.ts";

const LOG_PREFIX = "[vike-rss-generator]";

export function vikeRss(options: RssPluginOptions): any {
	const config = resolveConfig(options);
	let viteConfig: ViteResolvedConfig;

	return {
		name: "vike-rss-generator",
		apply: "build",

		async configResolved(resolved: ViteResolvedConfig) {
			viteConfig = resolved;
		},

		async closeBundle() {
			if (!viteConfig.build.ssr) return;

			const vikeConfig = getVikeConfig(viteConfig as unknown as any);
			const outDir = resolveClientOutDir(viteConfig);

			const collected = collectPages(vikeConfig);
			const filtered = filterPages(collected, config.include, config.exclude);

			if (filtered.length === 0) {
				console.warn(
					`${LOG_PREFIX} No pages with +rss.ts config found — skipping feed generation.`,
				);
				return;
			}

			const grouped = await resolveMetadata(
				filtered,
				config.baseUrl,
				config.defaultGroup,
				config.concurrency,
			);

			for (const group of config.groups) {
				const items = grouped.get(group.id);
				if (!items || items.length === 0) continue;

				const sorted = sortItems(items, group);
				const truncated = group.maxItems
					? sorted.slice(0, group.maxItems)
					: sorted;

				for (const format of group.formats) {
					const content = serialize(group, truncated, config.baseUrl, format);
					validateFeed(group, truncated, format);

					if (config.dryRun) {
						console.log(
							`${LOG_PREFIX} Dry-run (${group.id}/${format}):\n${content}`,
						);
						continue;
					}

					const outputPath = resolveOutputPath(group, format, outDir);
					await writeFeed(content, outputPath);
					console.log(
						`${LOG_PREFIX} Generated ${format} feed "${group.id}" with ${truncated.length} items → ${outputPath}`,
					);
				}
			}
		},
	};
}

function serialize(
	group: ResolvedGroupConfig,
	items: RssFeedItem[],
	baseUrl: string,
	format: FeedFormat,
): string {
	switch (format) {
		case "rss":
			return serializeRss(group, items, baseUrl);
		case "atom":
			return serializeAtom(group, items, baseUrl);
		case "json":
			return serializeJsonFeed(group, items, baseUrl);
	}
}

function sortItems(
	items: RssFeedItem[],
	group: ResolvedGroupConfig,
): RssFeedItem[] {
	const sorted = [...items];

	if (typeof group.sortBy === "function") {
		sorted.sort(group.sortBy as RssSortComparator);
		return sorted;
	}

	const field = group.sortBy;
	const direction = group.sortOrder === "asc" ? 1 : -1;

	sorted.sort((a, b) => {
		if (field === "pubDate") {
			const aTime = a.pubDate?.getTime() ?? 0;
			const bTime = b.pubDate?.getTime() ?? 0;
			return (aTime - bTime) * direction;
		}
		return a.title.localeCompare(b.title) * direction;
	});

	return sorted;
}

/**
 * Derives the client output directory from the SSR build's resolved config.
 * Vike uses `{outDirRoot}/server` for SSR and `{outDirRoot}/client` for the
 * client build.
 */
function resolveClientOutDir(ssrViteConfig: ViteResolvedConfig): string {
	const ssrOutDir = ssrViteConfig.build.outDir;
	if (ssrOutDir.endsWith("/server")) {
		return `${ssrOutDir.slice(0, -"/server".length)}/client`;
	}
	return ssrOutDir.replace(/\/server\/$/, "/client/");
}
