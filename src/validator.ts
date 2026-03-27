import type { FeedFormat, ResolvedGroupConfig, RssFeedItem } from "./types.ts";

const LOG_PREFIX = "[vike-rss-generator]";

/**
 * Validates a feed's channel and items against the spec for the given format.
 * Logs warnings for missing required fields but never fails the build.
 */
export function validateFeed(
	group: ResolvedGroupConfig,
	items: RssFeedItem[],
	format: FeedFormat,
): void {
	switch (format) {
		case "rss":
			validateRss(group, items);
			break;
		case "atom":
			validateAtom(group, items);
			break;
		case "json":
			validateJsonFeed(group, items);
			break;
	}
}

function validateRss(group: ResolvedGroupConfig, items: RssFeedItem[]): void {
	const feedId = `RSS feed "${group.id}"`;

	if (!group.title) {
		warn(`${feedId}: missing required channel <title>.`);
	}
	if (!group.link) {
		warn(`${feedId}: missing required channel <link>.`);
	}
	if (!group.description) {
		warn(`${feedId}: missing required channel <description>.`);
	}

	for (const item of items) {
		if (!item.title && !item.description) {
			warn(
				`${feedId}: item "${item.guid}" must have at least a <title> or <description>.`,
			);
		}
	}
}

function validateAtom(group: ResolvedGroupConfig, items: RssFeedItem[]): void {
	const feedId = `Atom feed "${group.id}"`;

	if (!group.title) {
		warn(`${feedId}: missing required <title>.`);
	}
	if (!group.link) {
		warn(`${feedId}: missing required <id>.`);
	}

	for (const item of items) {
		if (!item.title) {
			warn(`${feedId}: entry "${item.guid}" is missing required <title>.`);
		}
		if (!item.pubDate) {
			warn(`${feedId}: entry "${item.guid}" is missing recommended <updated>.`);
		}
	}
}

function validateJsonFeed(
	group: ResolvedGroupConfig,
	items: RssFeedItem[],
): void {
	const feedId = `JSON Feed "${group.id}"`;

	if (!group.title) {
		warn(`${feedId}: missing required "title" field.`);
	}

	for (const item of items) {
		if (!item.guid) {
			warn(`${feedId}: item is missing required "id" field.`);
		}
	}
}

function warn(message: string): void {
	console.warn(`${LOG_PREFIX} ${message}`);
}
