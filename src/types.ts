// ── Feed format ──────────────────────────────────────────────────────

export type FeedFormat = "rss" | "atom" | "json";

// ── Plugin options ───────────────────────────────────────────────────

export interface RssPluginOptions {
	/** Fully qualified base URL (e.g. "https://example.com"). Required. */
	baseUrl: string;
	/** Feed group definitions. Each group produces one or more feed files. */
	groups: RssGroupConfig[];
	/** Group ID to assign pages whose +rss.ts does not specify a group. */
	defaultGroup?: string;
	/**
	 * URL path patterns to include. Only pages matching at least one pattern
	 * are considered. Supports exact strings and RegExp.
	 */
	include?: (string | RegExp)[];
	/**
	 * URL path patterns to exclude. Pages matching any pattern are removed.
	 * Supports exact strings and RegExp.
	 */
	exclude?: (string | RegExp)[];
	/** Maximum concurrent async metadata resolutions. Default: 10. */
	concurrency?: number;
	/** Generate feeds in memory and log output without writing to disk. */
	dryRun?: boolean;
}

// ── Group (channel) config ───────────────────────────────────────────

export interface RssGroupConfig {
	/** Identifier referenced by +rss.ts to target this group. */
	id: string;
	/** Output filename (without extension). Defaults to `id`. */
	name?: string;
	/** Output directory relative to the build output root. */
	outDir?: string;
	/** Feed format(s) to generate. Default: "rss". */
	format?: FeedFormat | FeedFormat[];

	// Channel metadata
	title: string;
	description: string;
	/** Channel link URL. Defaults to baseUrl. */
	link?: string;
	language?: string;
	copyright?: string;
	managingEditor?: string;
	webMaster?: string;
	/** Time-to-live in minutes. */
	ttl?: number;
	image?: RssChannelImage;
	category?: string | string[];
	/** Hours (0-23) when aggregators should skip polling. */
	skipHours?: number[];
	/** Days of the week when aggregators should skip polling. */
	skipDays?: string[];

	// Generation options
	/**
	 * Include an <atom:link rel="self"> element pointing to the feed URL.
	 * Default: true.
	 */
	selfLink?: boolean;
	/** Maximum items in the feed. Applied after sorting. */
	maxItems?: number;
	/** Field to sort items by. Default: "pubDate". */
	sortBy?: "pubDate" | "title" | RssSortComparator;
	/** Sort direction. Default: "desc". */
	sortOrder?: "asc" | "desc";
	/** Indent/format the XML output. Default: false. */
	prettyXml?: boolean;
	/** Custom file extension (e.g. ".rss"). Overrides the format default. */
	extension?: string;
	/** Additional XML namespace declarations for the channel. */
	namespaces?: Record<string, string>;
	/** XSL stylesheet URL for the xml-stylesheet processing instruction. */
	stylesheet?: string;
	/** WebSub hub URL for <atom:link rel="hub">. */
	hub?: string;
}

export type RssSortComparator = (a: RssFeedItem, b: RssFeedItem) => number;

export interface RssChannelImage {
	url: string;
	title: string;
	link: string;
	width?: number;
	height?: number;
	description?: string;
}

// ── Per-page item config (+rss.ts) ───────────────────────────────────

export interface RssItemConfig {
	/** Group ID this item belongs to. Required unless a defaultGroup is set. */
	group?: string;
	/** Override the auto-derived item link URL. */
	link?: string;
	/** Item title. */
	title: string;
	/** Item summary / excerpt. */
	description?: string;
	/** Full HTML content (wrapped in CDATA). */
	content?: string;
	/** Publication date. Accepts Date, ISO string, or Unix timestamp. */
	pubDate?: Date | string | number;
	/** Author name or email. */
	author?: string;
	/** Category tags. */
	categories?: string[];
	/** Globally unique identifier. Defaults to the page URL. */
	guid?: string;
	/** Media attachment for podcast support. */
	enclosure?: RssEnclosure;
	/** Additional XML elements per item. */
	customFields?: Record<string, string | Record<string, string>>;
}

export interface RssEnclosure {
	url: string;
	length: number;
	type: string;
}

/**
 * Static per-page config: a single item config, or an array
 * targeting multiple groups with different metadata each.
 */
export type RssPageConfig = RssItemConfig | RssItemConfig[];

/**
 * Context passed to async +rss.ts config functions.
 */
export interface RssPageContext<Data = unknown> {
	/** The concrete URL path (e.g. "/blog/post-1"). */
	url: string;
	/** Route parameters (e.g. { slug: "post-1" }). */
	routeParams: Record<string, string>;
	/** Page data from +data.ts. */
	data: Data;
}

/**
 * Function form of per-page config. Receives page context and returns
 * a single config or an array for multi-group targeting.
 */
export type RssPageConfigFn<Data = unknown> = (
	context: RssPageContext<Data>,
) => RssPageConfig | Promise<RssPageConfig>;

// ── Internal types ───────────────────────────────────────────────────

/** A collected page entry before metadata resolution. */
export interface CollectedRssPage {
	url: string;
	pageConfig: RssPageConfig | RssPageConfigFn;
	routeParams?: Record<string, string>;
	data?: any;
}

/** A resolved feed item ready for serialization. */
export interface RssFeedItem {
	link: string;
	title: string;
	description?: string;
	content?: string;
	pubDate?: Date;
	author?: string;
	categories?: string[];
	guid: string;
	enclosure?: RssEnclosure;
	customFields?: Record<string, string | Record<string, string>>;
}

/** Resolved group config with all defaults applied. */
export interface ResolvedGroupConfig {
	id: string;
	name: string;
	outDir: string | undefined;
	formats: FeedFormat[];
	title: string;
	description: string;
	link: string;
	language?: string;
	copyright?: string;
	managingEditor?: string;
	webMaster?: string;
	ttl?: number;
	image?: RssChannelImage;
	category?: string[];
	skipHours?: number[];
	skipDays?: string[];
	selfLink: boolean;
	maxItems?: number;
	sortBy: "pubDate" | "title" | RssSortComparator;
	sortOrder: "asc" | "desc";
	prettyXml: boolean;
	extension?: string;
	namespaces: Record<string, string>;
	stylesheet?: string;
	hub?: string;
}

/** Fully resolved plugin config. */
export interface ResolvedConfig {
	baseUrl: string;
	groups: ResolvedGroupConfig[];
	defaultGroup: string | undefined;
	include: (string | RegExp)[];
	exclude: (string | RegExp)[];
	concurrency: number;
	dryRun: boolean;
}
