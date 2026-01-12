cmd({
    pattern: "cineepisode",
    react: "📺",
    desc: "Download Cinesubz episode",
    category: "download",
    use: ".cineepisode <episode url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!q) return reply("❌ Provide episode URL!");
const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
    const res = await fetch('https://api.prabath.top/api/v1/cinesubz/episode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify({ url: q })
    });

    const data = await res.json();
    if (!data.download)
        return reply("❌ Download link not found!");

    await conn.sendMessage(from, {
        document: { url: data.download },
        mimetype: 'video/mp4',
        fileName: `${data.title}.mp4`
    }, { quoted: mek });
});