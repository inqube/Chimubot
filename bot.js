// modules
const Discord = require('discord.js')
const fs = require('fs')
// configs
const config = require('./config.json')
const keys = require('./private.json')
// vars
const client = new Discord.Client()
const prefix = config.prefix


client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands')
    .filter(file => file.endsWith('.js'))

// populate commands from commandFile array
for (const file of commandFiles) {
    const commandFile = require(`./commands/${file}`)
    client.commands.set(commandFile.config.name, commandFile)
}

// On bot ready
client.once('ready', () => {
    console.log('Ready!')
})


client.on('message', message => {
    if (!message.content.startsWith(prefix)) return

    // slice message by whitespace for args
    const args = message.content.slice(prefix.length).split(/ +/)
    // command will be the first word after the prefix
    const command = args.shift().toLowerCase()

    console.log(command + ' was executed!')

    // execute `run` property of `commands` dict/arr: `commands[command].run`
    try {
        client.commands.get(command).run(message, args)
    } catch (err) {
        console.error(err)
        message.reply(`there was an error trying to execute that command!\
            \`\`\`${err}\`\`\``)
    }
})


client.login(keys.token)
