import { PathLike } from "fs";
import chalk from "chalk";
import { writeFile } from "fs/promises";

interface ResultData {
	url: string;
	status: number;
	date: string;
}

export default async function checkLinks(
	siteUrl: string,
	depth = 0,
	path: PathLike,
	verbose: boolean
) {
	if (!siteUrl.includes("https")) {
		siteUrl = "https://" + siteUrl;
	}
	const date = new Date().toLocaleDateString("en-US");
	const firstPage = await fetchUrl(siteUrl);
	console.log(chalk.green(`Final depth: ${depth}`));
	if (firstPage.status !== 200) {
		throw new Error("Base URL is a redirect or does not exist.");
	}
	let links = filterResults(siteUrl, firstPage.body as string);

	/**
	 * Goes into links array and checks each one.
	 * Will do this for the amount of times specified in depth.
	 */
	let results = new Array<ResultData>();
	for (let i = 0; i <= depth; i++) {
		console.log(chalk.blue(`Current depth: ${i}`));

		let linksOnPages = [];
		if (links) {
			let fetchResults = await Promise.all(
				await fetchUrls(
					siteUrl,
					links.map((link) => siteUrl + link)
				)
			);

			for (const link of fetchResults) {
				if (
					link &&
					link.pageLinks &&
					!results.some(({ url }) => link.pageLinks?.includes(url))
				) {
					linksOnPages.push(filterArray(link.pageLinks.flat()));

					results.push({ url: link.url, status: link.status, date });
				}
			}
		}

		// Only get unique links
		links = filterArray(linksOnPages.flat());
	}
	if (verbose) console.table([...results]);
	console.log(chalk.green(`Found links: ${results.length}`));
	await writeFile(path, JSON.stringify([...results], undefined, 2))
		.then(() => console.log(chalk.green(`Report written to ${path}`)))
		.catch((err: Error) => {
			console.error(
				chalk.red(`Error writting to file. Message: ${err.message}`)
			);
		});
}

type FetchResults = {
	status: number;
	body: string | Promise<string>;
};

// https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
function filterArray(array: any[]) {
	var seen: { [key: string]: any } = {};
	return array.filter(function (item) {
		return seen.hasOwnProperty(item) ? false : (seen[item] = true);
	});
}

async function fetchUrls(baseUrl: string, urls: string[]) {
	let fetchResults = [];
	for (const url of urls) {
		const result = fetch(url)
			.then(async (res) => {
				return {
					url,
					status: res.status,
					pageLinks: await res
						.text()
						.then((res) => filterResults(baseUrl, res)),
				};
			})
			.catch((err: Error) => {
				console.error(chalk.red("Failed to fetch: " + url));
				console.error(chalk.bgRed(`${err.name}, ${err.message}`));
			});
		fetchResults.push(result);
	}
	return fetchResults;
}

async function fetchUrl(url: string): Promise<FetchResults> {
	console.log(chalk.green(`fetching: ${url}`));
	const res = await fetch(url);
	return {
		status: res.status,
		body: await res.text(),
	};
}

function filterResults(baseUrl: string, body: string): string[] | undefined {
	let matcherUrl = baseUrl.replace(/\//g, "/");
	matcherUrl = baseUrl.replace(/\./g, "\\.");

	const regex = new RegExp(
		`(?:(?<=<a.*))(?:(?<=href="${matcherUrl}))([^"]*)(?:(?="))|(?:(?<=<a.*))(?:(?<=href="))(\/[^"]*)(?:(?="))`,
		"gmi"
	);
	let matches = body.match(regex)?.filter(Boolean);
	if (!matches) {
		return;
	}
	return matches;
}
