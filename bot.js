"use strict"
const blacklist = [3507349275,429245111]
blacklist.push(1738088495)
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
            msg = e.name + ": " + e.message
        }
    } else if (typeof msg !== "string") {
        msg = msg.toString()
    }
    if (typeof msg === "string") {
        msg = msg.replace(ero, "⃺")
        if (msg.length > 4500)
            msg = msg.substr(0, 4495) + "\n..."
        if (!msg.length)
            return
    }
    return msg
}

const fff = {limit: 1000} //群发言频率限制每秒1条

const CQHttp = require("./cqhttp")
const bot = new CQHttp()

bot.on("request.friend", bot.approve)
bot.on("request.group.add", (data)=>{
    bot.setGroupRequest(data.flag, false, "拒绝")
})
bot.on("request.group.invite", (data)=>{
    if (data.self_id === 3507349275) {
        return bot.setGroupInvitation(data.flag, false, "拒绝")
        return bot.approve(data, false, "暂时不接受群邀请")
    }
    bot.approve(data)
})
bot.on("notice.group_ban.ban", (data)=>{
    if (data.user_id === data.self_id && data.duration > 86400)
        bot.setGroupLeave(data.group_id)
})
bot.on("notice.group_increase", async(data)=>{
    if (data.user_id === data.self_id) {
        let res = await bot.sendGroupMsg(data.group_id, "喵~")
        if (res.retcode)
            bot.setGroupLeave(data.group_id)
    }
})
bot.on("message", async(data)=>{
    let uid = data.user_id
    let gid = data.group_id
    if (blacklist.includes(uid))
        return
    const reply = (msg)=>{
        msg = replyFilter(msg)
        if (typeof msg === "string") {
            bot.reply(data, msg, {at_sender: false})
        }
    }
    let message = data.raw_message.trim()
    let prefix = message.substr(0, 1)
    if (prefix === "!") return
    if (prefix === "-") {
        let split = message.substr(1).trim().split(" ")
        let command = split.shift()
        let param = split.join(" ")
        if (command === "获得管理") {
            return bot.setGroupAdmin(gid, uid)
        }
        if (command === "放弃管理") {
            return bot.setGroupAdmin(gid, uid, false)
        }
        if (command === "request" && param.length) {
            let params = param.split(" ")
            let action = params.shift()
            if (typeof bot[action] === 'function') {
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
        if (command === 'vip') {
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
        if (command === "龙王")
            param = gid
        if (command === "发言")
            param = [gid, uid]
        if (commands.hasOwnProperty(command)) {
            return reply(await commands[command](param))
        }
    } else {
        let res = sandbox.run(data, timeout, isMaster(uid))
        if (gid) {
            const now = Date.now()
            if (fff[gid] && now - fff[gid] <= fff.limit)
                return
            if (res !== undefined && res !== "")
                fff[gid] = now
        }
        return reply(res)
    }
})

module.exports = (conn, data)=>{
    bot.conn = conn
    bot.onEvent(data)
}
module.exports.manage = ()=>{
    return sandbox.getContext()
}
