import type { getVikeConfig } from "vike/plugin";
import type {
	CollectedRssPage,
	RssPageConfig,
	RssPageConfigFn,
} from "./types.ts";

type VikeConfig = ReturnType<typeof getVikeConfig>;

interface RouteEntry {
	route: string;
	pageConfig: RssPageConfig | RssPageConfigFn | undefined;
}

/**
 * Collects pages that have +rss.ts config from Vike's build output.
 *
 * 1. Prerendered pages are collected via prerenderContext with fully resolved
 *    URLs, route params, and page data.
 * 2. Non-prerendered static routes (no `@` params) with RSS config are also
 *    collected so SSR-only pages can participate in feeds.
 */
export function collectPages(vikeConfig: VikeConfig): CollectedRssPage[] {
	const pages: CollectedRssPage[] = [];
	const collectedUrls = new Set<string>();

	const prerendered = vikeConfig.prerenderContext?.pageContexts;
	if (prerendered && prerendered.length > 0) {
		const routeEntries = buildRouteEntries(vikeConfig);
		for (const ctx of prerendered) {
			const url = normalizeUrlPath(ctx.urlOriginal);
			const match = findMatchingRoute(url, routeEntries);
			if (match?.pageConfig) {
				pages.push({
					url,
					pageConfig: match.pageConfig,
					routeParams: match.routeParams,
					data: (ctx as Record<string, unknown>).data,
				});
				collectedUrls.add(url);
			}
		}
	}

	for (const page of Object.values(vikeConfig.pages)) {
		if (page.isErrorPage) continue;
		const route = page.route;
		if (typeof route === "string" && !route.includes("@")) {
			const url = normalizeUrlPath(route);
			if (collectedUrls.has(url)) continue;
			const pageConfig = (page.config as Record<string, unknown>).rss as
				| RssPageConfig
				| RssPageConfigFn
				| undefined;
			if (pageConfig) {
				pages.push({ url, pageConfig });
			}
		}
	}

	return pages;
}

function buildRouteEntries(vikeConfig: VikeConfig): RouteEntry[] {
	const entries: RouteEntry[] = [];
	for (const page of Object.values(vikeConfig.pages)) {
		if (page.isErrorPage) continue;
		const route = page.route;
		if (typeof route === "string") {
			const pageConfig = (page.config as Record<string, unknown>).rss as
				| RssPageConfig
				| RssPageConfigFn
				| undefined;
			entries.push({ route: normalizeUrlPath(route), pageConfig });
		}
	}
	return entries;
}

function findMatchingRoute(
	url: string,
	entries: RouteEntry[],
):
	| {
			pageConfig: RouteEntry["pageConfig"];
			routeParams: Record<string, string>;
	  }
	| undefined {
	for (const entry of entries) {
		const params = matchRoute(url, entry.route);
		if (params !== null) {
			return { pageConfig: entry.pageConfig, routeParams: params };
		}
	}
	return undefined;
}

export function matchRoute(
	url: string,
	pattern: string,
): Record<string, string> | null {
	const urlParts = url.split("/").filter(Boolean);
	const patternParts = pattern.split("/").filter(Boolean);
	if (urlParts.length !== patternParts.length) return null;
	const params: Record<string, string> = {};
	for (let i = 0; i < patternParts.length; i++) {
		const patternPart = patternParts[i];
		const urlPart = urlParts[i];
		if (!patternPart || !urlPart) return null;
		if (patternPart.startsWith("@")) {
			params[patternPart.slice(1)] = urlPart;
		} else if (patternPart !== urlPart) {
			return null;
		}
	}
	return params;
}

function normalizeUrlPath(url: string): string {
	const path = url.split("?")[0]?.split("#")[0];
	if (!path) {
		throw new Error(`Invalid URL: ${url}`);
	}
	return path.startsWith("/") ? path : `/${path}`;
}
