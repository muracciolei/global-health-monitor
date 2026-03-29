const RSS_PROXY =
"https://api.rss2json.com/v1/api.json?rss_url=";
const FETCH_TIMEOUT = 10000;

async function fetchRSS(url, retryCount = 1) {
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

try {
const response =
await fetch(RSS_PROXY + encodeURIComponent(url), { signal: controller.signal });
const data = await response.json();
return data.items || [];
} catch (error) {
if (retryCount > 0) {
return fetchRSS(url, retryCount - 1);
}
console.error("RSS Fetch error:", error);
return [];
} finally {
clearTimeout(timeout);
}
}

async function fetchAllSources(sources) {
const results = await Promise.all(
sources.map(async source => {
const items = await fetchRSS(source.url);
items.forEach(item => {
item.source = source.name;
});
return items;
})
);

return results.flat();
}
