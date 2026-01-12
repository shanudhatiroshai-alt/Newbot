const { cmd } = require('../command');
const fetch = require('node-fetch');
const movieStore = require('../lib/movieStore');

cmd({
    pattern: "movie",
    react: "🎬",
    desc: "Search movies from all sites",
    category: "movie",
    use: ".movie <name>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
    if (!q) return reply("❌ Enter a movie name!");

    let results = [];
    let count = 1;

    async function search(site, api) {
        try {
            const res = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                },
                body: JSON.stringify({ query: q })
            });

            const data = await res.json();
            if (!data.results) return;

            data.results.slice(0, 5).forEach(r => {
                results.push({
                    id: count++,
                    title: r.title,
                    url: r.url,
                    site
                });
            });
        } catch (e) {
            console.log(`${site} search failed`);
        }
    }

    await search("Baiscope", "https://api.prabath.top/api/v1/baiscope/search");
    await search("Cinesubz", "https://api.prabath.top/api/v1/cinesubz/search");
    await search("Sinhalasub", "https://api.prabath.top/api/v1/sinhalasub/search");
    await search("Cineru", "https://api.prabath.top/api/v1/cineru/search");

    if (!results.length) return reply("❌ No results found!");

    movieStore.set(from, results);

    let msg = `🎬 *Movie Results for:* ${q}\n\n`;
    results.forEach(r => {
        msg += `*${r.id}.* ${r.title}\n📌 ${r.site}\n\n`;
    });

    msg += `Reply with *1 / .1* to download`;

    reply(msg);
});