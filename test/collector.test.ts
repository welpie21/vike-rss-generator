import { describe, expect, test } from "bun:test";
import { collectPages, matchRoute } from "../src/collector.ts";

function makeVikeConfig(pages: Record<string, any>, prerendered?: any[]) {
	return {
		pages,
		config: {},
		prerenderContext: prerendered
			? {
					pageContexts: prerendered,
					isPrerenderingEnabled: true,
					isPrerenderingEnabledForAllPages: true,
				}
			: null,
		dangerouslyUseInternals: {} as any,
	} as any;
}

describe("matchRoute", () => {
	test("matches exact routes", () => {
		expect(matchRoute("/blog", "/blog")).toEqual({});
	});

	test("returns null for non-matching routes", () => {
		expect(matchRoute("/blog", "/about")).toBeNull();
	});

	test("extracts route params", () => {
		expect(matchRoute("/blog/hello-world", "/blog/@slug")).toEqual({
			slug: "hello-world",
		});
	});

	test("extracts multiple route params", () => {
		expect(matchRoute("/blog/2026/hello", "/blog/@year/@slug")).toEqual({
			year: "2026",
			slug: "hello",
		});
	});

	test("returns null for different segment count", () => {
		expect(matchRoute("/blog", "/blog/@slug")).toBeNull();
	});
});

describe("collectPages", () => {
	test("collects pages with rss config (SSR mode)", () => {
		const vikeConfig = makeVikeConfig({
			page1: {
				isErrorPage: false,
				route: "/blog",
				config: { rss: { group: "blog", title: "My Post" } },
			},
		});

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(1);
		expect(pages[0]!.url).toBe("/blog");
		expect(pages[0]!.pageConfig).toEqual({ group: "blog", title: "My Post" });
	});

	test("skips pages without rss config", () => {
		const vikeConfig = makeVikeConfig({
			page1: {
				isErrorPage: false,
				route: "/about",
				config: {},
			},
		});

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(0);
	});

	test("skips error pages", () => {
		const vikeConfig = makeVikeConfig({
			page1: {
				isErrorPage: true,
				route: "/_error",
				config: { rss: { group: "blog", title: "Error" } },
			},
		});

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(0);
	});

	test("skips parameterized routes in SSR mode", () => {
		const vikeConfig = makeVikeConfig({
			page1: {
				isErrorPage: false,
				route: "/blog/@slug",
				config: { rss: { group: "blog", title: "Post" } },
			},
		});

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(0);
	});

	test("uses prerenderContext when available (SSG mode)", () => {
		const vikeConfig = makeVikeConfig(
			{
				page1: {
					isErrorPage: false,
					route: "/blog/@slug",
					config: { rss: { group: "blog", title: "Post" } },
				},
			},
			[
				{ urlOriginal: "/blog/hello-world", data: { title: "Hello World" } },
				{ urlOriginal: "/blog/second-post", data: { title: "Second Post" } },
			],
		);

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(2);
		expect(pages[0]!.url).toBe("/blog/hello-world");
		expect(pages[0]!.routeParams).toEqual({ slug: "hello-world" });
		expect(pages[0]!.data).toEqual({ title: "Hello World" });
	});

	test("skips prerendered pages without matching rss config", () => {
		const vikeConfig = makeVikeConfig(
			{
				page1: {
					isErrorPage: false,
					route: "/blog/@slug",
					config: {},
				},
			},
			[{ urlOriginal: "/blog/hello-world", data: {} }],
		);

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(0);
	});

	test("collects non-prerendered static routes alongside prerendered pages", () => {
		const vikeConfig = makeVikeConfig(
			{
				page1: {
					isErrorPage: false,
					route: "/blog/@slug",
					config: { rss: { group: "blog", title: "Post" } },
				},
				page2: {
					isErrorPage: false,
					route: "/releases",
					config: { rss: { group: "releases", title: "Releases" } },
				},
			},
			[{ urlOriginal: "/blog/hello-world", data: { title: "Hello" } }],
		);

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(2);
		expect(pages[0]!.url).toBe("/blog/hello-world");
		expect(pages[1]!.url).toBe("/releases");
	});

	test("does not duplicate pages already collected from prerenderContext", () => {
		const vikeConfig = makeVikeConfig(
			{
				page1: {
					isErrorPage: false,
					route: "/about",
					config: { rss: { group: "blog", title: "About" } },
				},
			},
			[{ urlOriginal: "/about", data: { info: "About page" } }],
		);

		const pages = collectPages(vikeConfig);
		expect(pages).toHaveLength(1);
		expect(pages[0]!.data).toEqual({ info: "About page" });
	});
});
