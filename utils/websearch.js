const axios = require("axios");
const cheerio = require("cheerio");

async function searchWeb(query) {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      query
    )}&hl=en`;

    const { data } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
    });

    const $ = cheerio.load(data);
    const links = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/url?q=")) {
        const url = href.split("/url?q=")[1].split("&")[0];
        if (
          url.startsWith("http") &&
          !url.includes("google.com") &&
          !url.includes("youtube.com") &&
          !url.includes("facebook.com")
        ) {
          links.push(url);
        }
      }
    });

    const topLinks = [...new Set(links)].slice(0, 3); // avoid duplicates, limit to 3
    let groupedContent = "";

    for (const url of topLinks) {
      try {
        const res = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
          },
        });

        const $page = cheerio.load(res.data);
        const rawText = $page("body").text();
        const cleanText = rawText.replace(/\s+/g, " ").trim().slice(0, 1500);

        groupedContent += `\nFrom ${url}:\n${cleanText}\n\n---\n`;
      } catch (err) {
        console.warn(`❌ Could not scrape ${url}:`, err.message);
      }
    }

    return groupedContent || "No relevant web content could be extracted.";
  } catch (err) {
    console.error("❌ searchWeb failed:", err.message);
    return "No web data available.";
  }
}

module.exports = searchWeb;
