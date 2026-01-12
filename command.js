// command.js - Enhanced command handler with auto-registration

const config = require('./config')
const commands = []

// Command registration function
function cmd(info, func) {
    const data = info
    data.function = func
    
    // Validate required fields
    if (!data.pattern) {
        console.log('⚠️  Command registered without pattern:', data.filename)
        return
    }
    
    // Set defaults
    data.category = data.category || 'other'
    data.desc = data.desc || 'No description available'
    data.alias = data.alias || []
    data.react = data.react || false
    data.use = data.use || `${data.pattern}`
    
    // Check for duplicate patterns
    const existingCmd = commands.find(c => c.pattern === data.pattern)
    if (existingCmd) {
        console.log(`⚠️  Duplicate command pattern: ${data.pattern}`)
        console.log(`   Existing: ${existingCmd.filename}`)
        console.log(`   New: ${data.filename}`)
        return
    }
    
    // Register the command
    commands.push(data)
    
    // Log successful registration (optional - comment out if too verbose)
    // console.log(`✅ Registered: ${data.pattern} (${data.category})`)
    
    return data
}

// Export commands array and registration function
module.exports = {
    cmd,
    commands
}

// ============================================
// COMMAND STATISTICS (Auto-generated on load)
// ============================================

process.on('SIGINT', () => {
    console.log('\n╭━━━━━━━━━━━━━━━━━━━━━━━╮')
    console.log('│  COMMAND STATISTICS    │')
    console.log('╰━━━━━━━━━━━━━━━━━━━━━━━╯')
    
    const categories = {}
    commands.forEach(cmd => {
        if (!cmd.pattern) return
        const cat = cmd.category || 'other'
        categories[cat] = (categories[cat] || 0) + 1
    })
    
    Object.keys(categories).sort().forEach(cat => {
        console.log(`${cat}: ${categories[cat]} commands`)
    })
    
    console.log(`\nTotal: ${commands.filter(c => c.pattern).length} commands\n`)
})

// Get command by pattern or alias
function getCommand(name) {
    return commands.find(cmd => 
        cmd.pattern === name || (cmd.alias && cmd.alias.includes(name))
    )
}

// Get commands by category
function getCommandsByCategory(category) {
    return commands.filter(cmd => 
        cmd.category === category && cmd.pattern
    )
}

// Get all categories
function getCategories() {
    const cats = new Set()
    commands.forEach(cmd => {
        if (cmd.pattern) cats.add(cmd.category || 'other')
    })
    return Array.from(cats).sort()
}

// Export utility functions
module.exports.getCommand = getCommand
module.exports.getCommandsByCategory = getCommandsByCategory
module.exports.getCategories = getCategories