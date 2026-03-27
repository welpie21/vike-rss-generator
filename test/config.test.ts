import { describe, expect, test } from "bun:test";
import config from "../src/config.ts";

describe("Vike extension config", () => {
	test("has the correct name", () => {
		expect(config.name).toBe("vike-rss-generator");
	});

	test("registers rss meta key", () => {
		expect(config.meta).toBeDefined();
		expect(config.meta.rss).toBeDefined();
	});

	test("rss meta has config and server env", () => {
		expect(config.meta.rss.env).toEqual({
			config: true,
			server: true,
			client: false,
		});
	});
});
