import { toIso8601, toRfc2822 } from "./metadata.ts";
import type { ResolvedGroupConfig, RssFeedItem } from "./types.ts";

// ── RSS 2.0 ──────────────────────────────────────────────────────────

export function serializeRss(
	group: ResolvedGroupConfig,
	items: RssFeedItem[],
	baseUrl: string,
): string {
	const indent = group.prettyXml ? "  " : "";
	const nl = group.prettyXml ? "\n" : "";
	const lines: string[] = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');

	if (group.stylesheet) {
		lines.push(
			`<?xml-stylesheet type="text/xsl" href="${escapeXml(group.stylesheet)}"?>`,
		);
	}

	const nsAttrs = buildNamespaceAttrs(group);
	lines.push(`<rss version="2.0"${nsAttrs}>`);
	lines.push(`${indent}<channel>`);

	lines.push(`${indent}${indent}<title>${escapeXml(group.title)}</title>`);
	lines.push(`${indent}${indent}<link>${escapeXml(group.link)}</link>`);
	lines.push(
		`${indent}${indent}<description>${escapeXml(group.description)}</description>`,
	);
	lines.push(
		`${indent}${indent}<lastBuildDate>${toRfc2822(new Date())}</lastBuildDate>`,
	);

	if (group.language) {
		lines.push(
			`${indent}${indent}<language>${escapeXml(group.language)}</language>`,
		);
	}
	if (group.copyright) {
		lines.push(
			`${indent}${indent}<copyright>${escapeXml(group.copyright)}</copyright>`,
		);
	}
	if (group.managingEditor) {
		lines.push(
			`${indent}${indent}<managingEditor>${escapeXml(group.managingEditor)}</managingEditor>`,
		);
	}
	if (group.webMaster) {
		lines.push(
			`${indent}${indent}<webMaster>${escapeXml(group.webMaster)}</webMaster>`,
		);
	}
	if (group.ttl !== undefined) {
		lines.push(`${indent}${indent}<ttl>${group.ttl}</ttl>`);
	}
	if (group.category) {
		for (const cat of group.category) {
			lines.push(`${indent}${indent}<category>${escapeXml(cat)}</category>`);
		}
	}
	if (group.skipHours && group.skipHours.length > 0) {
		lines.push(`${indent}${indent}<skipHours>`);
		for (const hour of group.skipHours) {
			lines.push(`${indent}${indent}${indent}<hour>${hour}</hour>`);
		}
		lines.push(`${indent}${indent}</skipHours>`);
	}
	if (group.skipDays && group.skipDays.length > 0) {
		lines.push(`${indent}${indent}<skipDays>`);
		for (const day of group.skipDays) {
			lines.push(`${indent}${indent}${indent}<day>${escapeXml(day)}</day>`);
		}
		lines.push(`${indent}${indent}</skipDays>`);
	}
	if (group.image) {
		lines.push(`${indent}${indent}<image>`);
		lines.push(
			`${indent}${indent}${indent}<url>${escapeXml(group.image.url)}</url>`,
		);
		lines.push(
			`${indent}${indent}${indent}<title>${escapeXml(group.image.title)}</title>`,
		);
		lines.push(
			`${indent}${indent}${indent}<link>${escapeXml(group.image.link)}</link>`,
		);
		if (group.image.width !== undefined) {
			lines.push(
				`${indent}${indent}${indent}<width>${group.image.width}</width>`,
			);
		}
		if (group.image.height !== undefined) {
			lines.push(
				`${indent}${indent}${indent}<height>${group.image.height}</height>`,
			);
		}
		if (group.image.description) {
			lines.push(
				`${indent}${indent}${indent}<description>${escapeXml(group.image.description)}</description>`,
			);
		}
		lines.push(`${indent}${indent}</image>`);
	}

	if (group.selfLink) {
		const feedPath = resolveFeedPath(group, "rss");
		lines.push(
			`${indent}${indent}<atom:link href="${escapeXml(`${baseUrl}/${feedPath}`)}" rel="self" type="application/rss+xml"/>`,
		);
	}
	if (group.hub) {
		lines.push(
			`${indent}${indent}<atom:link href="${escapeXml(group.hub)}" rel="hub"/>`,
		);
	}

	for (const item of items) {
		lines.push(...serializeRssItem(item, indent));
	}

	lines.push(`${indent}</channel>`);
	lines.push("</rss>");

	return lines.join(nl);
}

function serializeRssItem(item: RssFeedItem, indent: string): string[] {
	const lines: string[] = [];
	lines.push(`${indent}${indent}<item>`);
	lines.push(
		`${indent}${indent}${indent}<title>${escapeXml(item.title)}</title>`,
	);
	lines.push(`${indent}${indent}${indent}<link>${escapeXml(item.link)}</link>`);

	if (item.description) {
		lines.push(
			`${indent}${indent}${indent}<description>${wrapCdata(item.description)}</description>`,
		);
	}
	if (item.content) {
		lines.push(
			`${indent}${indent}${indent}<content:encoded>${wrapCdata(item.content)}</content:encoded>`,
		);
	}
	if (item.pubDate) {
		lines.push(
			`${indent}${indent}${indent}<pubDate>${toRfc2822(item.pubDate)}</pubDate>`,
		);
	}
	if (item.author) {
		lines.push(
			`${indent}${indent}${indent}<author>${escapeXml(item.author)}</author>`,
		);
	}
	if (item.categories) {
		for (const cat of item.categories) {
			lines.push(
				`${indent}${indent}${indent}<category>${escapeXml(cat)}</category>`,
			);
		}
	}
	lines.push(`${indent}${indent}${indent}<guid>${escapeXml(item.guid)}</guid>`);
	if (item.enclosure) {
		lines.push(
			`${indent}${indent}${indent}<enclosure url="${escapeXml(item.enclosure.url)}" length="${item.enclosure.length}" type="${escapeXml(item.enclosure.type)}"/>`,
		);
	}
	if (item.customFields) {
		for (const [key, value] of Object.entries(item.customFields)) {
			if (typeof value === "string") {
				lines.push(
					`${indent}${indent}${indent}<${key}>${escapeXml(value)}</${key}>`,
				);
			} else {
				const attrs = Object.entries(value)
					.map(([k, v]) => `${k}="${escapeXml(v)}"`)
					.join(" ");
				lines.push(`${indent}${indent}${indent}<${key} ${attrs}/>`);
			}
		}
	}

	lines.push(`${indent}${indent}</item>`);
	return lines;
}

function buildNamespaceAttrs(group: ResolvedGroupConfig): string {
	const ns: Record<string, string> = {
		...group.namespaces,
	};

	if (group.selfLink || group.hub) {
		ns.atom ??= "http://www.w3.org/2005/Atom";
	}

	if (!ns.content) {
		ns.content = "http://purl.org/rss/1.0/modules/content/";
	}

	const attrs = Object.entries(ns)
		.map(([prefix, uri]) => ` xmlns:${prefix}="${escapeXml(uri)}"`)
		.join("");

	return attrs;
}

// ── Atom 1.0 ─────────────────────────────────────────────────────────

export function serializeAtom(
	group: ResolvedGroupConfig,
	items: RssFeedItem[],
	baseUrl: string,
): string {
	const indent = group.prettyXml ? "  " : "";
	const nl = group.prettyXml ? "\n" : "";
	const lines: string[] = [];

	lines.push('<?xml version="1.0" encoding="UTF-8"?>');

	if (group.stylesheet) {
		lines.push(
			`<?xml-stylesheet type="text/xsl" href="${escapeXml(group.stylesheet)}"?>`,
		);
	}

	lines.push('<feed xmlns="http://www.w3.org/2005/Atom">');

	lines.push(`${indent}<title>${escapeXml(group.title)}</title>`);
	lines.push(`${indent}<subtitle>${escapeXml(group.description)}</subtitle>`);
	lines.push(
		`${indent}<link href="${escapeXml(group.link)}" rel="alternate"/>`,
	);
	lines.push(`${indent}<id>${escapeXml(group.link)}</id>`);
	lines.push(`${indent}<updated>${toIso8601(new Date())}</updated>`);

	if (group.selfLink) {
		const feedPath = resolveFeedPath(group, "atom");
		lines.push(
			`${indent}<link href="${escapeXml(`${baseUrl}/${feedPath}`)}" rel="self" type="application/atom+xml"/>`,
		);
	}
	if (group.hub) {
		lines.push(`${indent}<link href="${escapeXml(group.hub)}" rel="hub"/>`);
	}
	if (group.language) {
		lines.push(`${indent}<language>${escapeXml(group.language)}</language>`);
	}
	if (group.copyright) {
		lines.push(`${indent}<rights>${escapeXml(group.copyright)}</rights>`);
	}
	if (group.image) {
		lines.push(`${indent}<icon>${escapeXml(group.image.url)}</icon>`);
	}
	if (group.category) {
		for (const cat of group.category) {
			lines.push(`${indent}<category term="${escapeXml(cat)}"/>`);
		}
	}

	for (const item of items) {
		lines.push(...serializeAtomEntry(item, indent));
	}

	lines.push("</feed>");

	return lines.join(nl);
}

function serializeAtomEntry(item: RssFeedItem, indent: string): string[] {
	const lines: string[] = [];
	lines.push(`${indent}<entry>`);
	lines.push(`${indent}${indent}<title>${escapeXml(item.title)}</title>`);
	lines.push(
		`${indent}${indent}<link href="${escapeXml(item.link)}" rel="alternate"/>`,
	);
	lines.push(`${indent}${indent}<id>${escapeXml(item.guid)}</id>`);

	if (item.pubDate) {
		lines.push(
			`${indent}${indent}<updated>${toIso8601(item.pubDate)}</updated>`,
		);
		lines.push(
			`${indent}${indent}<published>${toIso8601(item.pubDate)}</published>`,
		);
	}
	if (item.author) {
		lines.push(`${indent}${indent}<author>`);
		lines.push(
			`${indent}${indent}${indent}<name>${escapeXml(item.author)}</name>`,
		);
		lines.push(`${indent}${indent}</author>`);
	}
	if (item.description) {
		lines.push(
			`${indent}${indent}<summary type="html">${wrapCdata(item.description)}</summary>`,
		);
	}
	if (item.content) {
		lines.push(
			`${indent}${indent}<content type="html">${wrapCdata(item.content)}</content>`,
		);
	}
	if (item.categories) {
		for (const cat of item.categories) {
			lines.push(`${indent}${indent}<category term="${escapeXml(cat)}"/>`);
		}
	}
	if (item.enclosure) {
		lines.push(
			`${indent}${indent}<link rel="enclosure" href="${escapeXml(item.enclosure.url)}" length="${item.enclosure.length}" type="${escapeXml(item.enclosure.type)}"/>`,
		);
	}

	lines.push(`${indent}</entry>`);
	return lines;
}

// ── JSON Feed 1.1 ────────────────────────────────────────────────────

export function serializeJsonFeed(
	group: ResolvedGroupConfig,
	items: RssFeedItem[],
	baseUrl: string,
): string {
	const feedPath = resolveFeedPath(group, "json");

	const feed: Record<string, any> = {
		version: "https://jsonfeed.org/version/1.1",
		title: group.title,
		home_page_url: group.link,
		description: group.description,
	};

	if (group.selfLink) {
		feed.feed_url = `${baseUrl}/${feedPath}`;
	}
	if (group.language) {
		feed.language = group.language;
	}
	if (group.image) {
		feed.icon = group.image.url;
	}

	feed.items = items.map((item) => {
		const entry: Record<string, any> = {
			id: item.guid,
			url: item.link,
			title: item.title,
		};

		if (item.content) {
			entry.content_html = item.content;
		}
		if (item.description) {
			entry.summary = item.description;
		}
		if (item.pubDate) {
			entry.date_published = toIso8601(item.pubDate);
		}
		if (item.author) {
			entry.authors = [{ name: item.author }];
		}
		if (item.categories) {
			entry.tags = item.categories;
		}
		if (item.enclosure) {
			entry.attachments = [
				{
					url: item.enclosure.url,
					mime_type: item.enclosure.type,
					size_in_bytes: item.enclosure.length,
				},
			];
		}

		return entry;
	});

	return JSON.stringify(feed, null, group.prettyXml ? 2 : undefined);
}

// ── Helpers ──────────────────────────────────────────────────────────

export function resolveFeedPath(
	group: ResolvedGroupConfig,
	format: "rss" | "atom" | "json",
): string {
	const name = group.name;
	const prefix = group.outDir ? `${group.outDir}/` : "";

	if (group.extension) {
		return `${prefix}${name}${group.extension}`;
	}

	switch (format) {
		case "rss":
			return `${prefix}${name}.xml`;
		case "atom": {
			const hasRss = group.formats.includes("rss");
			return hasRss ? `${prefix}${name}.atom.xml` : `${prefix}${name}.xml`;
		}
		case "json":
			return `${prefix}${name}.json`;
	}
}

export function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function wrapCdata(content: string): string {
	if (content.includes("]]>")) {
		return escapeXml(content);
	}
	return `<![CDATA[${content}]]>`;
}
