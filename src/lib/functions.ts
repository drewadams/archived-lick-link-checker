import { PathLike, writeFileSync } from "fs";

export default async function checkLinks(
	url: string,
	depth = 0,
	path: PathLike
) {
	if (!url.includes("https")) {
		url = "https://" + url;
	}
	const date = new Date().toLocaleDateString("en-US");
	const firstPage = await fetchUrl(url);
	if (firstPage.status !== 200) {
		throw new Error("Base URL is a redirect or does not exist.");
	}
	let links = filterResults(url, firstPage.body as string);

	/**
	 * Goes into links array and checks each one.
	 * Will do this for the amount of times specified in depth.
	 */
	let results: { url: string; status: number; date: string }[] = [];
	for (let i = 0; i <= depth; i++) {
		console.log(`depth=${i}`);

		let linksOnPages = [];
		if (links) {
			let fetchResults = await fetchUrls(
				url,
				links.map((link) => url + link)
			);

			for (const link of fetchResults) {
				if (link) {
					if (!results.some((result) => link.links?.includes(result.url))) {
						linksOnPages.push(link);
						results.push({ url: link.url, status: link.status, date });
					}
				}
			}
			console.table(results);
		}

		// Only get unique links
		links = linksOnPages
			.map((link) => {
				return link.links as string[];
			})
			.flat();
	}

	console.log(results);
	writeFileSync(path, JSON.stringify(results, undefined, 2));
}

type FetchResults = {
	status: number;
	body: string | Promise<string>;
};

function fetchUrls(baseUrl: string, urls: string[]) {
	let fetchResults = [];
	for (const url of urls) {
		const result = fetch(url)
			.then(async (res) => {
				return {
					url,
					status: res.status,
					links: await res.text().then((res) => filterResults(baseUrl, res)),
				};
			})
			.catch((err) => {
				console.error("failed at url: ", url);
				console.error(err.message);
			});
		fetchResults.push(result);
	}
	return Promise.all(fetchResults);
}

async function fetchUrl(url: string): Promise<FetchResults> {
	console.log(`fetching: ${url}`);
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
