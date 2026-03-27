import type { CollectedRssPage } from "./types.ts";

/**
 * Filters collected pages using include/exclude patterns.
 *
 * - If `include` is non-empty, only pages matching at least one pattern pass.
 * - Pages matching any `exclude` pattern are removed.
 */
export function filterPages(
	pages: CollectedRssPage[],
	include: (string | RegExp)[],
	exclude: (string | RegExp)[],
): CollectedRssPage[] {
	let result = pages;

	if (include.length > 0) {
		result = result.filter((page) =>
			include.some((pattern) => matchPattern(page.url, pattern)),
		);
	}

	if (exclude.length > 0) {
		result = result.filter(
			(page) => !exclude.some((pattern) => matchPattern(page.url, pattern)),
		);
	}

	return result;
}

function matchPattern(url: string, pattern: string | RegExp): boolean {
	if (pattern instanceof RegExp) {
		return pattern.test(url);
	}
	return url === pattern;
}
