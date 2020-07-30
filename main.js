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
const isMaster = (uid)=>{
    return [372914165].includes(uid)
}

const bot = new QQPlugin()

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
