cmd({
    pattern: "greet",
    react: "💌",
    desc: "Greeting card",
    category: "maker",
    use: ".greet <text>",
    filename: __filename
}, async (conn, m, mek, { q, reply }) => {
    if (!q) return reply("❌ Enter greeting!");

    const res = await fetch('https://api.prabath.top/api/v1/maker/greeting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.API_KEY
        },
        body: JSON.stringify({ text: q })
    });

    reply(await res.text());
});