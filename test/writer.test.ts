import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ResolvedGroupConfig } from "../src/types.ts";
import { resolveOutputPath, writeFeed } from "../src/writer.ts";

function makeGroup(
	overrides: Partial<ResolvedGroupConfig> = {},
): ResolvedGroupConfig {
	return {
		id: "blog",
		name: "blog",
		outDir: undefined,
		formats: ["rss"],
		title: "Blog",
		description: "Feed",
		link: "https://example.com",
		selfLink: true,
		sortBy: "pubDate",
		sortOrder: "desc",
		prettyXml: false,
		namespaces: {},
		...overrides,
	};
}

describe("resolveOutputPath", () => {
	test("resolves .xml for rss format", () => {
		const path = resolveOutputPath(makeGroup(), "rss", "/build/client");
		expect(path).toContain("blog.xml");
		expect(path).toContain("/build/client");
	});

	test("resolves .atom.xml when rss also present", () => {
		const path = resolveOutputPath(
			makeGroup({ formats: ["rss", "atom"] }),
			"atom",
			"/build/client",
		);
		expect(path).toContain("blog.atom.xml");
	});

	test("resolves .xml for atom-only", () => {
		const path = resolveOutputPath(
			makeGroup({ formats: ["atom"] }),
			"atom",
			"/build/client",
		);
		expect(path).toContain("blog.xml");
		expect(path).not.toContain("atom.xml");
	});

	test("resolves .json for json format", () => {
		const path = resolveOutputPath(makeGroup(), "json", "/build/client");
		expect(path).toContain("blog.json");
	});

	test("includes custom outDir", () => {
		const path = resolveOutputPath(
			makeGroup({ outDir: "feed" }),
			"rss",
			"/build/client",
		);
		expect(path).toContain("/build/client/feed/blog.xml");
	});

	test("uses custom extension when provided", () => {
		const path = resolveOutputPath(
			makeGroup({ extension: ".rss" }),
			"rss",
			"/build/client",
		);
		expect(path).toContain("blog.rss");
		expect(path).not.toContain("blog.xml");
	});

	test("custom extension overrides atom format", () => {
		const path = resolveOutputPath(
			makeGroup({ formats: ["atom"], extension: ".feed" }),
			"atom",
			"/build/client",
		);
		expect(path).toContain("blog.feed");
	});

	test("custom extension overrides json format", () => {
		const path = resolveOutputPath(
			makeGroup({ extension: ".rss" }),
			"json",
			"/build/client",
		);
		expect(path).toContain("blog.rss");
	});
});

describe("writeFeed", () => {
	const testDir = join(tmpdir(), `vike-rss-test-${Date.now()}`);

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true });
		}
	});

	test("creates directories and writes content", async () => {
		const outputPath = join(testDir, "feed", "blog.xml");
		const result = await writeFeed("<rss>content</rss>", outputPath);

		expect(result).toBe(outputPath);
		const content = await readFile(outputPath, "utf-8");
		expect(content).toBe("<rss>content</rss>");
	});

	test("writes to nested directory", async () => {
		const outputPath = join(testDir, "deep", "nested", "feed.xml");
		await writeFeed("test", outputPath);

		const content = await readFile(outputPath, "utf-8");
		expect(content).toBe("test");
	});
});
