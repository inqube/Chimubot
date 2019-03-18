const Discord = require('discord.js')
const fs = require('fs')
// To do: introduce regexp for channel<category
exports.run = async (bot, message, args, flags) => {
    console.log('Executing `!log` command!')

    datetimeRegexp = new RegExp([
        '(20[12][0-9])?\-?([01][0-9])\-([0-3][0-9])',
        '(T([012][0-9])\:([0-6][0-9])\:?([0-6][0-9])?)?']
        .join(''))

    hasChannelName = args[0]
        ? ((args[0].match(datetimeRegexp) === null) === true) : false

    let channelName = hasChannelName ? args[0] : message.channel.name
    let startString = hasChannelName ? (args[1] || null) : (args[0] || null)
    let endString = hasChannelName ? (args[2] || null) : (args[1] || null)
    // minimal command input is !log <startDate/startID>

    /** Date formatting:
    + Full format: YYYY-MM-DDTHH:MM:SS
    + Month and day are obligatory
    + Year and time are optional (if time, it must contain THH:MM); 24H format
    + No year input yields current year, no time input yields 00:00:00:000
    */

    let startStringMatches = startString === null
        ? null : (await startString.match(datetimeRegexp))
    let endStringMatches = endString === null
        ? null : (await endString.match(datetimeRegexp))
    // if any of startString/endString are IDs, matches will return null

    switch (startStringMatches === null) {
    case true: // startString is an ID or null
        var startID = startString ||
                Discord.SnowflakeUtil.generate(message.channel.createdAt)
        break

    case false: // startString is a datetime
        let startStringMatches = startString.match(datetimeRegexp)
        // group 0 is full match
        let startYear = (startStringMatches[1] || String(new Date().getFullYear()))
        let startMonth = startStringMatches[2]
        let startDay = startStringMatches[3]
        // group 4 is time full match (THH:MM:SS)
        let startHour = startStringMatches[5] || '01' // GMT+1
        let startMinute = startStringMatches[6] || '00'
        let startSecond = startStringMatches[7] || '00'

        let startDate = new Date(
            `${startYear}\-${startMonth}\-${startDay}T${startHour}\:${startMinute}\:${startSecond}`)
        var startID = Discord.SnowflakeUtil.generate(startDate)
        break
    }

    switch (endStringMatches === null) {
    case true:
        var endID = endString || message.id
        break

    case false:
        let endStringMatches = endString.match(datetimeRegexp)
        let endYear = (endStringMatches[1] || String(new Date().getFullYear()))
        let endMonth = endStringMatches[2]
        let endDay = endStringMatches[3]
        let endHour = endStringMatches[5] || '01'
        let endMinute = endStringMatches[6] || '00'
        let endSecond = endStringMatches[7] || '00'

        let endDate = new Date(
            `${endYear}\-${endMonth}\-${endDay}T${endHour}\:${endMinute}\:${endSecond}`)
        var endID = Discord.SnowflakeUtil.generate(endDate)
        break
    }

    // not using find() with channel ID because channelName is a command arg
    let logChannel = await message.guild.channels.find(
        c => c.name == channelName && c.type == 'text')

    let messageLogs = (await logChannel.fetchMessages({ after: startID })
        .then(logs => logs.filter(msg => msg.id <= endID))
        .catch(console.error)
    ).map(msg => ({ [msg.id]: [msg.author.username, msg.content] }))
    console.log('Fetched something!')

    // use channel-lastmessageID
    let fetchComplete = (logs, end) => {
        return (Object.keys(logs[0])[0] == end)
    }

    async function continueFetching (current, nm = 0) {
        // get ID of current logs' last message
        let currentID = Object.keys(current[0])[0]
        // continue fetching after current last ID
        let moreLogs = (await logChannel.fetchMessages({ after: currentID })
            .then(logs => logs.filter(msg => msg.id <= endID))
            .catch(console.error)
        ).map(msg => ({ [msg.id]: [msg.author.username, msg.content] }))

        let extendedLogs = moreLogs.concat(current)

        /**
         * We need to check if consequent calls for the function are useful
         * because endID may not correspond to a message's ID (input =? Date)
         * so fetchComplete() will not return true if this is the case
         */

        nnm = Object.keys(extendedLogs).length // new number of messages
        if (!fetchComplete(extendedLogs, endID) && (nnm - nm != 0)) {
            console.log('Continuing fetches...')
            console.log(`Current number of messages: ${nnm}`)
            return continueFetching(extendedLogs, nnm)
        } else {
            console.log(`Final number of messages: ${nnm}`)
            console.log('Finished fetching!')
            return extendedLogs
        }
    }

    var logs = messageLogs
    if (!fetchComplete(logs, endID)) {
        logs = (await continueFetching(logs))
    }

    if (Boolean(flags.get('use-dates')) === true) {
        for (i = 0; i < logs.length; i++) {
            for ([key, msg] of Object.entries(logs[i])) {
                var idDate = Discord.SnowflakeUtil.deconstruct(key).date
                // be sure to get a unique key by showing ms in the date
                var strDate = idDate.toLocaleDateString('en-GB',
                    { 'hour': '2-digit',
                        'minute': '2-digit',
                        'second': '2-digit',
                        'hour12': false }) +
                    `.${String(idDate.getMilliseconds()).padStart(3, '0')}`

                delete logs[i][key]
                logs[i][strDate] = msg
            }
        }
    }
    let logFile = await JSON.stringify(logs, null, 2)

    await fs.writeFileSync(`${channelName}.json`, logFile, (err) => {
        if (err) throw err
        console.log('File saved!')
    })

    let numberOfMessages = Object.keys(logs).length
    let fileStats = await fs.statSync(`${channelName}.json`, (err) => {
        if (err) throw err
    })
    let fileSize = fileStats.size / 1024.0 // KB

    let printStartDate = Discord.SnowflakeUtil.deconstruct(startID).date
        .toLocaleDateString('en-GB',
            { 'timeZone': 'UTC',
                'hour': '2-digit',
                'minute': '2-digit',
                'second': '2-digit',
                'hour12': false }) +
                `.${String(Discord.SnowflakeUtil.deconstruct(startID).date
                    .getMilliseconds()).padStart(3, '0')}`

    let printEndDate = Discord.SnowflakeUtil.deconstruct(endID).date
        .toLocaleDateString('en-GB',
            { 'timeZone': 'UTC',
                'hour': '2-digit',
                'minute': '2-digit',
                'second': '2-digit',
                'hour12': false }) +
                `.${String(Discord.SnowflakeUtil.deconstruct(endID).date
                    .getMilliseconds()).padStart(3, '0')}`

    var fileMessage = (await new Discord.RichEmbed()
        .setTitle(`#${logChannel.name} logs`)
        .setDescription(`Logfile containing all the message logs in \
            ${logChannel} between: \
            \n\`\`\`${printStartDate}\n${printEndDate}\`\`\``)
        .setColor('#AA1100')
        .setTimestamp(message.createdAt)
        .addField('Caller: ', `<@${message.author.id}>`, true)
        .addField('Size:', `${numberOfMessages} messages; \
                ${Number(fileSize).toFixed(1)} KB`, true)
        .attachFile(`${channelName}.json`))

    if (Boolean(flags.get('no-send')) !== true) {
        // send on call channel
        await message.channel.send(fileMessage)
        // check flag to send on log channel
        if (Boolean(flags.get('send-to')) === true) {
            await logChannel.send(fileMessage)
        }
    }

    if (Boolean(flags.get('no-delete')) !== true) {
        await fs.unlinkSync(`${channelName}.json`, (err) => {
            if (err) throw err
            console.log(err)
            console.log('File deleted!')
        })
    }
    console.log('Done!')
    return 0
}

exports.config = {
    name: 'log',
    help: `Logs a channel's messages up to and from a certain date.`
}
