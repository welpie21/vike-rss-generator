import { describe, expect, test } from "bun:test";
import {
	escapeXml,
	resolveFeedPath,
	serializeAtom,
	serializeJsonFeed,
	serializeRss,
	wrapCdata,
} from "../src/serializer.ts";
import type { ResolvedGroupConfig, RssFeedItem } from "../src/types.ts";

function makeGroup(
	overrides: Partial<ResolvedGroupConfig> = {},
): ResolvedGroupConfig {
	return {
		id: "blog",
		name: "blog",
		outDir: undefined,
		formats: ["rss"],
		title: "My Blog",
		description: "A test blog",
		link: "https://example.com",
		selfLink: true,
		sortBy: "pubDate",
		sortOrder: "desc",
		prettyXml: false,
		namespaces: {},
		...overrides,
	};
}

function makeItem(overrides: Partial<RssFeedItem> = {}): RssFeedItem {
	return {
		link: "https://example.com/post-1",
		title: "Test Post",
		guid: "https://example.com/post-1",
		...overrides,
	};
}

describe("escapeXml", () => {
	test("escapes ampersands", () => {
		expect(escapeXml("A & B")).toBe("A &amp; B");
	});

	test("escapes angle brackets", () => {
		expect(escapeXml("<tag>")).toBe("&lt;tag&gt;");
	});

	test("escapes quotes", () => {
		expect(escapeXml('"hello"')).toBe("&quot;hello&quot;");
		expect(escapeXml("'hello'")).toBe("&apos;hello&apos;");
	});
});

describe("wrapCdata", () => {
	test("wraps content in CDATA", () => {
		expect(wrapCdata("<p>Hello</p>")).toBe("<![CDATA[<p>Hello</p>]]>");
	});

	test("falls back to escaping when content contains ]]>", () => {
		const result = wrapCdata("text ]]> more");
		expect(result).not.toContain("<![CDATA[");
		expect(result).toContain("&gt;");
	});
});

describe("resolveFeedPath", () => {
	test("generates .xml for rss format", () => {
		expect(resolveFeedPath(makeGroup(), "rss")).toBe("blog.xml");
	});

	test("generates .atom.xml when rss format also present", () => {
		expect(
			resolveFeedPath(makeGroup({ formats: ["rss", "atom"] }), "atom"),
		).toBe("blog.atom.xml");
	});

	test("generates .xml for atom-only format", () => {
		expect(resolveFeedPath(makeGroup({ formats: ["atom"] }), "atom")).toBe(
			"blog.xml",
		);
	});

	test("generates .json for json format", () => {
		expect(resolveFeedPath(makeGroup(), "json")).toBe("blog.json");
	});

	test("includes outDir prefix", () => {
		expect(resolveFeedPath(makeGroup({ outDir: "feed" }), "rss")).toBe(
			"feed/blog.xml",
		);
	});

	test("uses custom extension when provided", () => {
		expect(resolveFeedPath(makeGroup({ extension: ".rss" }), "rss")).toBe(
			"blog.rss",
		);
	});

	test("custom extension with outDir prefix", () => {
		expect(
			resolveFeedPath(makeGroup({ outDir: "feed", extension: ".rss" }), "rss"),
		).toBe("feed/blog.rss");
	});

	test("custom extension overrides atom format", () => {
		expect(
			resolveFeedPath(
				makeGroup({ formats: ["rss", "atom"], extension: ".feed" }),
				"atom",
			),
		).toBe("blog.feed");
	});
});

describe("serializeRss", () => {
	test("produces valid RSS 2.0 XML structure", () => {
		const xml = serializeRss(makeGroup(), [makeItem()], "https://example.com");
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<rss version="2.0"');
		expect(xml).toContain("<channel>");
		expect(xml).toContain("<title>My Blog</title>");
		expect(xml).toContain("<link>https://example.com</link>");
		expect(xml).toContain("<description>A test blog</description>");
		expect(xml).toContain("</channel>");
		expect(xml).toContain("</rss>");
	});

	test("includes lastBuildDate", () => {
		const xml = serializeRss(makeGroup(), [], "https://example.com");
		expect(xml).toContain("<lastBuildDate>");
	});

	test("includes content:encoded namespace", () => {
		const xml = serializeRss(makeGroup(), [], "https://example.com");
		expect(xml).toContain("xmlns:content=");
	});

	test("includes atom namespace when selfLink is true", () => {
		const xml = serializeRss(makeGroup(), [], "https://example.com");
		expect(xml).toContain("xmlns:atom=");
		expect(xml).toContain('rel="self"');
	});

	test("omits atom:link when selfLink is false", () => {
		const xml = serializeRss(
			makeGroup({ selfLink: false }),
			[],
			"https://example.com",
		);
		expect(xml).not.toContain('rel="self"');
	});

	test("serializes items with title, link, guid", () => {
		const xml = serializeRss(
			makeGroup(),
			[makeItem({ title: "Hello World", link: "https://example.com/hello" })],
			"https://example.com",
		);
		expect(xml).toContain("<item>");
		expect(xml).toContain("<title>Hello World</title>");
		expect(xml).toContain("<link>https://example.com/hello</link>");
		expect(xml).toContain("</item>");
	});

	test("wraps description in CDATA", () => {
		const xml = serializeRss(
			makeGroup(),
			[makeItem({ description: "<p>Summary</p>" })],
			"https://example.com",
		);
		expect(xml).toContain(
			"<description><![CDATA[<p>Summary</p>]]></description>",
		);
	});

	test("wraps content:encoded in CDATA", () => {
		const xml = serializeRss(
			makeGroup(),
			[makeItem({ content: "<h1>Full content</h1>" })],
			"https://example.com",
		);
		expect(xml).toContain(
			"<content:encoded><![CDATA[<h1>Full content</h1>]]></content:encoded>",
		);
	});

	test("includes pubDate when set", () => {
		const xml = serializeRss(
			makeGroup(),
			[makeItem({ pubDate: new Date("2026-01-01T00:00:00.000Z") })],
			"https://example.com",
		);
		expect(xml).toContain("<pubDate>");
		expect(xml).toContain("2026");
	});

	test("includes categories", () => {
		const xml = serializeRss(
			makeGroup(),
			[makeItem({ categories: ["tech", "tutorial"] })],
			"https://example.com",
		);
		expect(xml).toContain("<category>tech</category>");
		expect(xml).toContain("<category>tutorial</category>");
	});

	test("includes enclosure", () => {
		const xml = serializeRss(
			makeGroup(),
			[
				makeItem({
					enclosure: {
						url: "https://example.com/audio.mp3",
						length: 12345,
						type: "audio/mpeg",
					},
				}),
			],
			"https://example.com",
		);
		expect(xml).toContain("<enclosure");
		expect(xml).toContain('url="https://example.com/audio.mp3"');
		expect(xml).toContain('length="12345"');
		expect(xml).toContain('type="audio/mpeg"');
	});

	test("includes custom string fields", () => {
		const xml = serializeRss(
			makeGroup(),
			[makeItem({ customFields: { "dc:creator": "Author Name" } })],
			"https://example.com",
		);
		expect(xml).toContain("<dc:creator>Author Name</dc:creator>");
	});

	test("includes custom object fields as self-closing with attributes", () => {
		const xml = serializeRss(
			makeGroup(),
			[
				makeItem({
					customFields: {
						"media:content": {
							url: "https://example.com/img.jpg",
							medium: "image",
						},
					},
				}),
			],
			"https://example.com",
		);
		expect(xml).toContain("<media:content");
		expect(xml).toContain('url="https://example.com/img.jpg"');
		expect(xml).toContain('medium="image"');
	});

	test("includes stylesheet processing instruction", () => {
		const xml = serializeRss(
			makeGroup({ stylesheet: "/feed.xsl" }),
			[],
			"https://example.com",
		);
		expect(xml).toContain(
			'<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>',
		);
	});

	test("includes channel-level metadata", () => {
		const xml = serializeRss(
			makeGroup({
				language: "en",
				copyright: "2026 Test",
				ttl: 60,
				managingEditor: "editor@example.com",
				webMaster: "webmaster@example.com",
			}),
			[],
			"https://example.com",
		);
		expect(xml).toContain("<language>en</language>");
		expect(xml).toContain("<copyright>2026 Test</copyright>");
		expect(xml).toContain("<ttl>60</ttl>");
		expect(xml).toContain(
			"<managingEditor>editor@example.com</managingEditor>",
		);
		expect(xml).toContain("<webMaster>webmaster@example.com</webMaster>");
	});

	test("includes skipHours and skipDays", () => {
		const xml = serializeRss(
			makeGroup({
				skipHours: [0, 1, 2],
				skipDays: ["Saturday", "Sunday"],
			}),
			[],
			"https://example.com",
		);
		expect(xml).toContain("<skipHours>");
		expect(xml).toContain("<hour>0</hour>");
		expect(xml).toContain("<skipDays>");
		expect(xml).toContain("<day>Saturday</day>");
	});

	test("includes hub link", () => {
		const xml = serializeRss(
			makeGroup({ hub: "https://hub.example.com" }),
			[],
			"https://example.com",
		);
		expect(xml).toContain('href="https://hub.example.com"');
		expect(xml).toContain('rel="hub"');
	});
});

describe("serializeAtom", () => {
	test("produces valid Atom 1.0 XML structure", () => {
		const xml = serializeAtom(makeGroup(), [makeItem()], "https://example.com");
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
		expect(xml).toContain("<title>My Blog</title>");
		expect(xml).toContain("<subtitle>A test blog</subtitle>");
		expect(xml).toContain("</feed>");
	});

	test("includes self link", () => {
		const xml = serializeAtom(makeGroup(), [], "https://example.com");
		expect(xml).toContain('rel="self"');
		expect(xml).toContain('type="application/atom+xml"');
	});

	test("serializes entries with title, link, id", () => {
		const xml = serializeAtom(
			makeGroup(),
			[makeItem({ title: "Hello World" })],
			"https://example.com",
		);
		expect(xml).toContain("<entry>");
		expect(xml).toContain("<title>Hello World</title>");
		expect(xml).toContain('rel="alternate"');
		expect(xml).toContain("<id>");
		expect(xml).toContain("</entry>");
	});

	test("includes summary and content with CDATA", () => {
		const xml = serializeAtom(
			makeGroup(),
			[makeItem({ description: "<p>Summary</p>", content: "<p>Full</p>" })],
			"https://example.com",
		);
		expect(xml).toContain('<summary type="html">');
		expect(xml).toContain('<content type="html">');
	});

	test("includes author", () => {
		const xml = serializeAtom(
			makeGroup(),
			[makeItem({ author: "John Doe" })],
			"https://example.com",
		);
		expect(xml).toContain("<author>");
		expect(xml).toContain("<name>John Doe</name>");
		expect(xml).toContain("</author>");
	});

	test("includes categories", () => {
		const xml = serializeAtom(
			makeGroup(),
			[makeItem({ categories: ["tech"] })],
			"https://example.com",
		);
		expect(xml).toContain('<category term="tech"/>');
	});
});

describe("serializeJsonFeed", () => {
	test("produces valid JSON Feed 1.1 structure", () => {
		const json = serializeJsonFeed(
			makeGroup(),
			[makeItem()],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
		expect(feed.title).toBe("My Blog");
		expect(feed.home_page_url).toBe("https://example.com");
		expect(feed.description).toBe("A test blog");
		expect(feed.items).toHaveLength(1);
	});

	test("includes feed_url when selfLink is true", () => {
		const json = serializeJsonFeed(makeGroup(), [], "https://example.com");
		const feed = JSON.parse(json);
		expect(feed.feed_url).toBe("https://example.com/blog.json");
	});

	test("omits feed_url when selfLink is false", () => {
		const json = serializeJsonFeed(
			makeGroup({ selfLink: false }),
			[],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		expect(feed.feed_url).toBeUndefined();
	});

	test("serializes items with required fields", () => {
		const json = serializeJsonFeed(
			makeGroup(),
			[
				makeItem({
					title: "Test",
					guid: "guid-1",
					link: "https://example.com/test",
				}),
			],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		const item = feed.items[0];
		expect(item.id).toBe("guid-1");
		expect(item.url).toBe("https://example.com/test");
		expect(item.title).toBe("Test");
	});

	test("includes content_html and summary", () => {
		const json = serializeJsonFeed(
			makeGroup(),
			[makeItem({ content: "<p>Full</p>", description: "Summary" })],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		expect(feed.items[0].content_html).toBe("<p>Full</p>");
		expect(feed.items[0].summary).toBe("Summary");
	});

	test("includes authors array", () => {
		const json = serializeJsonFeed(
			makeGroup(),
			[makeItem({ author: "Jane" })],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		expect(feed.items[0].authors).toEqual([{ name: "Jane" }]);
	});

	test("includes tags", () => {
		const json = serializeJsonFeed(
			makeGroup(),
			[makeItem({ categories: ["a", "b"] })],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		expect(feed.items[0].tags).toEqual(["a", "b"]);
	});

	test("includes attachments for enclosure", () => {
		const json = serializeJsonFeed(
			makeGroup(),
			[
				makeItem({
					enclosure: {
						url: "https://example.com/audio.mp3",
						length: 1000,
						type: "audio/mpeg",
					},
				}),
			],
			"https://example.com",
		);
		const feed = JSON.parse(json);
		expect(feed.items[0].attachments).toEqual([
			{
				url: "https://example.com/audio.mp3",
				mime_type: "audio/mpeg",
				size_in_bytes: 1000,
			},
		]);
	});

	test("pretty prints when prettyXml is true", () => {
		const json = serializeJsonFeed(
			makeGroup({ prettyXml: true }),
			[makeItem()],
			"https://example.com",
		);
		expect(json).toContain("\n");
		expect(json).toContain("  ");
	});
});
