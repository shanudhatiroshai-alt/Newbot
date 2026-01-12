cmd({
    pattern: "cinesearch",
    react: "🔎",
    desc: "Search Cinesubz movies/TV",
    category: "search",
    use: ".cinesearch <name>",
    filename: __filename
}, async (conn, m, mek, { q, reply }) => {
    if (!q) return reply("❌ Enter a search query!");
const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
    const res = await fetch('https://api.prabath.top/api/v1/cinesubz/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify({ query: q })
    });

    const data = await res.json();
    if (!data.results?.length) return reply("❌ No results!");

    let msg = `🎬 *Cinesubz Results*\n\n`;
    data.results.slice(0, 5).forEach((v, i) => {
        msg += `*${i + 1}.* ${v.title}\n🔗 ${v.url}\n\n`;
    });

    reply(msg);
});