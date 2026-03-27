import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { ResolvedGroupConfig, RssFeedItem } from "../src/types.ts";
import { validateFeed } from "../src/validator.ts";

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
		link: "https://example.com/post",
		title: "Post",
		guid: "https://example.com/post",
		...overrides,
	};
}

describe("validateFeed", () => {
	let warnMessages: string[];
	const originalWarn = console.warn;

	beforeEach(() => {
		warnMessages = [];
		console.warn = (...args: any[]) => {
			warnMessages.push(args.join(" "));
		};
	});

	afterEach(() => {
		console.warn = originalWarn;
	});

	describe("RSS validation", () => {
		test("no warnings for valid feed", () => {
			validateFeed(makeGroup(), [makeItem()], "rss");
			expect(warnMessages).toHaveLength(0);
		});

		test("warns when title is missing", () => {
			validateFeed(makeGroup({ title: "" }), [], "rss");
			expect(warnMessages.some((m) => m.includes("title"))).toBe(true);
		});

		test("warns when item has neither title nor description", () => {
			validateFeed(
				makeGroup(),
				[makeItem({ title: "", description: undefined })],
				"rss",
			);
			expect(
				warnMessages.some(
					(m) => m.includes("title") && m.includes("description"),
				),
			).toBe(true);
		});

		test("no warning when item has description but no title", () => {
			validateFeed(
				makeGroup(),
				[makeItem({ title: "", description: "Has description" })],
				"rss",
			);
			expect(warnMessages).toHaveLength(0);
		});
	});

	describe("Atom validation", () => {
		test("no warnings for valid feed", () => {
			validateFeed(makeGroup(), [makeItem({ pubDate: new Date() })], "atom");
			expect(warnMessages).toHaveLength(0);
		});

		test("warns when entry is missing title", () => {
			validateFeed(makeGroup(), [makeItem({ title: "" })], "atom");
			expect(warnMessages.some((m) => m.includes("title"))).toBe(true);
		});

		test("warns when entry is missing pubDate (updated)", () => {
			validateFeed(makeGroup(), [makeItem()], "atom");
			expect(warnMessages.some((m) => m.includes("updated"))).toBe(true);
		});
	});

	describe("JSON Feed validation", () => {
		test("no warnings for valid feed", () => {
			validateFeed(makeGroup(), [makeItem()], "json");
			expect(warnMessages).toHaveLength(0);
		});

		test("warns when title is missing", () => {
			validateFeed(makeGroup({ title: "" }), [], "json");
			expect(warnMessages.some((m) => m.includes("title"))).toBe(true);
		});

		test("warns when item is missing id", () => {
			validateFeed(makeGroup(), [makeItem({ guid: "" })], "json");
			expect(warnMessages.some((m) => m.includes("id"))).toBe(true);
		});
	});
});
