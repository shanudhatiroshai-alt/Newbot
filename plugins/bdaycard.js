cmd({
    pattern: "bday",
    react: "🎂",
    desc: "Birthday card",
    category: "maker",
    use: ".bday <name>",
    filename: __filename
}, async (conn, m, mek, { q, reply }) => {
    if (!q) return reply("❌ Enter name!");

    const res = await fetch('https://api.prabath.top/api/v1/maker/card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.API_KEY
        },
        body: JSON.stringify({ name: q })
    });

    reply(await res.text());
});