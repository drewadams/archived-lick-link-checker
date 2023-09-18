#! /usr/bin/env node

import LinkChecker, { type CheckerOptions } from "./lib/checker.js";

import yargs from "yargs";

/**
 * TODO: Add CSV export functionality
 * TODO: Check external links
 * TODO: Move to lib to a class
 */

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
					default: "./lick-report.json",
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
			await checker.writeResultsToFile();
		}
	)
	.help().argv;
