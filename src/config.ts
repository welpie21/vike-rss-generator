import type { Config } from "vike/types";
import type { RssPageConfig, RssPageConfigFn } from "./types.ts";

export default {
	name: "vike-rss-generator",
	meta: {
		rss: {
			env: { config: true, server: true, client: false },
		},
	},
} satisfies Config;

declare global {
	namespace Vike {
		interface Config {
			rss?: RssPageConfig | RssPageConfigFn;
		}
	}
}
