const Discord = require('discord.js')
const fs = require('fs')

exports.run = async (message, args) => {
    let channelName = args[0]
    if (channelName == undefined) {
        channelName = message.channel.name
    }

    let startString = args[1] == undefined ? null : args[1]
    let endString = args[2] == undefined ? null : args[2]

    // YYYY-MM-DDTHH:MM:SS
    // month and day are obligatory
    // year and time are optional (time must contain THH:MM); 24h format
    // no year yields current year, no time yields 00:00:00:000
    datetime_regex = /(20[12][0-9])?\-?([01][0-9])\-([0-3][0-9])(T([012][0-9])\:([0-6][0-9])\:?([0-6][0-9])?)?/

    let startStringMatches = startString.match(datetime_regex)
    let startYear = (startStringMatches[1] || String(new Date().getFullYear()))
    let startMonth = startStringMatches[2]
    let startDay = startStringMatches[3]
    let startHour = startStringMatches[5] || "01" // gmt+1
    let startMinute = startStringMatches[6] || "00"
    let startSecond = startStringMatches[7] || "00"

    let startDate = new Date(`${startYear}\-${startMonth}\-${startDay}T${startHour}\:${startMinute}\:${startSecond}`)
    let startID = Discord.SnowflakeUtil.generate(startDate)

    let endStringMatches = endString.match(datetime_regex)
    let endYear = (endStringMatches[1] || String(new Date().getFullYear()))
    let endMonth = endStringMatches[2]
    let endDay = endStringMatches[3]
    let endHour = endStringMatches[5] || "01" // gmt+1
    let endMinute = endStringMatches[6] || "00"
    let endSecond = endStringMatches[7] || "00"

    let endDate = new Date(`${endYear}\-${endMonth}\-${endDay}T${endHour}\:${endMinute}\:${endSecond}`)
    let endID = String(Discord.SnowflakeUtil.generate(endDate))

    // possibly use .get to get ids, and client/bot instead of message...
    let theChannel = await message.guild.channels.find(
        c => c.name == channelName && c.type == 'text')

    let messageLogs = (await theChannel.fetchMessages({ after: startID })
        .then(logs => logs.filter(msg => msg.id <= endID))
        .catch(console.error)
    ).map(msg => ({ [msg.id]: [msg.author.username, msg.content] }))

    let fetchComplete = (logs, end) => {
        return (Object.keys(logs[0])[0] == end)
    }

    async function continueFetching(current, nm = 0) {
        let currentID = Object.keys(current[0])[0]
        let moreLogs = (await theChannel.fetchMessages({ after: currentID })
            .then(logs => logs.filter(msg => msg.id <= endID))
            .catch(console.error)
        ).map(msg => ({ [msg.id]: [msg.author.username, msg.content] }))

        let extendedLogs = moreLogs.concat(current)
        nnm = Object.keys(extendedLogs).length
        // need to check if consequent calls for the function do something
        // because endID may not correspond to a message's id and therefore
        // fetchComplete will not return true -> possibly change fetchComplete
        if (!fetchComplete(extendedLogs, endID) && (nnm - nm != 0)) {
            console.log('Continuing fetches...')
            console.log(`Current number of messages: ${nnm}`)
            // if (Object.keys(extendedLogs).length > 5000) { return extendedLogs }
            return continueFetching(extendedLogs, nnm)
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
    let fileStats = await fs.statSync(`${channelName}.json`, (err) => {
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
