import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../src/resolveConfig.ts";
import type { RssPluginOptions } from "../src/types.ts";

function makeOptions(
	overrides: Partial<RssPluginOptions> = {},
): RssPluginOptions {
	return {
		baseUrl: "https://example.com",
		groups: [
			{
				id: "blog",
				title: "Blog",
				description: "Blog feed",
			},
		],
		...overrides,
	};
}

describe("resolveConfig", () => {
	test("strips trailing slashes from baseUrl", () => {
		const config = resolveConfig(
			makeOptions({ baseUrl: "https://example.com///" }),
		);
		expect(config.baseUrl).toBe("https://example.com");
	});

	test("applies default concurrency of 10", () => {
		const config = resolveConfig(makeOptions());
		expect(config.concurrency).toBe(10);
	});

	test("applies default dryRun false", () => {
		const config = resolveConfig(makeOptions());
		expect(config.dryRun).toBe(false);
	});

	test("applies default empty include/exclude arrays", () => {
		const config = resolveConfig(makeOptions());
		expect(config.include).toEqual([]);
		expect(config.exclude).toEqual([]);
	});

	test("preserves custom concurrency", () => {
		const config = resolveConfig(makeOptions({ concurrency: 5 }));
		expect(config.concurrency).toBe(5);
	});

	test("preserves defaultGroup", () => {
		const config = resolveConfig(makeOptions({ defaultGroup: "blog" }));
		expect(config.defaultGroup).toBe("blog");
	});

	describe("group defaults", () => {
		test("name defaults to id", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.name).toBe("blog");
		});

		test("format defaults to rss", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.formats).toEqual(["rss"]);
		});

		test("normalizes single format to array", () => {
			const config = resolveConfig(
				makeOptions({
					groups: [
						{ id: "blog", title: "Blog", description: "Feed", format: "atom" },
					],
				}),
			);
			expect(config.groups[0]!.formats).toEqual(["atom"]);
		});

		test("preserves format array", () => {
			const config = resolveConfig(
				makeOptions({
					groups: [
						{
							id: "blog",
							title: "Blog",
							description: "Feed",
							format: ["rss", "atom", "json"],
						},
					],
				}),
			);
			expect(config.groups[0]!.formats).toEqual(["rss", "atom", "json"]);
		});

		test("selfLink defaults to true", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.selfLink).toBe(true);
		});

		test("sortBy defaults to pubDate", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.sortBy).toBe("pubDate");
		});

		test("sortOrder defaults to desc", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.sortOrder).toBe("desc");
		});

		test("prettyXml defaults to false", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.prettyXml).toBe(false);
		});

		test("namespaces defaults to empty object", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.namespaces).toEqual({});
		});

		test("link defaults to baseUrl", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.link).toBe("https://example.com");
		});

		test("normalizes single category to array", () => {
			const config = resolveConfig(
				makeOptions({
					groups: [
						{
							id: "blog",
							title: "Blog",
							description: "Feed",
							category: "tech",
						},
					],
				}),
			);
			expect(config.groups[0]!.category).toEqual(["tech"]);
		});

		test("preserves category array", () => {
			const config = resolveConfig(
				makeOptions({
					groups: [
						{
							id: "blog",
							title: "Blog",
							description: "Feed",
							category: ["tech", "code"],
						},
					],
				}),
			);
			expect(config.groups[0]!.category).toEqual(["tech", "code"]);
		});

		test("extension defaults to undefined", () => {
			const config = resolveConfig(makeOptions());
			expect(config.groups[0]!.extension).toBeUndefined();
		});

		test("preserves custom extension", () => {
			const config = resolveConfig(
				makeOptions({
					groups: [
						{
							id: "blog",
							title: "Blog",
							description: "Feed",
							extension: ".rss",
						},
					],
				}),
			);
			expect(config.groups[0]!.extension).toBe(".rss");
		});
	});
});
