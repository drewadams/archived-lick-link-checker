import chalk from "chalk";
import { writeFile } from "fs/promises";

// Defaults for these are set in yargs.
export interface CheckerOptions {
	depth: number;
	path: string;
	verbose: boolean;
	slow: boolean;
}

export interface ResultData {
	url: string;
	status: number;
	date: string;
}

export type FetchResults = {
	status: number;
	body: string | Promise<string>;
};

export type FetchURLsResults = Promise<
	Promise<void | {
		url: string;
		status: number;
		pageLinks: string[] | undefined;
	}>[]
>;

export default class LinkChecker {
	verbose: boolean;
	path: string;
	depth: number;
	siteUrl: string;
	fetchedUrls: Set<string>;
	results: ResultData[];
	fails: string[];
	timeout: number;

	// Defaults are set in index.ts inside yargs.
	constructor(siteUrl: string, { depth, path, verbose, slow }: CheckerOptions) {
		this.siteUrl = siteUrl;
		this.path = path;
		this.depth = depth;
		this.verbose = verbose;
		this.fetchedUrls = new Set<string>();
		this.timeout = slow ? 15000 : 6000;
		this.results = [];
		this.fails = [];
	}

	async runCheck() {
		// Input checks
		if (!this.siteUrl.includes("https")) {
			this.siteUrl = "https://" + this.siteUrl;
		}
		if (this.siteUrl.charAt(this.siteUrl.length - 1) === "/") {
			this.siteUrl = this.siteUrl.slice(0, -1);
		}
		if (!this.path.includes(".json")) {
			this.path = this.path + ".json";
		}

		const date = new Date().toLocaleDateString("en-US");
		let firstPage = await this.fetchUrl(this.siteUrl);
		console.log(chalk.green(`Final depth: ${this.depth}`));
		if (firstPage.status !== 200) {
			throw new Error("Base URL is a redirect or does not exist.");
		}
		let links = this.filterResults((await firstPage.body) as string);

		/**
		 * Goes into links array and checks each one.
		 * Will do this for the amount of times specified in depth.
		 */
		for (let i = 0; i <= this.depth; i++) {
			console.log(chalk.blue(`Current depth: ${i}`));

			if (!links) break;

			const regex = new RegExp(
				`^(${this.siteUrl}|${this.siteUrl.slice(6)}|${this.siteUrl.slice(
					3
				)}|${this.siteUrl.slice(9)})`
			);

			const fetchResults = await Promise.allSettled(
				await this.fetchUrls(
					links.map((link) => (regex.test(link) ? link : this.siteUrl + link))
				)
			);

			let uniqueLinks = [];
			const newResults = fetchResults
				.filter((link) => {
					return link.status === "fulfilled";
				})
				.map((link) => {
					if (
						link.status === "fulfilled" &&
						Array.isArray(link.value?.pageLinks)
					) {
						link.value.pageLinks = link.value.pageLinks.filter(
							(url) =>
								!this.results.some(({ url: resultUrl }) => url === resultUrl)
						);
					}
					return link;
				})
				.filter(Boolean);

			for (const result of newResults) {
				if (result && result.status === "fulfilled") {
					const pageLinks = result.value?.pageLinks as string[];
					if (pageLinks) {
						uniqueLinks.push(...new Set(pageLinks));
					}
					if (result.value?.url) {
						this.results.push({
							url: result.value?.url,
							status: result.value?.status,
							date,
						});
					}
				}
			}

			links = [...new Set(uniqueLinks)];
		}

		// this.results = this.filter([...new Set(this.results)]);
		if (this.verbose) console.table(this.results);
		console.log(chalk.green(`Final links: ${this.results.length}`));
	}

	async writeResultsToFile() {
		await writeFile(this.path, JSON.stringify(this.results, undefined, 2))
			.then(() => console.log(chalk.green(`Report written to ${this.path}`)))
			.catch((err: Error) => {
				console.error(
					chalk.red(`Error writting to file. Message: ${err.message}`)
				);
			});
	}

	async fetchUrls(urls: string[]) {
		let fetchResults = [];
		for (let url of urls) {
			url = url.trim();
			if (!this.fetchedUrls.has(url)) {
				this.fetchedUrls.add(url);
				if (this.verbose) {
					console.log("fetching: ", url);
				}

				const result = this.fetchTimeout(url, this.timeout).then(
					async (res) => {
						return {
							url,
							status: res.status,
							pageLinks: await res
								.text()
								.then((res) => this.filterResults(res)),
						};
					}
				);
				fetchResults.push(result);
			}
		}
		return fetchResults;
	}

	async fetchTimeout(url: string, time: number, fetchOptions?: RequestInit) {
		const res = await fetch(url, {
			signal: AbortSignal.timeout(time),
			...fetchOptions,
		}).catch((err) => {
			if (err instanceof Error && err.name === "TimeoutError") {
				throw new Error("Fetch timeout. Failed on: " + url);
			} else {
				throw new Error(err);
			}
		});

		return res ?? null;
	}

	async fetchUrl(url: string): Promise<FetchResults> {
		url = url.trim();
		console.log(chalk.green(`fetching: ${url}`));
		const res = await this.fetchTimeout(url, this.timeout);
		this.fetchedUrls.add(url);
		return {
			status: res.status,
			body: await res.text(),
		};
	}

	filterResults(body: string): string[] | undefined {
		let matcherUrl = this.siteUrl.replace(/\./g, "\\.");
		matcherUrl = matcherUrl.replace("https://", "");
		console.log("Matcher url: ", matcherUrl);

		const regex = new RegExp(
			`(?:(?<=<a.*))(?:(?<=href="https:\/\/[^*]${matcherUrl}))([^"]*)(?:(?="))|(?:(?<=<a.*))(?:(?<=href="))(\/[^"]*)(?:(?="))`,
			"gmi"
		);
		let matches = body.match(regex)?.filter(Boolean);
		if (!matches) {
			return;
		}

		const results = matches
			.filter((url) => !this.fetchedUrls.has(url))
			.map((url) => url.trim());
		return results;
	}
}
