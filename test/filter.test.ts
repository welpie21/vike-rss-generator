import { describe, expect, test } from "bun:test";
import { filterPages } from "../src/filter.ts";
import type { CollectedRssPage } from "../src/types.ts";

function makePage(url: string): CollectedRssPage {
	return {
		url,
		pageConfig: { group: "blog", title: `Page ${url}` },
	};
}

describe("filterPages", () => {
	const pages = [
		makePage("/blog/post-1"),
		makePage("/blog/post-2"),
		makePage("/about"),
		makePage("/admin/settings"),
	];

	test("returns all pages when no include/exclude", () => {
		const result = filterPages(pages, [], []);
		expect(result).toHaveLength(4);
	});

	test("filters by include with exact string", () => {
		const result = filterPages(pages, ["/blog/post-1", "/about"], []);
		expect(result).toHaveLength(2);
		expect(result.map((p) => p.url)).toEqual(["/blog/post-1", "/about"]);
	});

	test("filters by include with regex", () => {
		const result = filterPages(pages, [/^\/blog\//], []);
		expect(result).toHaveLength(2);
		expect(result.map((p) => p.url)).toEqual(["/blog/post-1", "/blog/post-2"]);
	});

	test("filters by exclude with exact string", () => {
		const result = filterPages(pages, [], ["/admin/settings"]);
		expect(result).toHaveLength(3);
		expect(result.map((p) => p.url)).not.toContain("/admin/settings");
	});

	test("filters by exclude with regex", () => {
		const result = filterPages(pages, [], [/^\/admin/]);
		expect(result).toHaveLength(3);
	});

	test("combines include and exclude", () => {
		const result = filterPages(pages, [/^\/blog\//], ["/blog/post-2"]);
		expect(result).toHaveLength(1);
		expect(result[0]!.url).toBe("/blog/post-1");
	});

	test("returns empty when include matches nothing", () => {
		const result = filterPages(pages, ["/nonexistent"], []);
		expect(result).toHaveLength(0);
	});
});
