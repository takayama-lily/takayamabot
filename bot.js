"use strict"
const blacklist = [3507349275,429245111]
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}

// 固定指令
const commands = require("./commands")

// 沙盒初始化
const sandbox = require("./utils/sandbox")
sandbox.require("向听", require("syanten"))
let timeout = 50

// 敏感词
const ero = require("./ero")

const replyFilter = (msg)=>{
    if (typeof msg === "undefined")
        return
    if (typeof msg === "function")
        msg = `[Function: ${msg.name?msg.name:"anonymous"}]`
    if (typeof msg === "object") {
        try {
            msg = JSON.stringify(msg)
        } catch (e) {
            msg = "对象过大无法保存，将被丢弃。"
        }
    } else if (typeof msg !== "string") {
        msg = msg.toString()
    }
    if (typeof msg === "string") {
        msg = msg.replace(ero, "**")
        if (msg.length > 4500)
            msg = msg.substr(0, 4495) + "\n..."
        if (!msg.length)
            return
    }
    return msg
}

const CQHttp = require("./cqhttp")
const bot = new CQHttp()

bot.on("request.friend", bot.approve)
bot.on("request.group.invite", bot.approve)
bot.on("notice.group_ban.ban", (data)=>{
    if (data.user_id === data.self_id && data.duration > 86400)
        bot.setGroupLeave(data.group_id)
})
bot.on("message", async(data)=>{
    const reply = (msg)=>{
        msg = replyFilter(msg)
        if (typeof msg === "string")
            bot.reply(data, msg, {at_sender: false})
    }
    let message = ""
    for (let v of data.message) {
        if (v.type === "text")
            message += v.data.text
        else if (v.type) {
            if (v.type === "at")
                message += "\""
            message += "[CQ:" + v.type
            for (let k in v.data)
                message += `,${k}=${v.data[k]}`
            message += "]"
            if (v.type === "at")
                message += "\""
        }
    }
    data.message = message.trim()
    let prefix = data.message.substr(0, 1)
    if (prefix === "!") return
    if (prefix === "-") {
        let split = data.message.substr(1).trim().split(" ")
        let command = split.shift()
        let param = split.join(" ")
        if (command === "获得管理") {
            return bot.setGroupAdmin(data.group_id, data.user_id)
        }
        if (command === "放弃管理") {
            return bot.setGroupAdmin(data.group_id, data.user_id, false)
        }
        if (isMaster(data.user_id) && command === "request" && param.length) {
            let params = param.split(" ")
            let action = params.shift()
            if (typeof bot[action] === 'function') {
                reply(await bot[action].apply(bot, params))
            }
            return
        }
        if (isMaster(data.user_id) && command === "run" && param.length) {
            let result
            try {
                result = eval(data.message.substr(5))
            } catch(e) {
                result = e.stack
            }
            return reply(result)
        }
        if (command === "龙王")
            param = data.group_id
        if (command === "发言")
            param = [data.group_id, data.user_id]
        if (commands.hasOwnProperty(command)) {
            return reply(await commands[command](param))
        }
    } else {
        if (blacklist.includes(data.user_id))
            return
        return reply(sandbox.run(data, timeout, isMaster(data.user_id)))
    }
})

module.exports = (conn, data)=>{
    bot.conn = conn
    bot.onEvent(data)
}
