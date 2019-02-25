exports.run = (message, args) => {
        topic = args[0]
        if (topic == undefined) {
            throw new Error('you did not specify discussion topic!')
        }

        topic_regex = /(\w+)(-\w+)*/ // letters-plus-dashes
        if (!topic.match(topic_regex)) {
            throw new Error('invalid topic expression')
        }

        // having checked for a topic arg lets us with options
        options = args.slice(1)
        // being undefined or something else

        // if the first text in the rest of the message is not a status arg
        status = options[0]
        if (status != undefined && status != 'open' && status != 'close') {
            // then it has been omitted, and that is the description, if any
            description = options.slice(0).join(' ')
            status = 'open'
        } else {
            description = options.slice(1).join(' ')
        }

        switch (status) {
            case 'open':
                discussionsCategory = message.guild.channels.find(
                    c => c.name == 'Chimubot testing' && c.type == 'category'
                ) // this one for testing, at the moment

                message.guild.createChannel(topic, 'text')
                    .then(channel => {
                        channel.setParent(discussionsCategory)
                        channel.setTopic(description)
                    })
                    .catch(err => {
                        console.log(err); // felt pretty, may delete later
                        throw err
                    })
                break
            case 'close':
                discussionChannel = message.guild.channels.find(
                    c => c.name == topic && c.type == 'text')
                // find() finds first occurence in an array
                startDate = discussionChannel.createdAt()
                // to do: log the texts from startDate

                discussionChannel.delete()
                break
        }
    }

exports.config = {
    name : 'discuss',
    help : `Starts or ends a discussion in a new text channel in the
        Discussion Topics category.`
}