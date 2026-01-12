const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// ==================== HELPER FUNCTIONS ====================

// Calculate relevance score for search results
function calculateRelevance(video, query) {
    const queryLower = query.toLowerCase();
    const titleLower = video.title.toLowerCase();
    const authorLower = video.author.name.toLowerCase();
    
    let score = 0;
    
    // Exact match in title = highest priority
    if (titleLower === queryLower) score += 100;
    
    // Title starts with query
    if (titleLower.startsWith(queryLower)) score += 50;
    
    // All query words present in title
    const queryWords = queryLower.split(' ');
    const titleWords = titleLower.split(' ');
    const matchingWords = queryWords.filter(word => titleWords.includes(word));
    score += (matchingWords.length / queryWords.length) * 30;
    
    // Official/verified channels get bonus
    if (video.author.verified) score += 20;
    
    // View count influence (logarithmic to prevent bias toward viral videos)
    const viewScore = Math.log10(video.views + 1) * 2;
    score += viewScore;
    
    // Recent videos get slight bonus
    const ageInDays = Math.floor((Date.now() - new Date(video.ago).getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays < 7) score += 5;
    if (ageInDays < 30) score += 3;
    
    // Duration preference (not too short, not too long)
    const duration = video.seconds;
    if (duration >= 120 && duration <= 600) score += 5; // 2-10 minutes
    
    return score;
}

// Format view count
function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

// Format duration
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get YouTube video ID from URL
function getYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:.*v=|.*\/|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Download handler with multiple API fallbacks
async function downloadMedia(url, type) {
    const apis = [
        {
            name: 'API1',
            mp3: `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(url)}`,
            mp4: `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(url)}`
        },
        {
            name: 'API2',
            mp3: `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(url)}`,
            mp4: `https://apis.davidcyriltech.my.id/youtube/mp4?url=${encodeURIComponent(url)}`
        }
    ];
    
    for (const api of apis) {
        try {
            const apiUrl = type === 'mp3' ? api.mp3 : api.mp4;
            const response = await axios.get(apiUrl, { timeout: 15000 });
            const data = response.data;
            
            // Handle different API response formats
            if (data.success && data.result?.download_url) {
                return { success: true, url: data.result.download_url, api: api.name };
            }
            if (data.success && data.result?.downloadUrl) {
                return { success: true, url: data.result.downloadUrl, api: api.name };
            }
            if (data.status === 200 && data.result?.download_url) {
                return { success: true, url: data.result.download_url, api: api.name };
            }
        } catch (error) {
            console.log(`${api.name} failed, trying next...`);
            continue;
        }
    }
    
    return { success: false, error: 'All download APIs failed' };
}

// ==================== MAIN COMMANDS ====================

// YT Search Command
cmd({
    pattern: "yts",
    alias: ["ytsearch", "searchyt"],
    react: "🔍",
    desc: "Search YouTube with smart ranking",
    category: "search",
    use: ".yts <query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a search query!\n\n*Example:* .yts shape of you");
        
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        const search = await yts(q);
        if (!search.videos.length) return await reply("❌ No results found!");
        
        // Calculate relevance scores and sort
        const rankedVideos = search.videos
            .slice(0, 10)
            .map(video => ({
                ...video,
                relevanceScore: calculateRelevance(video, q)
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        let message = `🔎 *YOUTUBE SEARCH RESULTS*\n\n`;
        message += `📝 Query: *${q}*\n`;
        message += `✨ Showing top ${rankedVideos.length} results (ranked by relevance)\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━\n\n`;
        
        rankedVideos.forEach((video, index) => {
            const badge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▫️';
            message += `${badge} *${index + 1}. ${video.title}*\n`;
            message += `👤 ${video.author.name}${video.author.verified ? ' ✓' : ''}\n`;
            message += `⏱️ ${video.timestamp} | 👁️ ${formatViews(video.views)}\n`;
            message += `🔗 ${video.url}\n\n`;
        });
        
        message += `━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📥 *To download:*\n`;
        message += `• Audio: *.ytmp3 <number>*\n`;
        message += `• Video: *.ytmp4 <number>*\n`;
        message += `• Direct: *.yt <number>*\n\n`;
        message += `*Example:* .ytmp3 1\n\n`;
        message += `${config.FOOTER || '© Powered by SANU-MD'}`;
        
        // Store search results temporarily
        if (!global.ytSearchCache) global.ytSearchCache = {};
        global.ytSearchCache[from] = {
            results: rankedVideos,
            timestamp: Date.now(),
            query: q
        };
        
        await conn.sendMessage(from, { 
            text: message,
            contextInfo: {
                externalAdReply: {
                    title: rankedVideos[0].title,
                    body: `${rankedVideos[0].author.name} • ${rankedVideos[0].timestamp}`,
                    thumbnail: await getBuffer(rankedVideos[0].thumbnail),
                    mediaType: 1,
                    sourceUrl: rankedVideos[0].url
                }
            }
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Error: ${error.message}`);
    }
});

// Direct YT Download (Interactive)
cmd({
    pattern: "yt",
    alias: ["ytdl", "youtube"],
    react: "📥",
    desc: "Download from YouTube with options",
    category: "download",
    use: ".yt <url or number or query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide:\n• YouTube URL\n• Search number (after .yts)\n• Search query\n\n*Examples:*\n.yt https://youtu.be/xxx\n.yt 1\n.yt shape of you");
        
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        let videoData;
        
        // Check if input is a number (from search results)
        if (!isNaN(q) && global.ytSearchCache?.[from]) {
            const index = parseInt(q) - 1;
            const cache = global.ytSearchCache[from];
            
            // Check if cache is still valid (5 minutes)
            if (Date.now() - cache.timestamp > 300000) {
                return await reply("❌ Search results expired! Please search again using .yts");
            }
            
            if (index < 0 || index >= cache.results.length) {
                return await reply(`❌ Invalid number! Choose between 1-${cache.results.length}`);
            }
            
            videoData = cache.results[index];
        }
        // Check if input is a URL
        else if (q.match(/(youtube\.com|youtu\.be)/)) {
            const videoId = getYouTubeID(q);
            if (!videoId) return await reply("❌ Invalid YouTube URL!");
            
            const search = await yts({ videoId });
            videoData = search;
        }
        // Otherwise, search YouTube
        else {
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            videoData = search.videos[0];
        }
        
        const { url, title, thumbnail, timestamp, views, author, ago } = videoData;
        
        let infoMsg = `🎬 *YOUTUBE DOWNLOADER*\n\n`;
        infoMsg += `📌 *Title:* ${title}\n`;
        infoMsg += `👤 *Channel:* ${author.name}${author.verified ? ' ✓' : ''}\n`;
        infoMsg += `⏱️ *Duration:* ${timestamp}\n`;
        infoMsg += `👁️ *Views:* ${formatViews(views)}\n`;
        infoMsg += `📅 *Uploaded:* ${ago}\n`;
        infoMsg += `🔗 *URL:* ${url}\n\n`;
        infoMsg += `━━━━━━━━━━━━━━━━━━━\n\n`;
        infoMsg += `📥 *Reply with your choice:*\n\n`;
        infoMsg += `1️⃣ • Audio (MP3) 🎵\n`;
        infoMsg += `2️⃣ • Video (MP4) 🎥\n`;
        infoMsg += `3️⃣ • Audio Document 📁\n`;
        infoMsg += `4️⃣ • Video Document 📁\n\n`;
        infoMsg += `${config.FOOTER || '© Powered by SANU-MD'}`;
        
        const sentMsg = await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: infoMsg
        }, { quoted: mek });
        
        const messageID = sentMsg.key.id;
        
        // Listen for user reply
        const listener = async (messageUpdate) => {
            try {
                const msg = messageUpdate.messages[0];
                if (!msg.message) return;
                
                const userReply = msg.message.conversation || msg.message.extendedTextMessage?.text;
                const isReply = msg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                
                if (!isReply) return;
                
                const choice = userReply.trim();
                
                if (!['1', '2', '3', '4'].includes(choice)) {
                    return await reply("❌ Invalid choice! Reply with 1, 2, 3, or 4");
                }
                
                // Remove listener after first valid response
                conn.ev.off('messages.upsert', listener);
                
                const processingMsg = await conn.sendMessage(from, { 
                    text: "⏳ Processing your download... Please wait" 
                }, { quoted: mek });
                
                let downloadType = ['1', '3'].includes(choice) ? 'mp3' : 'mp4';
                const result = await downloadMedia(url, downloadType);
                
                if (!result.success) {
                    return await conn.sendMessage(from, {
                        text: `❌ Download failed: ${result.error}`,
                        edit: processingMsg.key
                    });
                }
                
                await conn.sendMessage(from, {
                    text: `⬆️ Uploading ${downloadType.toUpperCase()}... (${result.api})`,
                    edit: processingMsg.key
                });
                
                let mediaMsg;
                
                if (choice === '1') {
                    // Audio file
                    mediaMsg = await conn.sendMessage(from, {
                        audio: { url: result.url },
                        mimetype: 'audio/mpeg',
                        fileName: `${title}.mp3`,
                        contextInfo: {
                            externalAdReply: {
                                title: title,
                                body: author.name,
                                thumbnail: await getBuffer(thumbnail),
                                mediaType: 1,
                                sourceUrl: url
                            }
                        }
                    }, { quoted: mek });
                    
                } else if (choice === '2') {
                    // Video file
                    mediaMsg = await conn.sendMessage(from, {
                        video: { url: result.url },
                        mimetype: 'video/mp4',
                        caption: `🎬 *${title}*\n\n👤 ${author.name}\n⏱️ ${timestamp}\n\n${config.FOOTER || '© Powered by SENU-MD'}`
                    }, { quoted: mek });
                    
                } else if (choice === '3') {
                    // Audio document
                    mediaMsg = await conn.sendMessage(from, {
                        document: { url: result.url },
                        mimetype: 'audio/mpeg',
                        fileName: `${title}.mp3`,
                        caption: `🎵 *${title}*\n\n👤 ${author.name}`
                    }, { quoted: mek });
                    
                } else if (choice === '4') {
                    // Video document
                    mediaMsg = await conn.sendMessage(from, {
                        document: { url: result.url },
                        mimetype: 'video/mp4',
                        fileName: `${title}.mp4`,
                        caption: `🎬 *${title}*\n\n👤 ${author.name}`
                    }, { quoted: mek });
                }
                
                await conn.sendMessage(from, {
                    text: '✅ Download completed successfully!',
                    edit: processingMsg.key
                });
                
            } catch (error) {
                console.error(error);
                await reply(`❌ Error: ${error.message}`);
            }
        };
        
        conn.ev.on('messages.upsert', listener);
        
        // Auto-remove listener after 2 minutes
        setTimeout(() => {
            conn.ev.off('messages.upsert', listener);
        }, 120000);
        
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Error: ${error.message}`);
    }
});

// Quick MP3 Download
cmd({
    pattern: "ytmp3",
    alias: ["song", "audio", "mp3"],
    react: "🎵",
    desc: "Quick download MP3 from YouTube",
    category: "download",
    use: ".ytmp3 <url or number or query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide:\n• YouTube URL\n• Search number\n• Search query");
        
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        let videoData;
        
        if (!isNaN(q) && global.ytSearchCache?.[from]) {
            const index = parseInt(q) - 1;
            const cache = global.ytSearchCache[from];
            
            if (Date.now() - cache.timestamp > 300000) {
                return await reply("❌ Search results expired! Use .yts first");
            }
            
            if (index < 0 || index >= cache.results.length) {
                return await reply(`❌ Invalid number! Choose 1-${cache.results.length}`);
            }
            
            videoData = cache.results[index];
        } else if (q.match(/(youtube\.com|youtu\.be)/)) {
            const videoId = getYouTubeID(q);
            const search = await yts({ videoId });
            videoData = search;
        } else {
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            videoData = search.videos[0];
        }
        
        const { url, title, thumbnail, author } = videoData;
        
        await reply(`⏳ Downloading: *${title}*`);
        
        const result = await downloadMedia(url, 'mp3');
        
        if (!result.success) {
            return await reply(`❌ Download failed: ${result.error}`);
        }
        
        await conn.sendMessage(from, {
            audio: { url: result.url },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: author.name,
                    thumbnail: await getBuffer(thumbnail),
                    mediaType: 1,
                    sourceUrl: url
                }
            }
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Error: ${error.message}`);
    }
});

// Quick MP4 Download
cmd({
    pattern: "ytmp4",
    alias: ["video", "mp4"],
    react: "🎥",
    desc: "Quick download MP4 from YouTube",
    category: "download",
    use: ".ytmp4 <url or number or query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide:\n• YouTube URL\n• Search number\n• Search query");
        
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        let videoData;
        
        if (!isNaN(q) && global.ytSearchCache?.[from]) {
            const index = parseInt(q) - 1;
            const cache = global.ytSearchCache[from];
            
            if (Date.now() - cache.timestamp > 300000) {
                return await reply("❌ Search results expired! Use .yts first");
            }
            
            if (index < 0 || index >= cache.results.length) {
                return await reply(`❌ Invalid number! Choose 1-${cache.results.length}`);
            }
            
            videoData = cache.results[index];
        } else if (q.match(/(youtube\.com|youtu\.be)/)) {
            const videoId = getYouTubeID(q);
            const search = await yts({ videoId });
            videoData = search;
        } else {
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            videoData = search.videos[0];
        }
        
        const { url, title, thumbnail, author, timestamp } = videoData;
        
        await reply(`⏳ Downloading: *${title}*`);
        
        const result = await downloadMedia(url, 'mp4');
        
        if (!result.success) {
            return await reply(`❌ Download failed: ${result.error}`);
        }
        
        await conn.sendMessage(from, {
            video: { url: result.url },
            mimetype: 'video/mp4',
            caption: `🎬 *${title}*\n\n👤 ${author.name}\n⏱️ ${timestamp}\n\n${config.FOOTER || '© Powered by SHNU-MD'}`
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Error: ${error.message}`);
    }
});

// YouTube Channel Info
cmd({
    pattern: "ytchannel",
    alias: ["ytstalk", "ytinfo"],
    desc: "Get YouTube channel information",
    react: "📊",
    category: "search",
    use: ".ytchannel <channel name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a channel username or ID");
        
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        
        const apiUrl = `https://delirius-apiofc.vercel.app/tools/ytstalk?channel=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);
        
        if (!data?.status || !data?.data) {
            return await reply("⚠️ Failed to fetch channel info. Check the username/ID");
        }
        
        const yt = data.data;
        const caption = `╭━━━〔 *YOUTUBE CHANNEL* 〕━━━⊷\n`
            + `┃👤 *Username:* ${yt.username}\n`
            + `┃📊 *Subscribers:* ${yt.subscriber_count}\n`
            + `┃🎥 *Videos:* ${yt.video_count}\n`
            + `┃🔗 *Link:* ${yt.channel}\n`
            + `╰━━━━━━━━━━━━━━━━━⪼\n\n`
            + `${config.FOOTER || '© Powered by SANU-MD'}`;
        
        await conn.sendMessage(from, {
            image: { url: yt.avatar },
            caption: caption
        }, { quoted: mek });
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        
    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ Error: ${error.message}`);
    }
});

// Helper function to get buffer
async function getBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch {
        return Buffer.from('');
    }
}