const config = require('../config')
const { cmd } = require('../command')

cmd({
    pattern: "menu",
    alias: ["help", "commands"],
    react: "📜",
    desc: "Get bot command list",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const events = require('../command')
        
        // Group commands by category
        const categories = {}
        
        events.commands.forEach(cmd => {
            // Skip commands without pattern (body/text/image listeners)
            if (!cmd.pattern) return
            
            const category = cmd.category || 'other'
            if (!categories[category]) {
                categories[category] = []
            }
            categories[category].push(cmd)
        })
        
        // Build menu text
        let menuText = `╭━━━〔 *${config.BOT_NAME || 'SHANU-MD'}* 〕━━━┈⊷
┃ ◈ *Owner:* ${config.OWNER_NAME || 'Shanu'}
┃ ◈ *Prefix:* ${config.PREFIX || '.'}
┃ ◈ *Mode:* ${config.MODE || 'public'}
┃ ◈ *Commands:* ${events.commands.filter(c => c.pattern).length}
╰━━━━━━━━━━━━━━━━━┈⊷\n\n`

        // Category emojis
        const categoryEmojis = {
            main: '🏠',
            download: '⬇️',
            group: '👥',
            owner: '👑',
            search: '🔍',
            fun: '🎮',
            convert: '🔄',
            ai: '🤖',
            tools: '🛠️',
            other: '📦'
        }

        // Sort categories alphabetically
        const sortedCategories = Object.keys(categories).sort()
        
        sortedCategories.forEach(category => {
            const emoji = categoryEmojis[category.toLowerCase()] || '📌'
            const categoryName = category.toUpperCase()
            
            menuText += `╭──〔 ${emoji} *${categoryName}* 〕\n`
            
            categories[category].forEach(cmd => {
                const cmdName = cmd.pattern
                const cmdDesc = cmd.desc || 'No description'
                const aliases = cmd.alias ? ` (${cmd.alias.join(', ')})` : ''
                
                menuText += `│ ◈ ${config.PREFIX}${cmdName}${aliases}\n`
                menuText += `│ ↳ _${cmdDesc}_\n`
            })
            
            menuText += `╰─────────────────┈⊷\n\n`
        })
        
        menuText += `╭━━━━━━━━━━━━━━━━━┈⊷
┃ ◈ Type ${config.PREFIX}help <command>
┃    for detailed info
╰━━━━━━━━━━━━━━━━━┈⊷\n\n`
        menuText += `*© ${config.BOT_NAME || 'SHANU-MD'} | Powered by ${config.OWNER_NAME || 'Shanu'}*`
        
        // Send menu with image
        await conn.sendMessage(from, {
            image: { url: config.MENU_IMG || 'https://i.postimg.cc/8CqG2Bm2/FB-IMG-1760348539551.jpg' },
            caption: menuText
        }, { quoted: mek })
        
    } catch (e) {
        console.log(e)
        reply(`Error: ${e.message}`)
    }
})

// Detailed command help
cmd({
    pattern: "help",
    react: "ℹ️",
    desc: "Get detailed command information",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) {
            return reply(`Please specify a command!\nExample: ${config.PREFIX}help song`)
        }
        
        const events = require('../command')
        const cmdName = args[0].toLowerCase()
        
        // Find the command
        const cmd = events.commands.find((cmd) => 
            cmd.pattern === cmdName || (cmd.alias && cmd.alias.includes(cmdName))
        )
        
        if (!cmd) {
            return reply(`Command "${cmdName}" not found!`)
        }
        
        let helpText = `╭━━━〔 *COMMAND INFO* 〕━━━┈⊷\n`
        helpText += `┃ ◈ *Command:* ${cmd.pattern}\n`
        if (cmd.alias && cmd.alias.length > 0) {
            helpText += `┃ ◈ *Aliases:* ${cmd.alias.join(', ')}\n`
        }
        helpText += `┃ ◈ *Category:* ${cmd.category || 'other'}\n`
        helpText += `┃ ◈ *Description:* ${cmd.desc || 'No description'}\n`
        if (cmd.use) {
            helpText += `┃ ◈ *Usage:* ${config.PREFIX}${cmd.use}\n`
        }
        helpText += `╰━━━━━━━━━━━━━━━━━┈⊷`
        
        reply(helpText)
        
    } catch (e) {
        console.log(e)
        reply(`Error: ${e.message}`)
    }
})

// List commands by category
cmd({
    pattern: "cmdlist",
    alias: ["listcmd"],
    react: "📋",
    desc: "Get command count per category",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const events = require('../command')
        
        // Count commands per category
        const categoryCounts = {}
        let totalCommands = 0
        
        events.commands.forEach(cmd => {
            if (!cmd.pattern) return
            
            const category = cmd.category || 'other'
            categoryCounts[category] = (categoryCounts[category] || 0) + 1
            totalCommands++
        })
        
        let listText = `╭━━━〔 *COMMAND STATISTICS* 〕━━━┈⊷\n`
        listText += `┃ ◈ *Total Commands:* ${totalCommands}\n`
        listText += `╰━━━━━━━━━━━━━━━━━┈⊷\n\n`
        
        Object.keys(categoryCounts).sort().forEach(category => {
            listText += `*${category.toUpperCase()}:* ${categoryCounts[category]} commands\n`
        })
        
        listText += `\n_Type ${config.PREFIX}menu to see all commands_`
        
        reply(listText)
        
    } catch (e) {
        console.log(e)
        reply(`Error: ${e.message}`)
    }
})