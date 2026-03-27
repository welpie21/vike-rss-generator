import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { FeedFormat, ResolvedGroupConfig } from "./types.ts";

/**
 * Resolves the output file path for a feed based on its group config,
 * format, and the build output directory.
 */
export function resolveOutputPath(
	group: ResolvedGroupConfig,
	format: FeedFormat,
	buildOutDir: string,
): string {
	const base = group.outDir ? resolve(buildOutDir, group.outDir) : buildOutDir;

	const filename = resolveFilename(group, format);
	return resolve(base, filename);
}

function resolveFilename(
	group: ResolvedGroupConfig,
	format: FeedFormat,
): string {
	const name = group.name;

	if (group.extension) {
		return `${name}${group.extension}`;
	}

	switch (format) {
		case "rss":
			return `${name}.xml`;
		case "atom": {
			const hasRss = group.formats.includes("rss");
			return hasRss ? `${name}.atom.xml` : `${name}.xml`;
		}
		case "json":
			return `${name}.json`;
	}
}

/**
 * Writes feed content to disk, creating parent directories as needed.
 */
export async function writeFeed(
	content: string,
	outputPath: string,
): Promise<string> {
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, content, "utf-8");
	return outputPath;
}
