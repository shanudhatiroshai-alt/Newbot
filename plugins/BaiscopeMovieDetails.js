cmd({
    pattern: "baimovie",
    react: "🎥",
    desc: "Get Baiscope movie details",
    category: "movie",
    use: ".baimovie <movie url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a movie URL!");
const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
        const res = await fetch('https://api.prabath.top/api/v1/baiscope/movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ url: q })
        });

        const data = await res.json();
        if (!data.download)
            return reply("❌ Movie data not found!");

        let text = `🎬 *${data.title}*\n\n`;
        text += `📅 ${data.year}\n`;
        text += `🎞 Quality: ${data.quality}\n\n`;
        text += `⬇ *Download:*\n${data.download}`;

        reply(text);

    } catch (e) {
        reply("❌ Error fetching movie!");
        console.error(e);
    }
});