const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "baisearch",
    alias: ["baiscope"],
    react: "🔍",
    desc: "Search movies from Baiscope",
    category: "search",
    use: ".baisearch <movie name>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a movie name!");
const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
        const res = await fetch('https://api.prabath.top/api/v1/baiscope/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ query: q })
        });

        const data = await res.json();
        if (!data.results || !data.results.length)
            return reply("❌ No results found!");

        let text = `🎬 *Baiscope Search Results*\n\n`;
        data.results.slice(0, 5).forEach((v, i) => {
            text += `*${i + 1}.* ${v.title}\n🔗 ${v.url}\n\n`;
        });

        reply(text);

    } catch (e) {
        reply("❌ Error fetching results!");
        console.error(e);
    }
});