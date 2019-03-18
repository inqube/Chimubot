// modules
const Discord = require('discord.js')
const fs = require('fs')
// configs
const config = require('./config.json')
const keys = require('./private.json')
// vars
const bot = new Discord.Client()
const prefix = config.prefix


bot.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands')
    .filter(file => file.endsWith('.js'))

// populate commands from commandFile array
for (const file of commandFiles) {
    const commandFile = require(`./commands/${file}`)
    bot.commands.set(commandFile.config.name, commandFile)
}

// On bot ready
bot.once('ready', () => {
    console.log('Ready!')
})


bot.on('message', message => {
    if (!message.content.startsWith(prefix)) return

    // slice message by whitespace for args
    let args = message.content.slice(prefix.length).split(/ +/)
    // command will be the first word after the prefix
    const command = args.shift().toLowerCase()
    // get flags
    let flags = new Map(args.filter(arg => arg.startsWith('--'))
        .map(flag => flag.slice(2).split('=')))
    // and remove them from essential args
    args = args.filter(arg => (!arg.startsWith('--') && arg !== ''))

    // execute `run` property of `commands` dict/arr: `commands[command].run`
    try {
        bot.commands.get(command).run(bot, message, args, flags) // add bot to commands
    } catch (err) {
        console.error(err)
        message.reply(`there was an error trying to execute that command!\
            \`\`\`${err}\`\`\``)
    }
})


bot.login(keys.token)
