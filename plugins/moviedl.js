// Quick download command (direct URL)
cmd({
    pattern: "moviedl",
    alias: ["mdl", "quickdl"],
    react: "⚡",
    desc: "Quick download with direct URL",
    category: "download",
    use: ".moviedl <url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a download URL!");

        await reply("⏳ Processing download...");

        const filename = `quick_download_${Date.now()}`;
        const filepath = path.join(__dirname, '../temp', `${filename}.mp4`);

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(path.join(__dirname, '../temp'))) {
            fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
        }

        let lastProgress = 0;
        await downloadFile(q, filepath, async (percent, loaded, total) => {
            if (percent >= lastProgress + 25) {
                await reply(`⏳ Download Progress: ${percent}%\n📦 ${formatSize(loaded)} / ${formatSize(total)}`);
                lastProgress = percent;
            }
        });

        const fileStats = fs.statSync(filepath);
        const fileSize = fileStats.size;

        if (fileSize > MAX_FILE_SIZE) {
            await reply(`⚠️ File size: ${formatSize(fileSize)}\n✂️ Splitting into parts...`);

            const chunks = await splitFile(filepath);
            
            for (let i = 0; i < chunks.length; i++) {
                await conn.sendMessage(from, {
                    document: fs.readFileSync(chunks[i]),
                    fileName: `${filename}_part${i + 1}.mp4`,
                    mimetype: 'video/mp4',
                    caption: `Part ${i + 1} of ${chunks.length}`
                }, { quoted: mek });

                fs.unlinkSync(chunks[i]);
            }

            fs.unlinkSync(filepath);
        } else {
            await conn.sendMessage(from, {
                document: fs.readFileSync(filepath),
                fileName: `${filename}.mp4`,
                mimetype: 'video/mp4',
                caption: `✅ Downloaded\n📊 Size: ${formatSize(fileSize)}`
            }, { quoted: mek });

            fs.unlinkSync(filepath);
        }

        await reply("✅ Download completed!");

    } catch (error) {
        console.error(error);
        await reply(`❌ Error: ${error.message}`);
    }
});