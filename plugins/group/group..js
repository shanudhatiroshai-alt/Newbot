const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');

/* =========================
   DATABASE MANAGEMENT
========================= */
const dbPath = './database/groupSettings.json';

function loadDB() {
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync('./database', { recursive: true });
        fs.writeFileSync(dbPath, '{}');
    }
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getGroup(jid) {
    const db = loadDB();
    if (!db[jid]) {
        db[jid] = {
            antilink: false,
            antibad: false,
            welcome: true,
            language: 'en',
            warnLimit: 3
        };
        saveDB(db);
    }
    return db[jid];
}

function updateGroup(jid, newData) {
    const db = loadDB();
    db[jid] = { ...getGroup(jid), ...newData };
    saveDB(db);
}

/* =========================
   CONSTANTS
========================= */
const badWords = ['fuck', 'shit', 'bitch', 'asshole', 'sex', 'nude', 'wtf', 'xxx', 'huththa', 'pakaya', 'ponnaya', 'hutto'];
const linkRegex = /(https?:\/\/|chat\.whatsapp\.com)/i;
const warns = {};

/* =========================
   HELPER FUNCTIONS
========================= */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const adminCheck = (isGroup, isAdmin, isBotAdmin) => {
    if (!isGroup) return '❌ This command can only be used in groups.';
    if (!isAdmin) return '❌ Only group admins can use this command.';
    if (!isBotAdmin) return '❌ I need to be an admin to use this command.';
    return null;
};

const ownerCheck = (senderNumber, conn) => {
    const botOwner = conn.user.id.split(":")[0];
    return senderNumber === botOwner;
};

/* =========================
   AUTO-UPDATE GROUP MENU
========================= */
cmd({
    pattern: 'groupmenu',
    alias: ['gmenu', 'ghelp'],
    desc: 'Display all group commands',
    category: 'group',
    react: '📋',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    
    const menu = `
╭━━━━━━━━━━━━━━━━━━╮
│  📋 *GROUP MENU* 📋
╰━━━━━━━━━━━━━━━━━━╯

*👥 MEMBER MANAGEMENT*
├ .add <number> - Add member
├ .remove/@user - Remove member
├ .promote/@user - Make admin
├ .demote/@user - Remove admin
├ .admin - Take admin (owner only)
└ .out <code> - Remove by country code

*📢 GROUP ACTIONS*
├ .mute - Mute group
├ .unmute - Unmute group
├ .lock - Lock group
├ .unlock - Unlock group
├ .leave - Bot leaves group
└ .revoke - Reset group link

*📝 GROUP INFO*
├ .ginfo - Group information
├ .invite - Get group link
├ .jid - Get JID info
├ .admins - List all admins
└ .requestlist - View join requests

*🏷️ TAGGING*
├ .tagall <msg> - Tag all members
├ .tagadmins <msg> - Tag admins
└ .hidetag <msg> - Hidden tag

*⚙️ SETTINGS*
├ .gsettings - View settings
├ .antilink on/off - Toggle antilink
├ .antibad on/off - Toggle bad words
└ .language si/en - Set language

*⚠️ MODERATION*
├ .warn/@user - Warn member
└ .warnreset/@user - Reset warns

*🔄 BATCH ACTIONS*
├ .removemembers - Remove all members
├ .removeadmins - Remove all admins
├ .removeall2 - Remove everyone
├ .acceptall - Accept all requests
└ .rejectall - Reject all requests

*📊 UTILITIES*
├ .poll <Q;opt1,opt2> - Create poll
├ .newgc <name;nums> - Create group
├ .updategname <name> - Update name
├ .updategdesc <desc> - Update desc
└ .expnum - Export contacts

╭━━━━━━━━━━━━━━━━━━╮
│  Powered by SHANU-MD
╰━━━━━━━━━━━━━━━━━━╯
`;
    
    return reply(menu);
});

/* =========================
   MEMBER MANAGEMENT
========================= */

// ADD
cmd({
    pattern: 'add',
    alias: ['a', 'invite'],
    desc: 'Add member to group',
    category: 'group',
    react: '➕',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, args, q, reply, quoted, senderNumber }) => {
    const err = adminCheck(isGroup, ownerCheck(senderNumber, conn), isBotAdmins);
    if (err) return reply(err);

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else if (q && /^\d+$/.test(q)) {
        number = q;
    } else {
        return reply('❌ Please reply to a message, mention a user, or provide a number.');
    }

    const jid = number + '@s.whatsapp.net';
    try {
        await conn.groupParticipantsUpdate(from, [jid], 'add');
        reply(`✅ Successfully added @${number}`, { mentions: [jid] });
    } catch (e) {
        reply('❌ Failed to add member: ' + e.message);
    }
});

// REMOVE
cmd({
    pattern: 'remove',
    alias: ['kick', 'k'],
    desc: 'Remove member from group',
    category: 'group',
    react: '❌',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, q, reply, quoted, senderNumber }) => {
    const err = adminCheck(isGroup, ownerCheck(senderNumber, conn), isBotAdmins);
    if (err) return reply(err);

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply('❌ Please reply to a message or mention a user.');
    }

    const jid = number + '@s.whatsapp.net';
    try {
        await conn.groupParticipantsUpdate(from, [jid], 'remove');
        reply(`✅ Successfully removed @${number}`, { mentions: [jid] });
    } catch (e) {
        reply('❌ Failed to remove member: ' + e.message);
    }
});

// PROMOTE
cmd({
    pattern: 'promote',
    alias: ['p', 'makeadmin'],
    desc: 'Promote member to admin',
    category: 'group',
    react: '⬆️',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, q, reply, quoted }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply('❌ Please reply to a message or mention a user.');
    }

    const jid = number + '@s.whatsapp.net';
    try {
        await conn.groupParticipantsUpdate(from, [jid], 'promote');
        reply(`✅ Successfully promoted @${number}`, { mentions: [jid] });
    } catch (e) {
        reply('❌ Failed to promote member: ' + e.message);
    }
});

// DEMOTE
cmd({
    pattern: 'demote',
    alias: ['d', 'dismiss'],
    desc: 'Demote admin to member',
    category: 'group',
    react: '⬇️',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, q, reply, quoted }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);

    let number;
    if (quoted) {
        number = quoted.sender.split("@")[0];
    } else if (q && q.includes("@")) {
        number = q.replace(/[@\s]/g, '');
    } else {
        return reply('❌ Please reply to a message or mention a user.');
    }

    const jid = number + '@s.whatsapp.net';
    try {
        await conn.groupParticipantsUpdate(from, [jid], 'demote');
        reply(`✅ Successfully demoted @${number}`, { mentions: [jid] });
    } catch (e) {
        reply('❌ Failed to demote member: ' + e.message);
    }
});

/* =========================
   GROUP SETTINGS
========================= */

// MUTE
cmd({
    pattern: 'mute',
    desc: 'Mute group',
    category: 'group',
    react: '🔇',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);
    
    await conn.groupSettingUpdate(from, 'announcement');
    reply('✅ Group has been muted. Only admins can send messages.');
});

// UNMUTE
cmd({
    pattern: 'unmute',
    desc: 'Unmute group',
    category: 'group',
    react: '🔊',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);
    
    await conn.groupSettingUpdate(from, 'not_announcement');
    reply('✅ Group has been unmuted. Everyone can send messages.');
});

// LOCK
cmd({
    pattern: 'lock',
    alias: ['lockgc'],
    desc: 'Lock group settings',
    category: 'group',
    react: '🔒',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);
    
    await conn.groupSettingUpdate(from, 'locked');
    reply('✅ Group has been locked.');
});

// UNLOCK
cmd({
    pattern: 'unlock',
    alias: ['unlockgc'],
    desc: 'Unlock group settings',
    category: 'group',
    react: '🔓',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);
    
    await conn.groupSettingUpdate(from, 'unlocked');
    reply('✅ Group has been unlocked.');
});

/* =========================
   GROUP INFO COMMANDS
========================= */

// GROUP INFO
cmd({
    pattern: 'ginfo',
    alias: ['groupinfo'],
    desc: 'Get group information',
    category: 'group',
    react: '📊',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, reply }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    if (!isAdmins) return reply('❌ Only admins can use this command.');

    try {
        const metadata = await conn.groupMetadata(from);
        const admins = metadata.participants.filter(p => p.admin);
        
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        const info = `
*📊 GROUP INFORMATION*

*Name:* ${metadata.subject}
*Members:* ${metadata.participants.length}
*Admins:* ${admins.length}
*Description:* ${metadata.desc || 'No description'}

*Admins List:*
${admins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n')}
`;

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: info,
            mentions: admins.map(v => v.id)
        }, { quoted: mek });
    } catch (e) {
        reply('❌ Error fetching group info: ' + e.message);
    }
});

// INVITE LINK
cmd({
    pattern: 'invite',
    alias: ['glink', 'grouplink'],
    desc: 'Get group invite link',
    category: 'group',
    react: '🔗',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);

    try {
        const code = await conn.groupInviteCode(from);
        reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}`);
    } catch (e) {
        reply('❌ Failed to get invite link: ' + e.message);
    }
});

// REVOKE LINK
cmd({
    pattern: 'revoke',
    alias: ['resetlink'],
    desc: 'Reset group invite link',
    category: 'group',
    react: '🔄',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);

    try {
        await conn.groupRevokeInvite(from);
        reply('✅ Group invite link has been reset!');
    } catch (e) {
        reply('❌ Failed to reset link: ' + e.message);
    }
});

/* =========================
   TAGGING COMMANDS
========================= */

// TAG ALL
cmd({
    pattern: 'tagall',
    desc: 'Tag all members',
    category: 'group',
    react: '📢',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, participants, body, command, reply, senderNumber }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    
    const botOwner = conn.user.id.split(":")[0];
    if (!isAdmins && senderNumber !== botOwner) {
        return reply('❌ Only admins can use this command.');
    }

    const msg = body.slice(body.indexOf(command) + command.length).trim() || 'Attention Everyone';
    let text = `📢 *${msg}*\n\n`;
    text += participants.map(p => `• @${p.id.split('@')[0]}`).join('\n');

    await conn.sendMessage(from, {
        text,
        mentions: participants.map(p => p.id)
    }, { quoted: mek });
});

// HIDE TAG
cmd({
    pattern: 'hidetag',
    alias: ['tag', 'h'],
    desc: 'Tag all with hidden mentions',
    category: 'group',
    react: '👻',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, participants, q, reply, quoted }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    if (!isAdmins) return reply('❌ Only admins can use this command.');

    const mentions = { mentions: participants.map(u => u.id) };

    if (quoted) {
        const type = quoted.mtype || '';
        
        if (type === 'extendedTextMessage') {
            return await conn.sendMessage(from, {
                text: quoted.text || 'Message',
                ...mentions
            }, { quoted: mek });
        }

        if (['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(type)) {
            try {
                const buffer = await quoted.download?.();
                if (!buffer) return reply('❌ Failed to download media.');

                let content;
                switch (type) {
                    case 'imageMessage':
                        content = { image: buffer, caption: quoted.text || '📷', ...mentions };
                        break;
                    case 'videoMessage':
                        content = { video: buffer, caption: quoted.text || '🎥', ...mentions };
                        break;
                    case 'audioMessage':
                        content = { audio: buffer, mimetype: 'audio/mp4', ...mentions };
                        break;
                    case 'stickerMessage':
                        content = { sticker: buffer, ...mentions };
                        break;
                }
                return await conn.sendMessage(from, content, { quoted: mek });
            } catch (e) {
                return reply('❌ Failed to process media.');
            }
        }
    }

    if (q) {
        await conn.sendMessage(from, { text: q, ...mentions }, { quoted: mek });
    } else {
        reply('❌ Please provide a message or reply to a message.');
    }
});

/* =========================
   WARNING SYSTEM
========================= */

cmd({
    pattern: 'warn',
    desc: 'Warn a user',
    category: 'group',
    react: '⚠️',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, quoted, reply }) => {
    const err = adminCheck(isGroup, isAdmins, isBotAdmins);
    if (err) return reply(err);

    if (!quoted) return reply('❌ Please reply to a message to warn the user.');

    const user = quoted.sender;
    warns[user] = (warns[user] || 0) + 1;
    const gs = getGroup(from);

    if (warns[user] >= gs.warnLimit) {
        warns[user] = 0;
        await conn.groupParticipantsUpdate(from, [user], 'remove');
        return reply('🚫 User kicked (warn limit reached)');
    }

    reply(`⚠️ Warning ${warns[user]}/${gs.warnLimit} for @${user.split('@')[0]}`, {
        mentions: [user]
    });
});

/* =========================
   BATCH OPERATIONS
========================= */

cmd({
    pattern: 'removemembers',
    alias: ['kickall'],
    desc: 'Remove all non-admin members',
    category: 'group',
    react: '🗑️',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, groupMetadata, groupAdmins, reply, senderNumber }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    if (!ownerCheck(senderNumber, conn)) return reply('❌ Only bot owner can use this command.');
    if (!isBotAdmins) return reply('❌ I need to be an admin.');

    const nonAdmins = groupMetadata.participants.filter(m => !groupAdmins.includes(m.id));
    if (nonAdmins.length === 0) return reply('No non-admin members to remove.');

    reply(`Starting to remove ${nonAdmins.length} members...`);

    for (let participant of nonAdmins) {
        try {
            await conn.groupParticipantsUpdate(from, [participant.id], 'remove');
            await sleep(2000);
        } catch (e) {
            console.error(`Failed to remove ${participant.id}`);
        }
    }

    reply('✅ Successfully removed all non-admin members.');
});

/* =========================
   SETTINGS MANAGEMENT
========================= */

cmd({
    pattern: 'gsettings',
    desc: 'View group settings',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, reply }) => {
    if (!isGroup || !isAdmins) return;
    
    const g = getGroup(from);
    const text = `
⚙️ *GROUP SETTINGS*

🔗 AntiLink: ${g.antilink ? 'ON' : 'OFF'}
🤬 AntiBad: ${g.antibad ? 'ON' : 'OFF'}
👋 Welcome: ${g.welcome ? 'ON' : 'OFF'}
🌐 Language: ${g.language}
⚠️ Warn Limit: ${g.warnLimit}
`;

    reply(text);
});

// ANTILINK TOGGLE
cmd({
    pattern: 'antilink',
    desc: 'Toggle antilink',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, reply }) => {
    if (!isGroup || !isAdmins) return;

    const state = args[0] === 'on';
    updateGroup(from, { antilink: state });
    reply(`🔗 AntiLink ${state ? 'ON' : 'OFF'}`);
});

// ANTIBAD TOGGLE
cmd({
    pattern: 'antibad',
    desc: 'Toggle anti bad words',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, reply }) => {
    if (!isGroup || !isAdmins) return;

    const state = args[0] === 'on';
    updateGroup(from, { antibad: state });
    reply(`🤬 AntiBad ${state ? 'ON' : 'OFF'}`);
});

/* =========================
   AUTO MODERATION
========================= */
module.exports.groupMessageHandler = async (m, conn, ctx) => {
    const { from, isGroup, isAdmin, body } = ctx;
    if (!isGroup || isAdmin) return;

    const gs = getGroup(from);

    // Anti-Link
    if (gs.antilink && linkRegex.test(body)) {
        if (!ctx.isBotAdmin) return;
        await conn.sendMessage(from, { delete: m.key });
        return conn.sendMessage(from, { text: '🚫 Links are not allowed!' });
    }

    // Anti-Bad Words
    if (gs.antibad) {
        for (const word of badWords) {
            if (body.toLowerCase().includes(word)) {
                await conn.sendMessage(from, { delete: m.key });
                return conn.sendMessage(from, { text: '🤬 Bad words are not allowed!' });
            }
        }
    }
};

/* =========================
   WELCOME EVENTS
========================= */
module.exports.groupEvent = async (update, conn) => {
    const { id, participants, action } = update;
    const gs = getGroup(id);

    if (!gs.welcome) return;

    for (const user of participants) {
        if (action === 'add') {
            await conn.sendMessage(id, {
                text: `👋 Welcome @${user.split('@')[0]}! 🎉`,
                mentions: [user]
            });
        } else if (action === 'remove') {
            await conn.sendMessage(id, {
                text: `👋 Goodbye @${user.split('@')[0]} 💔`,
                mentions: [user]
            });
        }
    }
};