const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Store search results temporarily
const searchCache = {};
const downloadQueue = {};

const API_KEY = 'prabath_sk_1d7a31d1891abfc40e0d09aa9c6ad37d3b7717a0';
const BASE_URL = 'https://api.prabath.top/api/v1';

// File size limits (WhatsApp limit is 2GB, but we'll use 1.9GB to be safe)
const MAX_FILE_SIZE = 1.9 * 1024 * 1024 * 1024; // 1.9GB in bytes
const CHUNK_SIZE = 1.9 * 1024 * 1024 * 1024; // 1.9GB chunks

// API endpoints for searching
const SEARCH_APIS = [
    { name: 'Baiscope', endpoint: '/baiscope/search', icon: '🎬' },
    { name: 'Cineru', endpoint: '/cineru/search', icon: '🎥' },
    { name: 'Cinesubz', endpoint: '/cinesubz/search', icon: '🎞️' },
    { name: 'Sinhalasub', endpoint: '/sinhalsub/search', icon: '🇱🇰' }
];

// API endpoints for getting details
const DETAIL_APIS = {
    'Baiscope': {
        movie: '/baiscope/movie',
        episode: '/baiscope/episode'
    },
    'Cineru': {
        movie: '/cineru/movie',
        episode: '/cineru/episode',
        tv: '/cineru/tv'
    },
    'Cinesubz': {
        movie: '/cinesubz/movie',
        episode: '/cinesubz/episode',
        tv: '/cinesubz/tv-series',
        download: '/cinesubz/dl'
    },
    'Sinhalasub': {
        movie: '/sinhalasub/movie',
        episode: '/sinhalasub/episode',
        tv: '/sinhalasub/tvshow'
    }
};

// Helper function to make API requests
async function apiRequest(endpoint, data) {
    try {
        const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error.message);
        return null;
    }
}

// Helper function to download file with progress
async function downloadFile(url, filepath, progressCallback) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
            if (progressCallback) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                progressCallback(percentCompleted, progressEvent.loaded, progressEvent.total);
            }
        }
    });

    await pipeline(response.data, fs.createWriteStream(filepath));
    return filepath;
}

// Helper function to split file into chunks
async function splitFile(filepath, chunkSize = CHUNK_SIZE) {
    const fileSize = fs.statSync(filepath).size;
    const chunks = [];
    
    if (fileSize <= chunkSize) {
        return [filepath];
    }

    const numChunks = Math.ceil(fileSize / chunkSize);
    const readStream = fs.createReadStream(filepath, { highWaterMark: 64 * 1024 });
    
    let chunkIndex = 0;
    let currentChunk = [];
    let currentSize = 0;

    return new Promise((resolve, reject) => {
        readStream.on('data', (chunk) => {
            currentChunk.push(chunk);
            currentSize += chunk.length;

            if (currentSize >= chunkSize) {
                const chunkPath = `${filepath}.part${chunkIndex + 1}`;
                fs.writeFileSync(chunkPath, Buffer.concat(currentChunk));
                chunks.push(chunkPath);
                
                currentChunk = [];
                currentSize = 0;
                chunkIndex++;
            }
        });

        readStream.on('end', () => {
            if (currentChunk.length > 0) {
                const chunkPath = `${filepath}.part${chunkIndex + 1}`;
                fs.writeFileSync(chunkPath, Buffer.concat(currentChunk));
                chunks.push(chunkPath);
            }
            resolve(chunks);
        });

        readStream.on('error', reject);
    });
}

// Helper function to format file size
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Main search command
cmd({
    pattern: "movie",
    alias: ["film", "series", "show"],
    react: "🔍",
    desc: "Search movies/series across all platforms",
    category: "search",
    use: ".movie <name>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("❌ Please provide a movie/series name!\n\n*Example:* .movie Avengers");

        await reply("🔍 Searching across all platforms...\n\nPlease wait...");

        let allResults = [];
        let searchPromises = [];

        // Search across all APIs
        for (const api of SEARCH_APIS) {
            const promise = apiRequest(api.endpoint, { query: q })
                .then(data => {
                    if (data && data.success && data.results) {
                        return data.results.map(result => ({
                            ...result,
                            source: api.name,
                            icon: api.icon
                        }));
                    }
                    return [];
                })
                .catch(() => []);
            
            searchPromises.push(promise);
        }

        const results = await Promise.all(searchPromises);
        allResults = results.flat();

        if (allResults.length === 0) {
            return await reply("❌ No results found across any platform!");
        }

        // Store results in cache
        const cacheKey = `${sender}_${Date.now()}`;
        searchCache[cacheKey] = allResults;

        // Build response message
        let message = `*🎬 SEARCH RESULTS FOR: ${q}*\n\n`;
        message += `Found *${allResults.length}* results:\n\n`;

        allResults.slice(0, 20).forEach((result, index) => {
            message += `*${index + 1}.* ${result.icon} ${result.title}\n`;
            message += `   📁 Source: *${result.source}*\n`;
            message += `   🆔 ID: \`${result.id}\`\n`;
            message += `   📺 Type: ${result.type || 'Movie'}\n`;
            if (result.year) message += `   📅 Year: ${result.year}\n`;
            if (result.rating) message += `   ⭐ Rating: ${result.rating}\n`;
            message += `\n`;
        });

        if (allResults.length > 20) {
            message += `_...and ${allResults.length - 20} more results_\n\n`;
        }

        message += `\n*📥 TO DOWNLOAD:*\n`;
        message += `Reply with the number (e.g., *1*, *2*, *.1*, *.2*)\n\n`;
        message += `_Results will expire in 10 minutes_`;

        await reply(message);

        // Store cache key for this user
        downloadQueue[sender] = cacheKey;

        // Auto-cleanup after 10 minutes
        setTimeout(() => {
            delete searchCache[cacheKey];
            delete downloadQueue[sender];
        }, 10 * 60 * 1000);

    } catch (error) {
        console.error(error);
        await reply(`❌ Search Error: ${error.message}`);
    }
});

// Selection and download command
cmd({
    pattern: "^[.]?\\d+$",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, m, mek, { from, body, reply, sender }) => {
    try {
        // Check if user has pending search results
        const cacheKey = downloadQueue[sender];
        if (!cacheKey || !searchCache[cacheKey]) {
            return; // Ignore if no pending results
        }

        const selection = parseInt(body.replace('.', '').trim());
        const results = searchCache[cacheKey];

        if (selection < 1 || selection > results.length) {
            return await reply(`❌ Invalid selection! Please choose between 1 and ${results.length}`);
        }

        const selectedItem = results[selection - 1];
        
        await reply(`📥 *Selected:* ${selectedItem.title}\n\n⏳ Fetching download links...`);

        // Determine which API endpoint to use based on source and type
        let detailEndpoint;
        const source = selectedItem.source;
        const type = selectedItem.type?.toLowerCase() || 'movie';

        if (DETAIL_APIS[source]) {
            if (type.includes('movie')) {
                detailEndpoint = DETAIL_APIS[source].movie;
            } else if (type.includes('episode')) {
                detailEndpoint = DETAIL_APIS[source].episode;
            } else if (type.includes('tv') || type.includes('series')) {
                detailEndpoint = DETAIL_APIS[source].tv;
            } else {
                detailEndpoint = DETAIL_APIS[source].movie; // Default to movie
            }
        }

        if (!detailEndpoint) {
            return await reply("❌ Unable to determine download endpoint for this item!");
        }

        // Fetch detailed information
        const detailData = await apiRequest(detailEndpoint, { id: selectedItem.id });

        if (!detailData || !detailData.success) {
            return await reply("❌ Failed to fetch download information!");
        }

        const itemData = detailData.result;

        // Check for download links
        if (!itemData.download_links || itemData.download_links.length === 0) {
            let message = `*${itemData.title}*\n\n`;
            message += `${itemData.description || 'No description available'}\n\n`;
            
            if (itemData.episodes) {
                message += `*📺 Available Episodes:*\n`;
                itemData.episodes.slice(0, 10).forEach((ep, idx) => {
                    message += `${idx + 1}. ${ep.title} - ID: ${ep.id}\n`;
                });
                message += `\n_Use .movie command to search for specific episodes_`;
            } else {
                message += `❌ No direct download links available!`;
            }
            
            return await reply(message);
        }

        // Show available download links
        let linkMessage = `*🎬 ${itemData.title}*\n\n`;
        linkMessage += `*📥 Available Download Links:*\n\n`;

        itemData.download_links.forEach((link, index) => {
            linkMessage += `*${index + 1}.* `;
            if (link.quality) linkMessage += `${link.quality} - `;
            if (link.size) linkMessage += `${link.size}\n`;
            else linkMessage += `\n`;
            linkMessage += `   🔗 ${link.url}\n\n`;
        });

        linkMessage += `\n⏳ *Starting download...*\n`;
        linkMessage += `_This may take a while depending on file size_`;

        await reply(linkMessage);

        // Start downloading the first available link
        const downloadLink = itemData.download_links[0].url;
        const filename = `${itemData.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
        const filepath = path.join(__dirname, '../temp', `${filename}.mp4`);

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(path.join(__dirname, '../temp'))) {
            fs.mkdirSync(path.join(__dirname, '../temp'), { recursive: true });
        }

        let lastProgress = 0;
        await downloadFile(downloadLink, filepath, async (percent, loaded, total) => {
            // Update progress every 25%
            if (percent >= lastProgress + 25) {
                await reply(`⏳ Download Progress: ${percent}%\n📦 Downloaded: ${formatSize(loaded)} / ${formatSize(total)}`);
                lastProgress = percent;
            }
        });

        await reply(`✅ Download completed!\n\n📦 Processing file...`);

        // Check file size
        const fileStats = fs.statSync(filepath);
        const fileSize = fileStats.size;

        if (fileSize > MAX_FILE_SIZE) {
            // File needs to be split
            await reply(`📦 File size: ${formatSize(fileSize)}\n⚠️ File exceeds WhatsApp limit!\n\n✂️ Splitting into parts...`);

            const chunks = await splitFile(filepath);
            
            await reply(`✅ Split into ${chunks.length} parts\n\n📤 Sending parts...`);

            // Send each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunkStats = fs.statSync(chunks[i]);
                const caption = `*${itemData.title}*\n\n` +
                              `📦 Part ${i + 1} of ${chunks.length}\n` +
                              `📊 Size: ${formatSize(chunkStats.size)}\n` +
                              `🎬 Source: ${source}`;

                await conn.sendMessage(from, {
                    document: fs.readFileSync(chunks[i]),
                    fileName: `${filename}_part${i + 1}.mp4`,
                    mimetype: 'video/mp4',
                    caption: caption
                }, { quoted: mek });

                await reply(`✅ Sent part ${i + 1}/${chunks.length}`);

                // Delete chunk after sending
                fs.unlinkSync(chunks[i]);
            }

            // Delete original file
            fs.unlinkSync(filepath);

            await reply(`✅ *All parts sent successfully!*\n\n` +
                       `📝 *How to merge:*\n` +
                       `On PC: \`copy /b part1+part2+part3 output.mp4\`\n` +
                       `On Mac/Linux: \`cat part1 part2 part3 > output.mp4\`\n` +
                       `On Android: Use app like *File Joiner*`);

        } else {
            // File is within limit, send directly
            const caption = `*${itemData.title}*\n\n` +
                          `📊 Size: ${formatSize(fileSize)}\n` +
                          `🎬 Source: ${source}\n` +
                          `⭐ Quality: ${itemData.download_links[0].quality || 'Default'}`;

            await conn.sendMessage(from, {
                document: fs.readFileSync(filepath),
                fileName: `${filename}.mp4`,
                mimetype: 'video/mp4',
                caption: caption
            }, { quoted: mek });

            // Delete file after sending
            fs.unlinkSync(filepath);

            await reply(`✅ *Download completed and sent successfully!*`);
        }

        // Clear cache for this user
        delete downloadQueue[sender];

    } catch (error) {
        console.error(error);
        await reply(`❌ Download Error: ${error.message}\n\nPlease try again or select a different quality/link.`);
    }
});
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

        // Validate URL
        let url;
        try {
            url = new URL(q);
            if (!['http:', 'https:'].includes(url.protocol)) {
                return await reply("❌ Invalid URL! Must start with http:// or https://");
            }
        } catch (error) {
            return await reply("❌ Invalid URL format!");
        }

        await reply("⏳ Processing download...");

        const filename = `quick_download_${Date.now()}`;
        
        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Temporary path without extension
        const tempPath = path.join(tempDir, filename);

        let lastProgress = 0;
        let filepath;
        
        // Download with error handling
        try {
            filepath = await downloadFile(q, tempPath, async (percent, loaded, total) => {
                if (percent >= lastProgress + 25) {
                    await reply(`⏳ Download Progress: ${percent}%\n📦 ${formatSize(loaded)} / ${formatSize(total)}`);
                    lastProgress = percent;
                }
            });
        } catch (downloadError) {
            // Cleanup and report error
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            return await reply(`❌ Download failed: ${downloadError.message}\n\nPlease check if the URL is valid and accessible.`);
        }

        const fileStats = fs.statSync(filepath);
        const fileSize = fileStats.size;

        // Determine file extension (default to mp4)
        const fileExt = path.extname(url.pathname) || '.mp4';
        const finalFilename = `${filename}${fileExt}`;

        if (fileSize > MAX_FILE_SIZE) {
            await reply(`⚠️ File size: ${formatSize(fileSize)}\n✂️ Splitting into parts...`);

            const chunks = await splitFile(filepath);
            
            for (let i = 0; i < chunks.length; i++) {
                await conn.sendMessage(from, {
                    document: fs.readFileSync(chunks[i]),
                    fileName: `${filename}_part${i + 1}${fileExt}`,
                    mimetype: 'video/mp4',
                    caption: `Part ${i + 1} of ${chunks.length}`
                }, { quoted: mek });

                fs.unlinkSync(chunks[i]);
            }

            fs.unlinkSync(filepath);
            await reply("✅ All parts sent!");
        } else {
            await conn.sendMessage(from, {
                document: fs.readFileSync(filepath),
                fileName: finalFilename,
                mimetype: 'video/mp4',
                caption: `✅ Downloaded\n📊 Size: ${formatSize(fileSize)}`
            }, { quoted: mek });

            fs.unlinkSync(filepath);
            await reply("✅ Download completed!");
        }

    } catch (error) {
        console.error(error);
        await reply(`❌ Error: ${error.message}`);
    }
});