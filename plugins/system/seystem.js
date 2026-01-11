const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { sleep } = require('../lib/functions');
const { exec } = require('child_process');

// ==================== UPTIME COMMAND ====================
cmd({
    pattern: "uptime",
    alias: ["runtime", "up"],
    desc: "Show bot uptime with stylish formats",
    category: "main",
    react: "⏱️",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const uptime = runtime(process.uptime());
        const startTime = new Date(Date.now() - process.uptime() * 1000);
        
        const styles = [
            // Style 1: Classic Box
            `╭───『 UPTIME 』───⳹
│
│ ⏱️ ${uptime}
│
│ 🚀 Started: ${startTime.toLocaleString()}
│
╰────────────────⳹
${config.DESCRIPTION}`,

            // Style 2: Minimalist
            `•——[ UPTIME ]——•
  │
  ├─ ⏳ ${uptime}
  ├─ 🕒 Since: ${startTime.toLocaleTimeString()}
  │
  •——[ ${config.BOT_NAME} ]——•`,

            // Style 3: Fancy Borders
            `▄▀▄▀▄ BOT UPTIME ▄▀▄▀▄

  ♢ Running: ${uptime}
  ♢ Since: ${startTime.toLocaleDateString()}
  
  ${config.DESCRIPTION}`,

            // Style 4: Code Style
            `┌──────────────────────┐
│  ⚡ UPTIME STATUS ⚡  │
├──────────────────────┤
│ • Time: ${uptime}
│ • Started: ${startTime.toLocaleString()}
│ • Version: 4.0.0
└──────────────────────┘`,

            // Style 5: Modern Blocks
            `▰▰▰▰▰ UPTIME ▰▰▰▰▰

  ⏳ ${uptime}
  🕰️ ${startTime.toLocaleString()}
  
  ${config.DESCRIPTION}`,

            // Style 6: Retro Terminal
            `╔══════════════════════╗
║   ${config.BOT_NAME} UPTIME    ║
╠══════════════════════╣
║ > RUNTIME: ${uptime}
║ > SINCE: ${startTime.toLocaleString()}
╚══════════════════════╝`,

            // Style 7: Elegant
            `┌───────────────┐
│  ⏱️  UPTIME  │
└───────────────┘
│
│ ${uptime}
│
│ Since ${startTime.toLocaleDateString()}
│
┌───────────────┐
│  ${config.BOT_NAME}  │
└───────────────┘`,

            // Style 8: Social Media Style
            `⏱️ *Uptime Report* ⏱️

🟢 Online for: ${uptime}
📅 Since: ${startTime.toLocaleString()}

${config.DESCRIPTION}`,

            // Style 9: Fancy List
            `╔♫═⏱️═♫══════════╗
   ${config.BOT_NAME} UPTIME
╚♫═⏱️═♫══════════╝

•・゜゜・* ✧  *・゜゜・•
 ✧ ${uptime}
 ✧ Since ${startTime.toLocaleDateString()}
•・゜゜・* ✧  *・゜゜・•`,

            // Style 10: Professional
            `┏━━━━━━━━━━━━━━━━━━┓
┃  UPTIME ANALYSIS  ┃
┗━━━━━━━━━━━━━━━━━━┛

◈ Duration: ${uptime}
◈ Start Time: ${startTime.toLocaleString()}
◈ Stability: 100%
◈ Version:  4.0.0

${config.DESCRIPTION}`
        ];

        const selectedStyle = styles[Math.floor(Math.random() * styles.length)];

        await conn.sendMessage(from, { 
            text: selectedStyle,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363388320701164@newsletter',
                    newsletterName: config.OWNER_NAME || 'JesterTechX',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Uptime Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== GET COMMAND ====================
cmd({
    pattern: "get",
    alias: ["source", "js"],
    desc: "Fetch the full source code of a command",
    category: "owner",
    react: "📜",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, isOwner }) => {
    try {
        if (!isOwner) return reply("❌ You don't have permission to use this command!");
        if (!args[0]) return reply("❌ Please provide a command name. Example: `.get alive`");

        const commandName = args[0].toLowerCase();
        const commandData = commands.find(cmd => 
            cmd.pattern === commandName || (cmd.alias && cmd.alias.includes(commandName))
        );

        if (!commandData) return reply("❌ Command not found!");

        const commandPath = commandData.filename;
        const fullCode = fs.readFileSync(commandPath, 'utf-8');

        let truncatedCode = fullCode;
        if (truncatedCode.length > 4000) {
            truncatedCode = fullCode.substring(0, 4000) + "\n\n// Code too long, sending full file 📂";
        }

        const formattedCode = `⬤───〔 *📜 Command Source* 〕───⬤
\`\`\`js
${truncatedCode}
\`\`\`
╰──────────⊷  
⚡ Full file sent below 📂  
Powered By *JesterTechX* 💜`;

        await conn.sendMessage(from, { 
            image: { url: `https://files.catbox.moe/7zfdcq.jpg` },
            caption: formattedCode,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363388320701164@newsletter',
                    newsletterName: 'JesterTechX',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        const fileName = `${commandName}.js`;
        const tempPath = path.join(__dirname, fileName);
        fs.writeFileSync(tempPath, fullCode);

        await conn.sendMessage(from, { 
            document: fs.readFileSync(tempPath),
            mimetype: 'text/javascript',
            fileName: fileName
        }, { quoted: mek });

        fs.unlinkSync(tempPath);
        
        // Log the command usage
        await sendLog(conn, "GET_COMMAND", `Source code requested for: ${commandName}`, m.sender);

    } catch (e) {
        console.error("Error in .get command:", e);
        await sendLog(conn, "ERROR", `Get command failed: ${e.message}`, m.sender);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== SYSTEM STATUS COMMAND ====================
cmd({
    pattern: "system",
    alias: ["sys", "info"],
    desc: "Show detailed system information",
    category: "owner",
    react: "💻",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only the bot owner can use this command.");
        }

        const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const usedMem = (totalMem - freeMem).toFixed(2);
        const cpuModel = os.cpus()[0].model;
        const cpuCores = os.cpus().length;
        const platform = os.platform();
        const architecture = os.arch();
        const nodeVersion = process.version;
        const uptimeHours = (process.uptime() / 3600).toFixed(2);

        const sysInfo = `
╭───〔 *💻 SYSTEM STATUS* 〕───⳹
│
│ 🖥️ *SYSTEM INFO*
│ ├─ Platform: ${platform}
│ ├─ Architecture: ${architecture}
│ ├─ Hostname: ${os.hostname()}
│ └─ Node Version: ${nodeVersion}
│
│ 🧠 *CPU INFO*
│ ├─ Model: ${cpuModel}
│ ├─ Cores: ${cpuCores}
│ └─ Load: ${os.loadavg()[0].toFixed(2)}%
│
│ 💾 *MEMORY INFO*
│ ├─ Total: ${totalMem} GB
│ ├─ Used: ${usedMem} GB
│ ├─ Free: ${freeMem} GB
│ └─ Bot Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│
│ ⏱️ *UPTIME INFO*
│ ├─ System: ${runtime(os.uptime())}
│ ├─ Bot: ${runtime(process.uptime())}
│ └─ Hours: ${uptimeHours}h
│
│ 📊 *BOT STATS*
│ ├─ Commands: ${commands.length}
│ ├─ Logs: ${logHistory.length}
│ └─ Mode: ${config.MODE}
│
╰────────────────⳹
> Last checked: ${new Date().toLocaleString()}`;

        await conn.sendMessage(from, {
            text: sysInfo,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

        await sendLog(conn, "SYSTEM_CHECK", "System status checked", m.sender);

    } catch (e) {
        console.error("System Command Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== ALIVE COMMAND ====================
cmd({
    pattern: "alive",
    alias: ["status", "online", "a"],
    desc: "Check bot is alive or not",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const status = `
╭───〔 *🤖 ${config.BOT_NAME} STATUS* 〕───◉
│✨ *Bot is Active & Online!*
│
│🧠 *Owner:* ${config.OWNER_NAME}
│⚡ *Version:* 4.0.0
│📝 *Prefix:* [${config.PREFIX}]
│📳 *Mode:* [${config.MODE}]
│💾 *RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${(os.totalmem() / 1024 / 1024).toFixed(2)}MB
│🖥️ *Host:* ${os.hostname()}
│⌛ *Uptime:* ${runtime(process.uptime())}
╰────────────────────◉
> ${config.DESCRIPTION}`;

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL },
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363388320701164@newsletter',
                    newsletterName: 'JesterTechX',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== PING COMMAND ====================
cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const start = new Date().getTime();

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

        const reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        await conn.sendMessage(from, {
            react: { text: textEmoji, key: mek.key }
        });

        const end = new Date().getTime();
        const responseTime = (end - start) / 1000;

        const text = `> *SENU-MD SPEED: ${responseTime.toFixed(2)}ms ${reactionEmoji}*`;

        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363388320701164@newsletter',
                    newsletterName: "JesterTechX",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});

// ==================== PING2 COMMAND ====================
cmd({
    pattern: "ping2",
    desc: "Check bot's response time with loading animation.",
    category: "main",
    react: "🍂",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();
        const { key } = await conn.sendMessage(from, { text: '*PINGING...*' });
        const endTime = Date.now();
        const ping = endTime - startTime;
    
        const loadingStages = [
            'ʟᴏᴀᴅɪɴɢ 《 ▭▭▭▭▭▭▭▭▭▭ 》0%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▭▭▭▭▭▭▭▭▭ 》10%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▭▭▭▭▭▭▭▭ 》20%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▭▭▭▭▭▭▭ 》30%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▭▭▭▭▭▭ 》40%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▬▭▭▭▭▭ 》50%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▬▬▭▭▭▭ 》60%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▬▬▬▭▭▭ 》70%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▬▬▬▬▭▭ 》80%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▬▬▬▬▬▭ 》90%',
            'ʟᴏᴀᴅɪɴɢ 《 ▬▬▬▬▬▬▬▬▬▬ 》100%',
            `𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐒𝐩𝐞𝐞𝐝 ${ping} 𝐦𝐬`
        ];
    
        for (let i = 0; i < loadingStages.length; i++) {
            await conn.relayMessage(from, {
                protocolMessage: {
                    key: key,
                    type: 14,
                    editedMessage: {
                        conversation: loadingStages[i]
                    }
                }
            }, {});
        }
    } catch (e) {
        console.error(e);
        reply(`${e}`);
    }
});

// ==================== REPO COMMAND ====================
cmd({
    pattern: "repo",
    alias: ["sc", "script", "info"],
    desc: "Fetch information about a GitHub repository.",
    react: "📂",
    category: "info",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    const githubRepoURL = 'https://github.com/Gehansasl/JESTER-MD';

    try {
        const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
        
        if (!response.ok) {
            throw new Error(`GitHub API request failed with status ${response.status}`);
        }

        const repoData = await response.json();

        const formattedInfo = `*BOT NAME:*\n> ${repoData.name}\n\n*OWNER NAME:*\n> ${repoData.owner.login}\n\n*STARS:*\n> ${repoData.stargazers_count}\n\n*FORKS:*\n> ${repoData.forks_count}\n\n*GITHUB LINK:*\n> ${repoData.html_url}\n\n*DESCRIPTION:*\n> ${repoData.description || 'No description'}\n\n*Don't Forget To Star and Fork Repository*\n\n> *© Powered By JesterTechX 🖤*`;

        await conn.sendMessage(from, {
            image: { url: `https://i.ibb.co/bjPrbF84/3174.jpg` },
            caption: formattedInfo,
            contextInfo: { 
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363388320701164@newsletter',
                    newsletterName: 'JesterTechX',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        const audioPath = path.join(__dirname, '../assets/menu.m4a');
        if (fs.existsSync(audioPath)) {
            await conn.sendMessage(from, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mp4',
                ptt: true,
                contextInfo: { 
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363388320701164@newsletter',
                        newsletterName: 'JesterTechX',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
        }

    } catch (error) {
        console.error("Error in repo command:", error);
        reply("Sorry, something went wrong while fetching the repository information. Please try again later.");
    }
});

// ==================== LOG FUNCTION ====================
const logHistory = [];
const MAX_LOGS = 50;

const sendLog = async (conn, type, data, sender = null) => {
    try {
        const LOG_JID = process.env.LOG_CHANNEL || config.LOG_CHANNEL;
        const timestamp = new Date().toLocaleString();
        
        let text = `📢 *BOT LOG*\n\n`;
        text += `🔹 Type: ${type}\n`;
        text += `🔹 Info: ${data}\n`;
        if (sender) text += `👤 User: ${sender}\n`;
        text += `🕒 ${timestamp}`;

        // Save to history
        logHistory.unshift({ type, data, sender, timestamp });
        if (logHistory.length > MAX_LOGS) logHistory.pop();

        // Send to channel if configured
        if (LOG_JID) {
            await conn.sendMessage(LOG_JID, { text });
        }
    } catch (e) {
        console.error("Log Error:", e);
    }
};

// ==================== LOGS COMMAND ====================
cmd({
    pattern: "logs",
    alias: ["log", "history"],
    desc: "View recent bot logs",
    category: "owner",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only the bot owner can use this command.");
        }

        const limit = parseInt(args[0]) || 10;
        const logsToShow = logHistory.slice(0, Math.min(limit, MAX_LOGS));

        if (logsToShow.length === 0) {
            return reply("📋 No logs available yet.");
        }

        let logText = `╭───〔 *📋 BOT LOGS* 〕───⳹\n`;
        logText += `│ Total Logs: ${logHistory.length}\n`;
        logText += `│ Showing: ${logsToShow.length}\n`;
        logText += `╰────────────────⳹\n\n`;

        logsToShow.forEach((log, index) => {
            logText += `┌─ Log #${index + 1}\n`;
            logText += `├─ 🔹 Type: ${log.type}\n`;
            logText += `├─ 📝 Info: ${log.data}\n`;
            if (log.sender) logText += `├─ 👤 User: ${log.sender}\n`;
            logText += `└─ 🕒 Time: ${log.timestamp}\n\n`;
        });

        logText += `> Use .logs <number> to see more logs`;

        await conn.sendMessage(from, {
            text: logText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Logs Command Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== CLEAR LOGS COMMAND ====================
cmd({
    pattern: "clearlogs",
    alias: ["clearlog"],
    desc: "Clear all bot logs",
    category: "owner",
    react: "🗑️",
    filename: __filename
},
async (conn, mek, m, { reply, isCreator }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only the bot owner can use this command.");
        }

        const count = logHistory.length;
        logHistory.length = 0;

        await reply(`✅ Cleared ${count} log entries.`);
        await sendLog(conn, "SYSTEM", "Log history cleared", m.sender);

    } catch (e) {
        console.error("Clear Logs Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== RESTART COMMAND ====================
cmd({  
    pattern: "restart",  
    desc: "Restart the bot",  
    category: "owner",
    react: "🔄",
    filename: __filename  
},  
async (conn, mek, m, { reply, isCreator, from }) => {  
    try {  
        if (!isCreator) {  
            return reply("❌ Only the bot owner can use this command.");  
        }  

        // Send log before restart
        await sendLog(conn, "RESTART", `Bot restart initiated by ${m.sender}`, m.sender);

        await reply("🔄 Restarting bot...");  
        await sleep(1500);  
        
        // Try pm2 restart, fallback to process exit
        exec("pm2 restart all", (error) => {
            if (error) {
                console.log("PM2 not available, using process exit");
                process.exit(1);
            }
        });
    } catch (e) {  
        console.error(e);
        await sendLog(conn, "ERROR", `Restart failed: ${e.message}`, m.sender);
        reply(`❌ Error: ${e.message}`);  
    }  
});

// ==================== BROADCAST COMMAND ====================
cmd({
    pattern: "broadcast",
    alias: ["bc"],
    desc: "Broadcast message to log channel",
    category: "owner",
    react: "📢",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args, quoted }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only the bot owner can use this command.");
        }

        const LOG_JID = process.env.LOG_CHANNEL || config.LOG_CHANNEL;
        if (!LOG_JID) {
            return reply("❌ LOG_CHANNEL not configured in environment variables.");
        }

        let message = args.join(" ");
        
        // If replying to a message, use that
        if (quoted && !message) {
            message = quoted.text || "Forwarded message";
        }

        if (!message) {
            return reply("❌ Please provide a message to broadcast.\nUsage: .broadcast <message>");
        }

        const broadcastText = `
╭───〔 *📢 BROADCAST* 〕───⳹
│
│ ${message}
│
╰────────────────⳹
🕒 ${new Date().toLocaleString()}
👤 Sent by: ${config.OWNER_NAME}`;

        await conn.sendMessage(LOG_JID, { text: broadcastText });
        await reply("✅ Message broadcasted successfully!");
        await sendLog(conn, "BROADCAST", message, m.sender);

    } catch (e) {
        console.error("Broadcast Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== SET LOG CHANNEL COMMAND ====================
cmd({
    pattern: "setlog",
    alias: ["logchannel"],
    desc: "Set the log channel JID",
    category: "owner",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isCreator, args }) => {
    try {
        if (!isCreator) {
            return reply("❌ Only the bot owner can use this command.");
        }

        if (!args[0]) {
            const currentLog = process.env.LOG_CHANNEL || config.LOG_CHANNEL || "Not set";
            return reply(`📋 *Current Log Channel*\n\n${currentLog}\n\nUsage: .setlog <JID>\nExample: .setlog 120363388320701164@newsletter`);
        }

        const newLogJID = args[0];
        
        // Test the log channel
        try {
            await conn.sendMessage(newLogJID, { 
                text: `✅ *Log Channel Configured*\n\nThis channel will now receive bot logs.\n🕒 ${new Date().toLocaleString()}` 
            });
            
            process.env.LOG_CHANNEL = newLogJID;
            
            await reply(`✅ Log channel set successfully!\n\nJID: ${newLogJID}\n\nNote: This is temporary. Add to .env for permanent:\nLOG_CHANNEL=${newLogJID}`);
            
            await sendLog(conn, "CONFIG", `Log channel updated to: ${newLogJID}`, m.sender);
            
        } catch (testError) {
            return reply(`❌ Failed to send test message to the channel. Please check the JID.\n\nError: ${testError.message}`);
        }

    } catch (e) {
        console.error("Set Log Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});

// ==================== SEND COMMAND ====================
cmd({
    pattern: "send",
    alias: ["sendme", "save"],
    react: "📤",
    desc: "Forwards quoted message back to user",
    category: "utility",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        if (!m.quoted) {
            return await conn.sendMessage(from, {
                text: "*🍁 Please reply to a message!*"
            }, { quoted: mek });
        }

        const buffer = await m.quoted.download();
        const mtype = m.quoted.mtype;
        const options = { quoted: mek };

        let messageContent = {};
        switch (mtype) {
            case "imageMessage":
                messageContent = {
                    image: buffer,
                    caption: m.quoted.text || '',
                    mimetype: m.quoted.mimetype || "image/jpeg"
                };
                break;
            case "videoMessage":
                messageContent = {
                    video: buffer,
                    caption: m.quoted.text || '',
                    mimetype: m.quoted.mimetype || "video/mp4"
                };
                break;
            case "audioMessage":
                messageContent = {
                    audio: buffer,
                    mimetype: "audio/mp4",
                    ptt: m.quoted.ptt || false
                };
                break;
            default:
                return await conn.sendMessage(from, {
                    text: "❌ Only image, video, and audio messages are supported"
                }, { quoted: mek });
        }

        await conn.sendMessage(from, messageContent, options);
    } catch (error) {
        console.error("Forward Error:", error);
        await conn.sendMessage(from, {
            text: "❌ Error forwarding message:\n" + error.message
        }, { quoted: mek });
    }
});

// ==================== MENU COMMAND ====================
cmd({
    pattern: "menu",
    desc: "Show auto image menu",
    category: "menu",
    react: "🧾",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const grouped = {};
        for (const c of commands) {
            if (c.dontAddCommandList) continue;
            if (!grouped[c.category]) grouped[c.category] = [];
            grouped[c.category].push(c.pattern);
        }

        let menuText = `
╭━━━〔 *${config.BOT_NAME}* 〕━━━┈⊷
│ 👑 *Owner*   : *${config.OWNER_NAME}*
│ ⚡ *Mode*    : *${config.MODE}*
│ 🧩 *Commands*: *${commands.length}*
│ 🧠 *Prefix*  : *${config.PREFIX}*
╰━━━━━━━━━━━━━━━┈⊷

> *🤖 BOT INFORMATION*
> This bot is fully automatic & plugin-based.
> Menu updates when new plugins are added.

\`\`\`
👨‍💻 Developer : ${config.OWNER_NAME}
🛠️ Base       : Baileys MD
⚙️ Language   : Node.js
🚀 Version    : 5.0.0
\`\`\`

*📂 COMMAND CATEGORIES*
`;

        for (const category in grouped) {
            menuText += `
╭───〔 *${category.toUpperCase()}* 〕
`;
            grouped[category].forEach(cmd => {
                menuText += `│ ➤ *${config.PREFIX}${cmd}*\n`;
            });
            menuText += `╰──────────────\n`;
        }

        menuText += `
> *Made with ❤️ by ${config.OWNER_NAME}*
> ${config.DESCRIPTION}
`;

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL },
            caption: menuText,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

        const audioPath = path.join(__dirname, '../assets/menu.m4a');
        if (fs.existsSync(audioPath)) {
            await conn.sendMessage(from, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: mek });
        }

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e}`);
    }
});

console.log("✅ All commands loaded successfully!");