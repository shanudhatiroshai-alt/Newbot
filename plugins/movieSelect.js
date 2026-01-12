const { cmd } = require('../command');
const fetch = require('node-fetch');
const movieStore = require('../lib/movieStore');

cmd({
    pattern: /^[0-9]+$/,
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, body, reply }) => {

    if (!m.quoted) return;

    const list = movieStore.get(from);
    if (!list) return;
    const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
    const index = parseInt(body.replace('.', ''));
    const selected = list.find(x => x.id === index);

    if (!selected)
        return reply("❌ Invalid number!");

    let apiMap = {
        Baiscope: "https://api.prabath.top/api/v1/baiscope/movie",
        Cinesubz: "https://api.prabath.top/api/v1/cinesubz/movie",
        Sinhalasub: "https://api.prabath.top/api/v1/sinhalasub/movie",
        Cineru: "https://api.prabath.top/api/v1/cineru/movie"
    };

    let api = apiMap[selected.site];
    if (!api) return reply("❌ Unsupported source!");

    reply(`⏳ Downloading *${selected.title}* from ${selected.site}...`);

    const res = await fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
        },
        body: JSON.stringify({ url: selected.url })
    });

    const data = await res.json();
    if (!data.download)
        return reply("❌ Download failed!");

    await conn.sendMessage(from, {
        document: { url: data.download },
        mimetype: 'video/mp4',
        fileName: `${selected.title}.mp4`
    }, { quoted: mek });

    movieStore.delete(from);
});