cmd({
    pattern: "attp",
    react: "🌀",
    desc: "Animated text sticker",
    category: "maker",
    use: ".attp <text>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    if (!q) return reply("❌ Enter text!");

    const res = await fetch('https://api.prabath.top/api/v1/maker/attp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.API_KEY
        },
        body: JSON.stringify({ text: q })
    });

    const sticker = await res.buffer();
    await conn.sendMessage(from, { sticker }, { quoted: mek });
});