const Discord = require('discord.js')
const fs = require('fs')

exports.run = async (message, args) => {
    let channelName = args[0]
    if (channelName == undefined) {
        channelName = message.channel.name
    }

    let startID = args[1] == undefined ? null : args[1] // doesnt catch first
    let endID = args[2] == undefined ? null : args[2] // catches last

    // datetime_regex = /([0-3][0-9])\-([01][012])\-(20[12][0-9])/ // DDMMYYYY
    // // SnowFlake is YYYY-MM-DDTHH:MM:SS:FFFZ
    // startDateGroups = startDate.match(datetime_regex)

    //bot.guilds.find(guildName => guildName.id == myguildidwashere
    let theChannel = await message.guild.channels.find(
        c => c.name == channelName && c.type == 'text')

    let messageLogs = (await theChannel.fetchMessages({ after: startID })
        .then(logs => logs.filter(msg => msg.id <= endID))
        .catch(console.error)
    ).map(msg => ({ [msg.id]: [msg.author.username, msg.content] }))

    let fetchComplete = (logs, end) => {
        return (Object.keys(logs[0])[0] == end)
    }

    async function continueFetching(current) {
        let currentID = Object.keys(current[0])[0]
        let moreLogs = (await theChannel.fetchMessages({ after: currentID })
            .then(logs => logs.filter(msg => msg.id <= endID))
            .catch(console.error)
        ).map(msg => ({ [msg.id]: [msg.author.username, msg.content] }))

        let extendedLogs = moreLogs.concat(current)

        if (!fetchComplete(extendedLogs, endID)) {
            console.log('Continuing fetches...')
            console.log(`Current number of messages: \
                ${Object.keys(extendedLogs).length}`)
            if (Object.keys(extendedLogs).length > 5000) { return extendedLogs }
            return continueFetching(extendedLogs)
        } else {
            console.log('Finished fetching!')
            return extendedLogs
        }
    }

    var logs = messageLogs
    if (!fetchComplete(logs, endID)) {
        logs = (await continueFetching(logs))
    }

    let logFile = await JSON.stringify(logs, null, 2)

    await fs.writeFileSync(`${channelName}.json`, logFile, (err) => {
        if (err) throw err
        console.log('file saved')
    })

    let numberOfMessages = Object.keys(logs).length
    let fileStats = fs.statSync(`${channelName}.json`, (err) => {
        if (err) throw err
    })
    let fileSize = fileStats.size / 1024.0

    var fileMessage = (await new Discord.RichEmbed()
        .setTitle(`#${channelName} logfile`)
        .setDescription(`The file that contains all the conversation logs \
                since and up to the specified dates in the command call.`)
        .setColor('#AA1100')
        .setTimestamp(message.createdAt)
        .addField('Caller: ', `<@${message.author.id}>`, true)
        .addField('Size:', `${numberOfMessages} messages; \
                ${Number(fileSize).toFixed(1)} KB`, true)
        .attachFile(`${channelName}.json`))

    await message.channel.send(fileMessage) // send on call channel

    await fs.unlinkSync(`${channelName}.json`, (err) => {
        if (err) throw err
        console.log(err)
    })
}

exports.config = {
    name: 'log',
    help: `Logs a channel's messages up to and from a certain date.`
}
