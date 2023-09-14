#! /usr/bin/env node

import { PathLike } from "fs";
import checkLinks from "./lib/functions.js";
import yargs from "yargs";

try {
	yargs(process.argv.slice(2))
		.scriptName("lick")
		.usage("$0 check <site-url> --depth [num?] --path [string?]")
		.command(
			"check <site-url>",
			"Fetch contents of url, and check all links inside of it.",
			(yargs) => {
				return yargs.positional("site-url", {
					type: "string",
					describe: "the url of the website",
				});
			},
			async function (argv) {
				const depth = argv.depth ?? 0;
				const path = argv.path ?? "./report.json";
				await checkLinks(
					argv["site-url"] as string,
					depth as number,
					path as PathLike
				);
			}
		)
		.option("depth", {
			alias: "d",
			type: "number",
			description: "Depth the checker goes to.",
		})
		.option("path", {
			alias: "p",
			type: "string",
			description: "Path to the output file.",
		})
		.help().argv;
} catch (err) {
	if (err instanceof Error) {
		console.error(err.message);
	}
}
