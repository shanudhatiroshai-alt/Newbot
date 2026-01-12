const spamMap = new Map();

module.exports = async (conn, m, groupSettings) => {
    if (!groupSettings.antispam) return;

    const jid = m.sender;
    const now = Date.now();

    if (!spamMap.has(jid)) {
        spamMap.set(jid, []);
    }

    const msgs = spamMap.get(jid);
    msgs.push(now);

    const recent = msgs.filter(t => now - t < 7000);
    spamMap.set(jid, recent);

    if (recent.length >= 6) {
        await conn.sendMessage(m.key.remoteJid, {
            text: `⚠️ *@${jid.split("@")[0]}* spam detected`,
            mentions: [jid]
        });
    }
};