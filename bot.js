"use strict"
const QQPlugin = require("./modules/qqplugin/cqhttp")
const sandbox = require("./modules/sandbox/sandbox")
const commands = require("./commands")
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

sandbox.require("向听", require("syanten"))

// 敏感词
const ero = /(看批|日批|香批|批里|成人|无码|苍井空|b里|嫩b|嫩比|小便|大便|粪|屎|尿|淦|屄|屌|奸|淫|穴|yin|luan|xue|jiao|cao|sao|肏|肛|骚|逼|妓|艹|子宫|月经|危险期|安全期|戴套|无套|内射|中出|射在里|射在外|精子|卵子|受精|幼女|嫩幼|粉嫩|日我|日烂|草我|草烂|干我|日死|草死|干死|狂草|狂干|狂插|狂操|日比|草比|搞我|舔我|舔阴|浪女|浪货|浪逼|浪妇|发浪|浪叫|淫荡|淫乱|荡妇|荡女|荡货|操烂|抽插|被干|被草|被操|被日|被上|被艹|被插|被射|射爆|射了|颜射|射脸|按摩棒|肉穴|小穴|阴核|阴户|阴阜|阴蒂|阴囊|阴部|阴道|阴唇|阴茎|肉棒|阳具|龟头|勃起|爱液|蜜液|精液|食精|咽精|吃精|吸精|吞精|喷精|射精|遗精|梦遗|深喉|人兽|兽交|滥交|拳交|乱交|群交|肛交|足交|脚交|口爆|口活|口交|乳交|乳房|乳头|乳沟|巨乳|玉乳|豪乳|暴乳|爆乳|乳爆|乳首|乳罩|奶子|奶罩|摸奶|胸罩|摸胸|胸部|胸推|推油|大保健|黄片|爽片|a片|野战|叫床|露出|露b|漏出|漏b|乱伦|轮奸|轮暴|轮操|强奸|强暴|情色|色情|全裸|裸体|果体|酥痒|捏弄|套弄|体位|骑乘|后入|二穴|三穴|嬲|调教|凌辱|饥渴|好想要|性交|性奴|性虐|性欲|性行为|性爱|做爱|作爱|手淫|撸管|自慰|痴女|jj|jb|j8|j8|鸡8|鸡ba|鸡鸡|鸡巴|鸡吧|鸡儿|肉便器|rbq|泄欲|发泄|高潮|潮吹|潮喷|爽死|爽翻|爽爆|你妈|屁眼|后庭|菊花|援交|操死|插死)/ig

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

const bot = new QQPlugin()
const fff = {limit: 1000} //群发言频率限制每秒1条
// sandbox.require("setGroupBan", bot.setGroupBan)

bot.on("request.friend", (data)=>{
    let answer = 0x142857
    if (data.comment.includes(answer.toString()))
        bot.approve(data)
    else
        bot.approve(data, false, "答案不正确。")
})
bot.on("request.group.invite", (data)=>{
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
const prefix_list = ["-","/",".","?","!","？","！","－"]
bot.on("message", async(data)=>{
    let me = data.self_id
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
    if (prefix_list.includes(prefix)) {
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
        if (command === "card" && gid && param) {
            return bot.setGroupCard(gid, me, param)
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
        let res = sandbox.run(data, isMaster(uid))
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
