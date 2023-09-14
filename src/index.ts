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

// yargs(process.argv.slice(2))
// 	.scriptName("lick")
// 	.usage("$0 <cmd> [args]")
// 	.command(
// 		"hello [name]",
// 		"welcome ter yargs!",
// 		(yargs) => {
// 			yargs.positional("name", {
// 				type: "string",
// 				default: "Cambi",
// 				describe: "the name to say hello to",
// 			});
// 		},
// 		(argv) => {
// 			console.log("hello", argv.name, "welcome to yargs!");
// 		}
// 	)
// 	.help().argv;

// yargs(hideBin(process.argv))
// 	.scriptName("lick")
// 	.usage("$0 <url> [options]")
// 	.command(
// 		"$0 <site-url>",
// 		"Checks the input urls links",
// 		(yargs) => {
// 			yargs
// 				.positional("site-url", {
// 					type: "string",
// 					// default: "Cambi",
// 					describe: "the site to check",
// 				})
// 				.check((argv) => {
// 					if (argv["site-url"]!.includes("http")) {
// 						return true;
// 					}
// 					throw new Error(`No valid URL found. ${argv["site-url"]}`);
// 				})
// 				.options({
// 					d: {
// 						type: "number",
// 						description: "How many levels into the site to check",
// 						default: 0,
// 						alias: "depth",
// 					},
// 					p: {
// 						type: "string",
// 						description: "Path to write results to",
// 						default: "./results.json",
// 						alias: "path",
// 					},
// 				});
// 		},
// 		(argv) => {
// 			checkLinks(
// 				argv["site-url"] as string,
// 				argv.d as number,
// 				argv.p as PathLike
// 			);
// 		}
// 	)
// 	.help().argv;
