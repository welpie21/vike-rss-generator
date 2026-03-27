import { describe, expect, test } from "bun:test";
import { vikeRss } from "../src/plugin.ts";

describe("vikeRss plugin", () => {
	const plugin = vikeRss({
		baseUrl: "https://example.com",
		groups: [
			{
				id: "blog",
				title: "Blog",
				description: "Blog feed",
			},
		],
	});

	test("has the correct name", () => {
		expect(plugin.name).toBe("vike-rss-generator");
	});

	test("applies only during build", () => {
		expect(plugin.apply).toBe("build");
	});

	test("has configResolved hook", () => {
		expect(plugin.configResolved).toBeDefined();
		expect(typeof plugin.configResolved).toBe("function");
	});

	test("has closeBundle hook", () => {
		expect(plugin.closeBundle).toBeDefined();
		expect(typeof plugin.closeBundle).toBe("function");
	});

	test("accepts multiple groups", () => {
		const p = vikeRss({
			baseUrl: "https://example.com",
			groups: [
				{ id: "blog", title: "Blog", description: "Blog feed" },
				{ id: "changelog", title: "Changelog", description: "Changelog feed" },
			],
		});
		expect(p.name).toBe("vike-rss-generator");
	});

	test("accepts all format options", () => {
		const p = vikeRss({
			baseUrl: "https://example.com",
			groups: [
				{
					id: "blog",
					title: "Blog",
					description: "Feed",
					format: ["rss", "atom", "json"],
				},
			],
		});
		expect(p.name).toBe("vike-rss-generator");
	});

	test("accepts dryRun option", () => {
		const p = vikeRss({
			baseUrl: "https://example.com",
			groups: [{ id: "blog", title: "Blog", description: "Feed" }],
			dryRun: true,
		});
		expect(p.name).toBe("vike-rss-generator");
	});
});
