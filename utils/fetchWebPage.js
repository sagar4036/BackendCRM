// utils/fetchWebPage.js
const axios = require("axios");
const cheerio = require("cheerio");

async function fetchWebPage(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const text = $("body").text();
    return text.replace(/\s+/g, " ").trim();
  } catch (err) {
    console.error("🌐 Webpage Fetch Error:", err.message);
    return null;
  }
}

module.exports = fetchWebPage;
