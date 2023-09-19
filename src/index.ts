#! /usr/bin/env node

import LinkChecker, { type CheckerOptions } from "./lib/checker.js";

import yargs from "yargs";

/**
 * TODO: Add CSV export functionality
 * TODO: Check external links
 */

yargs(process.argv.slice(2))
	.scriptName("lick")
	.usage("$0 <siteUrl> [options]")
	.command(
		"$0 <siteUrl> [options?]",
		"Fetch contents of url, and check all internal links inside of it.",
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
					default: "./lick-report",
				})
				.option("slow", {
					alias: "s",
					type: "boolean",
					description: "Increases fetch timeout.",
					default: false,
				})
				.option("csv", {
					type: "boolean",
					description: "Exports report to a CSV file instead of JSON.",
					default: false,
				})
				.option("verbose", {
					alias: "v",
					type: "boolean",
					description: "Adds a result table to console log.",
					default: false,
				});
		},
		async function (argv) {
			const { $0, _, siteUrl, ...options } = argv;

			const checker = new LinkChecker(siteUrl, options as CheckerOptions);
			await checker.runCheck();
			console.log("Check completed.");
			await checker.writeResultsToFile();
		}
	)
	.help().argv;
