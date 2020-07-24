const fs = require("fs")
const http = require("http")
const WebSocket = require("ws")
process.on("uncaughtException", (e)=>{
    fs.appendFileSync("err.log", Date() + " " + e.stack + "\n")
})
process.on("unhandledRejection", (reason, promise)=>{
    fs.appendFileSync("err.log", Date() + " Unhandled Rejection at:" + JSON.stringify(promise) + "reason:" + JSON.stringify(reason) + "\n")
})

//开启http服务器处理一些请求
const server = http.createServer(require("./web_hooks"))

const QQPlugin = require("./modules/qqplugin/cqhttp")
const sandbox = require("./modules/sandbox/sandbox")
const commands = require("./commands")
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}

Function.prototype.constructor = new Proxy(Function, {
    apply: ()=>{
        throw Error("能走到这里已经很强了，可惜你还是失败了。")
    },
    constructor: ()=>{
        throw Error("能走到这里已经很强了，可惜你还是失败了。")
    }
})

const bot = new QQPlugin()

const bans = {}
bot.on("notice.group_ban.lift_ban", (data)=>{
    if (data.user_id === data.self_id) {
        if (bans.hasOwnProperty(data.group_id)) {
            clearTimeout(bans[data.group_id])
            delete bans[data.group_id]
        }
        bot.sendGroupMsg(data.group_id, "为什么要禁言我")
    }
})
bot.on("notice.group_ban.ban", (data)=>{
    if (data.user_id === data.self_id && data.duration > 86400)
        bot.setGroupLeave(data.group_id)
    else if (data.user_id === data.self_id) {
        if (bans.hasOwnProperty(data.group_id)) {
            clearTimeout(bans[data.group_id])
            delete bans[data.group_id]
        }
        const id = setTimeout(()=>{
            bot.sendGroupMsg(data.group_id, "为什么要禁言我")
            delete bans[data.group_id]
        }, data.duration * 1000)
        bans[data.group_id] = id
    }
})

//固定指令触发前缀
const prefix_list = ["-"]
bot.on("message", async(data)=>{
    let me = data.self_id
    let uid = data.user_id
    let gid = data.group_id
    const reply = (msg)=>{
        bot.reply(data, msg, {at_sender: false})
    }
    let message = data.raw_message.trim()
    let prefix = message.substr(0, 1)
    if (prefix_list.includes(prefix)) {
        let split = message.substr(1).trim().split(" ")
        let command = split.shift()
        let param = split.join(" ")
        if (isMaster(uid) && command === "request" && param.length) {
            let params = param.split(" ")
            let action = params.shift()
            if (typeof bot[action] === "function") {
                reply(await bot[action].apply(bot, params))
            }
            return
        }
        if (isMaster(uid) && command === "run" && param.length) {
            let result
            try {
                result = eval(message.substr(5))
            } catch(e) {
                result = e.stack
            }
            return reply(result)
        }
        if (command === "vip") {
            if (!param)
                param = uid.toString()
            let res = (await bot.getVipInfo(param.replace(/(&#91;|&#93;)/g,"").replace(/[^(0-9)]/g,""))).data
            if (res) {
                reply(`用户: ${res.nickname} (${res.user_id})
等级: ${res.level}级 (${res.level_speed}倍加速)
会员: ${res.vip_level} (成长值${res.vip_growth_total}|${res.vip_growth_speed}/天)`)
            }
            return
        }
        if (commands.hasOwnProperty(command)) {
            return reply(await commands[command](param))
        }
    } else {
        message = ""
        for (let v of data.message) {
            if (v.type === "text")
                message += v.data.text
            else if (v.type === "at") {
                if (v.data.qq == data.self_id && !message.trim())
                    continue
                message += `'[CQ:at,qq=${v.data.qq}]'`
            }
            else {
                message += `[CQ:${v.type}`
                for (let k in v.data)
                    message += `,${k}=${v.data[k]}`
                message += `]`
            }
        }
        message = message.trim()
        sandbox.setEnv(data)
        let res = sandbox.run(message)
        if (message.match(/^'\[CQ:at,qq=\d+\]'$/))
            return
        if (res === null && message === "null")
            return
        if (["number","boolean"].includes(typeof res) && res.toString() === message)
            return
        return reply(res)
    }
})

require("./bridge")(bot)

//开启ws服务器处理bot请求
const ws = new WebSocket.Server({server})
ws.on("connection", (conn)=>{
    bot.conn = conn
    conn.on("message", (data)=>{
        bot.onEvent(data)
    })
    bot.emit("connection")
})
server.listen(3000)
