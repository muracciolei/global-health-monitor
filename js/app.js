let allItems = [];
let searchTimer = null;

const FALLBACK_SOURCES = [
  { name: "WHO Global", url: "https://www.who.int/rss-feeds/news-english.xml" },
  { name: "CIDRAP", url: "https://www.cidrap.umn.edu/rss.xml" },
  { name: "CDC Newsroom", url: "https://tools.cdc.gov/api/v2/resources/media/316422.rss" },
  { name: "ScienceDaily Health", url: "https://www.sciencedaily.com/rss/health_medicine.xml" },
  { name: "Google Health Alerts", url: "https://news.google.com/rss/search?q=health+outbreak&hl=en&gl=US&ceid=EN:en" }
];

function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
}

function showError(msg) {
  const el = document.getElementById("errorMessage");
  el.textContent = msg;
  el.style.display = "block";
}

function renderSourceFilters(sources) {
  const container = document.getElementById("sourceFilters");
  container.innerHTML = "";
  sources.forEach(s => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.dataset.source = s.name;
    cb.className = "source-checkbox";
    cb.addEventListener("change", () => applyFilters());
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + s.name));
    container.appendChild(label);
  });
}

function applyFilters() {
  const checked = new Set(
    Array.from(document.querySelectorAll(".source-checkbox:checked"))
      .map(cb => cb.dataset.source)
  );
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  const filtered = allItems.filter(item => {
    if (!checked.has(item.source)) return false;
    if (query) {
      const inTitle = item.title.toLowerCase().includes(query);
      const inDesc = (item.description || "").toLowerCase().includes(query);
      if (!inTitle && !inDesc) return false;
    }
    return true;
  });

  renderArticles(filtered);

  const chartItems = query ? filtered : allItems;
  drawBarChart("keywordChart", extractKeywords(chartItems));
  drawTimelineChart("timelineChart", chartItems);
}

function renderArticles(items) {
  const container = document.getElementById("articles");
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = "<p>No articles found</p>";
    return;
  }
  items.slice(0, 50).forEach(item => {
    const div = document.createElement("div");
    div.className = "article";
    const title = sanitizeText(item.title);
    const desc = truncateText(sanitizeText(item.description || ""), 150);
    const date = new Date(item.pubDate).toLocaleString();
    div.innerHTML =
      "<h3>" + title + "</h3>" +
      "<p>" + desc + "</p>" +
      "<small>" + sanitizeText(item.source) + " &mdash; " + date + "</small>" +
      "<br><a href=\"" + item.link + "\" target=\"_blank\"><button>Read</button></a>";
    container.appendChild(div);
  });
}

async function fetchAndRender(sources) {
  showLoading();
  try {
    const items = await fetchAllSources(sources);
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    allItems = items;
    saveData("rssCache", items);
    saveData("rssCacheTime", Date.now());
  } catch (e) {
    const cached = loadData("rssCache");
    if (cached && cached.length) {
      allItems = cached;
      showError("You are offline. Showing cached data.");
    } else {
      showError("Failed to load data and no cache available.");
      hideLoading();
      return;
    }
  }
  applyFilters();
  document.getElementById("lastUpdated").textContent =
    new Date().toLocaleString();
  hideLoading();
}

async function init() {
  showLoading();
  let sources;
  try {
    sources = await fetch("data/sources.json").then(r => r.json());
  } catch (e) {
    sources = FALLBACK_SOURCES;
  }
  renderSourceFilters(sources);

  document.getElementById("searchInput").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 300);
  });

  await fetchAndRender(sources);

  setInterval(() => {
    if (document.visibilityState === "visible") {
      fetchAndRender(sources);
    }
  }, 5 * 60 * 1000);
}

document.addEventListener("DOMContentLoaded", init);
