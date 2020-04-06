'use strict'
const http = require('http')
const bots = []
const register = (bot)=>{
    bots.push(bot)
}

/**
 * @param request an instance of http.IncomingMessage or ws raw data
 * @param response an instance of http.ServerResponse or a ws connection
 */
module.exports = async(request, response)=>{
    let message = request
    const agent = {}
    if (request instanceof http.IncomingMessage) {
        agent.send = response.end
    } else {
        agent.send = response.send
    }
    for (let bot of bots) {
        bot.onMessage(agent, message)
    }
}
module.exports.register = register
