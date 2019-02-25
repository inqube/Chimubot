exports.run = (message, args) => {
        topic = args[0]
        status = args[1]
        if (status == undefined) {
            status = 'open'
        }

        topic_regex = /(\w+)([\s-]\w)*/
        if (!topic.match(topic_regex)) {
            throw new Error('invalid topic string')
        }
        topic = topic.replace(' ', '-')

        switch (status) {
            case 'open':
                discussionsCategory = message.guild.channels.find(
                    c => c.name == 'Chimubot testing' && c.type == 'category'
                ) // this one for testing, at the moment

                message.guild.createChannel(topic, 'text')
                    .then(topic => {
                        topic.setParent(discussionsCategory)
                    })
                break
            case 'close':
                discussionChannel = message.guild.channels.find(
                    c => c.name == topic && c.type == 'text')
                // to do:
                // various channels with the same name?
                // store datetime with .createdAt
                // log messages since .createdAt datetime
                // etc.

                discussionChannel.delete()
                break
        }
    }

exports.config = {
    name : 'discuss',
    help : 'Starts or ends a discussion'
}