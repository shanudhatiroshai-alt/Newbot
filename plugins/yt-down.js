cmd({
    pattern: "yt2",
    alias: ["ytvideo"],
    react: "▶️",
    desc: "Download YouTube video",
    category: "download",
    use: ".ytmp4 <url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!q) return reply("❌ Provide YouTube URL!");
    const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
    const res = await fetch('https://api.prabath.top/api/v1/dl/youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify({ url: q })
    });

    const data = await res.json();
    if (!data.download)
        return reply("❌ Failed to download!");

    await conn.sendMessage(from, {
        video: { url: data.download },
        caption: `🎬 *YouTube Video*`
    }, { quoted: mek });
});