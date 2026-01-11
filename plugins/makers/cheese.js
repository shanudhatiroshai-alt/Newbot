cmd({
    pattern: "chess",
    react: "♟",
    desc: "Play chess",
    category: "game",
    use: ".chess",
    filename: __filename
}, async (conn, m, mek, { reply }) => {
    const res = await fetch('https://api.prabath.top/api/v1/game/chess', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.API_KEY
        }
    });

    const data = await res.json();
    reply(`♟ Chess Game\n\n${data.url}`);
});