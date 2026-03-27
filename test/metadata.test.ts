import { describe, expect, test } from "bun:test";
import {
	normalizeDate,
	resolveMetadata,
	toIso8601,
	toRfc2822,
} from "../src/metadata.ts";
import type { CollectedRssPage } from "../src/types.ts";

describe("normalizeDate", () => {
	test("returns undefined for undefined", () => {
		expect(normalizeDate(undefined)).toBeUndefined();
	});

	test("returns Date as-is", () => {
		const d = new Date("2026-01-01");
		expect(normalizeDate(d)).toBe(d);
	});

	test("converts ISO string to Date", () => {
		const d = normalizeDate("2026-01-01T00:00:00.000Z");
		expect(d).toBeInstanceOf(Date);
		expect(d!.toISOString()).toBe("2026-01-01T00:00:00.000Z");
	});

	test("converts Unix timestamp to Date", () => {
		const ts = new Date("2026-06-15").getTime();
		const d = normalizeDate(ts);
		expect(d).toBeInstanceOf(Date);
		expect(d!.getTime()).toBe(ts);
	});
});

describe("toRfc2822", () => {
	test("formats date as RFC 2822", () => {
		const d = new Date("2026-01-01T00:00:00.000Z");
		const result = toRfc2822(d);
		expect(result).toContain("2026");
		expect(result).toContain("Jan");
	});
});

describe("toIso8601", () => {
	test("formats date as ISO 8601", () => {
		const d = new Date("2026-01-01T00:00:00.000Z");
		expect(toIso8601(d)).toBe("2026-01-01T00:00:00.000Z");
	});
});

describe("resolveMetadata", () => {
	test("resolves static config into grouped items", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/blog/post-1",
				pageConfig: { group: "blog", title: "Post 1" },
			},
			{
				url: "/blog/post-2",
				pageConfig: { group: "blog", title: "Post 2" },
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		const items = grouped.get("blog");
		expect(items).toBeDefined();
		expect(items).toHaveLength(2);
		expect(items![0]!.title).toBe("Post 1");
		expect(items![0]!.link).toBe("https://example.com/blog/post-1");
		expect(items![0]!.guid).toBe("https://example.com/blog/post-1");
	});

	test("resolves array config into multiple groups", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/blog/post-1",
				pageConfig: [
					{ group: "blog", title: "Full Post", content: "<p>Content</p>" },
					{ group: "app", title: "Minimal Post" },
				],
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		expect(grouped.get("blog")).toHaveLength(1);
		expect(grouped.get("app")).toHaveLength(1);
		expect(grouped.get("blog")![0]!.content).toBe("<p>Content</p>");
		expect(grouped.get("app")![0]!.content).toBeUndefined();
	});

	test("resolves async config function", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/blog/post-1",
				pageConfig: async (ctx: any) => ({
					group: "blog",
					title: ctx.data.title,
				}),
				data: { title: "Dynamic Title" },
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		const items = grouped.get("blog");
		expect(items).toHaveLength(1);
		expect(items![0]!.title).toBe("Dynamic Title");
	});

	test("uses defaultGroup when page config omits group", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/blog/post-1",
				pageConfig: { title: "Post Without Group" },
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			"blog",
			10,
		);
		expect(grouped.get("blog")).toHaveLength(1);
	});

	test("skips items without group when no defaultGroup", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/blog/post-1",
				pageConfig: { title: "No Group" },
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		expect(grouped.size).toBe(0);
	});

	test("respects concurrency batching", async () => {
		const pages: CollectedRssPage[] = Array.from({ length: 25 }, (_, i) => ({
			url: `/post-${i}`,
			pageConfig: { group: "blog", title: `Post ${i}` },
		}));

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			5,
		);
		expect(grouped.get("blog")).toHaveLength(25);
	});

	test("normalizes pubDate in resolved items", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/post",
				pageConfig: {
					group: "blog",
					title: "Post",
					pubDate: "2026-03-01T00:00:00.000Z",
				},
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		const item = grouped.get("blog")![0]!;
		expect(item.pubDate).toBeInstanceOf(Date);
		expect(item.pubDate!.toISOString()).toBe("2026-03-01T00:00:00.000Z");
	});

	test("preserves custom guid", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/post",
				pageConfig: {
					group: "blog",
					title: "Post",
					guid: "custom-guid-123",
				},
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		expect(grouped.get("blog")![0]!.guid).toBe("custom-guid-123");
	});

	test("uses custom link when provided", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/releases",
				pageConfig: {
					group: "releases",
					title: "v3.0.0",
					link: "https://example.com/releases#v3-0-0",
				},
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		const item = grouped.get("releases")![0]!;
		expect(item.link).toBe("https://example.com/releases#v3-0-0");
		expect(item.guid).toBe("https://example.com/releases#v3-0-0");
	});

	test("auto-derives link when not provided", async () => {
		const pages: CollectedRssPage[] = [
			{
				url: "/blog/post-1",
				pageConfig: { group: "blog", title: "Post 1" },
			},
		];

		const grouped = await resolveMetadata(
			pages,
			"https://example.com",
			undefined,
			10,
		);
		expect(grouped.get("blog")![0]!.link).toBe(
			"https://example.com/blog/post-1",
		);
	});
});
