exports.run = (message, args) => {
    id = args[0] // TODO: make sure id = int, return error otherwise
    topic = args[1] // TODO: make args =/= 0 be the topic (or think of better args for !vote)
    console.log('ID: ' + id)
    console.log('topic: ' + topic)

    message.channel.send(topic).then(function (message) {
        message.react('👍')
        message.react('👎')
    })
}

exports.config = {
    name: 'vote',
    description: 'sets up votes!'
}
