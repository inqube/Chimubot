const Discord = require('discord.js')
const log = require('./log')

// To do: change order of args to: !discuss [open/close] <title> [description]
exports.run = async (bot, message, args, flags) => {
    console.log('Executing `!discuss` command!')

    // channelString specifies the title and category of the discussion
    let channelString = args.shift()
    // channelString is a mandatory arg
    if (channelString == undefined) {
        throw new Error('you did not specify discussion title!')
    }

    channelRegexp = /(\w+(\-\w+)*)\<?(\w+(\-\w+)*)?/
    // the-category/the-text-channel
    let channelMatches = channelString.match(channelRegexp)
    if (!channelMatches) {
        throw new Error('invalid title expression')
    }
    let title = channelMatches[1]
    let categoryName = channelMatches[3] || 'Discussion Topics'
    // category titles have spaces instead of dashes
    categoryName = categoryName.replace('-', ' ')

    // this title validation can maybe be done better

    // if the first text in the rest of the message is not a status arg
    status = args.shift() || 'open'
    if (status != undefined && status != 'open' && status != 'close') {
        // then it has been omitted, and that is the description, if any
        description = String(status + ' ').concat(args.join(' '))
        status = 'open'
    } else {
        description = args.join(' ')
    }

    switch (status) {
    case 'open':
        // category where to open the discussion
        let categoryChannel = await message.guild.channels
            .find(c => c.name == categoryName && c.type == 'category')

        // does it exist?
        if (categoryChannel === undefined) {
            // do we want to create it?
            switch (flags.get('create-category')) {
            case undefined:
                throw new Error(`specified category channel \
                            does not exist: ${categoryName}`)
            case 'true':
                categoryChannel = (await message.guild
                    .createChannel(categoryName, 'category'))
            }
        }

        // create the discussion
        await message.guild.createChannel(title, 'text')
            .then(channel => {
                channel.setParent(categoryChannel)
                channel.setTopic(description)
            })
            .catch(console.error)
            // To do: set overwrites (e.g. slowmode) with flags
        break

    case 'close':

        let discussionChannel = (await message.guild.channels.find(c =>
            c.name == title &&
                    c.type == 'text' &&
                    c.parent.name == categoryName
        ))

        let startID = await Discord.SnowflakeUtil.generate(
            new Date(discussionChannel.createdAt))
        let endID = await discussionChannel.lastMessageID
        // To do: add flags for custom startID and endID

        if (flags.get('no-logs') != 'true') {
            await log.run(
                bot,
                message,
                [discussionChannel.name, startID, endID],
                new Map().set('use-dates', 'true')
            )
        }

        if (flags.get('no-delete') != 'true') {
            await discussionChannel.delete()
        }

        break
    }
    // To do: add more console logging
    console.log('Done!')
    return 0
}

exports.config = {
    name: 'discuss',
    help: `Starts or ends a discussion in a new text channel in the
        Discussion Topics category.`
}
