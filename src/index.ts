#! /usr/bin/env node

import checkLinks from "./lib/lib.js";
import yargs from "yargs";

/**
 * TODO: Add CSV export functionality
 */

try {
	yargs(process.argv.slice(2))
		.scriptName("lick")
		.usage("$0 <siteUrl> [options]")
		.command(
			"$0 <siteUrl> [options?]",
			"Fetch contents of url, and check all links inside of it.",
			(yargs) => {
				return yargs
					.positional("siteUrl", {
						type: "string",
						describe: "the url of the website",
						demandOption: true,
					})
					.option("depth", {
						alias: "d",
						type: "number",
						description: "Depth the checker goes to.",
						default: 0,
					})
					.option("path", {
						alias: "p",
						type: "string",
						description: "Path to the output file.",
						default: "./report.json",
					})
					.option("verbose", {
						alias: "v",
						type: "boolean",
						description: "Adds a result table to console log.",
						default: true,
					});
			},
			async function (argv) {
				const { siteUrl, depth, path, verbose } = argv;
				await checkLinks(siteUrl, depth, path, verbose);
			}
		)
		.help().argv;
} catch (err) {
	if (err instanceof Error) {
		console.error(err.message);
	}
}
