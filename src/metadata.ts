import type {
	CollectedRssPage,
	RssFeedItem,
	RssItemConfig,
	RssPageConfig,
	RssPageConfigFn,
} from "./types.ts";

/** Grouped feed items keyed by group ID. */
export type GroupedItems = Map<string, RssFeedItem[]>;

/**
 * Resolves per-page +rss.ts configs into concrete feed items,
 * grouped by their target group ID. Async config functions are
 * resolved in batches controlled by `concurrency`.
 */
export async function resolveMetadata(
	pages: CollectedRssPage[],
	baseUrl: string,
	defaultGroup: string | undefined,
	concurrency: number,
): Promise<GroupedItems> {
	const grouped: GroupedItems = new Map();

	for (let i = 0; i < pages.length; i += concurrency) {
		const batch = pages.slice(i, i + concurrency);
		const batchResults = await Promise.all(
			batch.map((page) => resolvePage(page, baseUrl, defaultGroup)),
		);
		for (const items of batchResults) {
			for (const { groupId, item } of items) {
				let list = grouped.get(groupId);
				if (!list) {
					list = [];
					grouped.set(groupId, list);
				}
				list.push(item);
			}
		}
	}

	return grouped;
}

interface ResolvedEntry {
	groupId: string;
	item: RssFeedItem;
}

async function resolvePage(
	page: CollectedRssPage,
	baseUrl: string,
	defaultGroup: string | undefined,
): Promise<ResolvedEntry[]> {
	let rawConfig: RssPageConfig;

	if (typeof page.pageConfig === "function") {
		rawConfig = await (page.pageConfig as RssPageConfigFn)({
			url: page.url,
			routeParams: page.routeParams ?? {},
			data: page.data,
		});
	} else {
		rawConfig = page.pageConfig;
	}

	const configs = Array.isArray(rawConfig) ? rawConfig : [rawConfig];
	const entries: ResolvedEntry[] = [];

	for (const config of configs) {
		const groupId = config.group ?? defaultGroup;
		if (!groupId) continue;

		entries.push({
			groupId,
			item: buildFeedItem(config, page.url, baseUrl),
		});
	}

	return entries;
}

function buildFeedItem(
	config: RssItemConfig,
	url: string,
	baseUrl: string,
): RssFeedItem {
	const link = config.link ?? `${baseUrl}${url}`;

	return {
		link,
		title: config.title,
		description: config.description,
		content: config.content,
		pubDate: normalizeDate(config.pubDate),
		author: config.author,
		categories: config.categories,
		guid: config.guid ?? link,
		enclosure: config.enclosure,
		customFields: config.customFields,
	};
}

export function normalizeDate(
	value: Date | string | number | undefined,
): Date | undefined {
	if (value === undefined) return undefined;
	if (value instanceof Date) return value;
	if (typeof value === "number") return new Date(value);
	return new Date(value);
}

/**
 * Formats a Date as RFC 2822 (used by RSS 2.0).
 * Example: "Mon, 01 Jan 2026 00:00:00 GMT"
 */
export function toRfc2822(date: Date): string {
	return date.toUTCString();
}

/**
 * Formats a Date as ISO 8601 (used by Atom and JSON Feed).
 * Example: "2026-01-01T00:00:00.000Z"
 */
export function toIso8601(date: Date): string {
	return date.toISOString();
}
