cmd({
    pattern: "cinmovie",
    react: "🎞",
    desc: "Cineru movie details",
    category: "movie",
    use: ".cinmovie <url>",
    filename: __filename
}, async (conn, m, mek, { q, reply }) => {
    if (!q) return reply("❌ Provide movie URL!");
const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
    const res = await fetch('https://api.prabath.top/api/v1/cineru/movie', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify({ url: q })
    });

    const data = await res.json();
    if (!data.download) return reply("❌ Movie not found!");

    reply(`🎬 *${data.title}*\n\n⬇ Download:\n${data.download}`);
});