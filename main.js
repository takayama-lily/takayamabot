"use strict"
const fs = require("fs")
const url = require("url")
const querystring = require("querystring")
const http = require("http")
const WebSocket = require("ws")
const zlib = require("zlib")
const spawn = require("child_process")
process.on("uncaughtException", (e)=>{
    fs.appendFileSync("err.log", Date() + " " + e.stack + "\n")
    process.exit(1)
})
process.on("unhandledRejection", (reason, promise)=>{
    fs.appendFileSync("err.log", Date() + " Unhandled Rejection at:" + JSON.stringify(promise) + "reason:" + JSON.stringify(reason) + "\n")
})

const manager = require("./manager")
const mjsoul = require("./modules/majsoul/majsoul")

const fn = async(req)=>{
    let r = url.parse(req.url)
    let query = querystring.parse(r.query)

    //机器人后台管理
    // if (r.pathname === "/manage/bot") {
    //     return manager()
    // }

    //牌谱请求
    if (r.pathname === "/record") {
        return await mjsoul.getParsedRecord(query.id)
    }
    
    //国服雀魂api
    else if (r.pathname === "/api" && query.m && !["login", "logout"].includes(query.m)) {
        // console.log(Date(), query)
        return await mjsoul.cn.sendAsync(query.m, query)
    }
    
    //日服雀魂api
    else if (r.pathname === "/jp/api" && query.m && !["login", "logout"].includes(query.m)) {
        return await mjsoul.jp.sendAsync(query.m, query)
    }
    
    //处理github push请求
    else if (r.pathname === "/youShouldPull") {
        return new Promise((resolve, reject)=>{
            spawn.exec("./up", (error, stdout, stderr) => {
                let output = {
                    "stdout": stdout,
                    "stderr": stderr,
                    "error": error
                }
                resolve(output)
            })
        })
    }
}

//开启http服务器处理一些请求
const server = http.createServer(async(req, res)=>{
    let result
    try {
        result = await fn(req)
        if (!result) {
            res.writeHead(302, {"Location": "/index.html"})
            res.end()
            return
        }
    } catch(e) {
        result = e
    }
    if (!(result instanceof Buffer) && typeof result !== "string")
        result = JSON.stringify(result)
    res.setHeader("Content-Type", "application/json; charset=utf-8")

    //开启gzip
    let acceptEncoding = req.headers["accept-encoding"]
    if (acceptEncoding && acceptEncoding.includes("gzip")) {
        res.writeHead(200, { "Content-Encoding": "gzip" })
        const output = zlib.createGzip()
        output.pipe(res)
        output.write(result, ()=>{
            output.flush(()=>res.end())
        });
    } else {
        res.end(result)
    }
})

const QQPlugin = require("./modules/qqplugin/cqhttp")
const sandbox = require("./modules/sandbox/sandbox")
const commands = require("./commands")
const blacklist = [3507349275,429245111]
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}

const bot = new QQPlugin()
const fff = {limit: 1000} //群发言频率限制每秒1条

//初始化数据，主要是获取群和群员列表
let groups = {}
const initQQData = async()=>{
    let res = await bot.getGroupList()
    let groups_tmp = {}
    if (!res.retcode && res.data instanceof Array) {
        for (let group of res.data) {
            groups_tmp[group.group_id] = (await bot.getGroupInfo(group.group_id)).data
            if (!groups_tmp[group.group_id])
                groups_tmp[group.group_id] = {}
            groups_tmp[group.group_id].members = {}
            let members = (await bot.getGroupMemberList(group.group_id)).data
            if (members) {
                for (let member of members) {
                    groups_tmp[group.group_id].members[member.user_id] = member
                }
            }
        }
    } else {
        return
    }
    groups = groups_tmp
}
setInterval(initQQData, 300000)
const updateGroupCache = async(gid)=>{
    let group = (await bot.getGroupInfo(gid, false)).data
    let members = (await bot.getGroupMemberList(gid)).data
    if (!group || !members)
        return
    group.members = {}
    for (let member of members)
        group.members[member.user_id] = member
    groups[gid] = group
}

//传递给沙盒的变量
const $ = require("./api_passon")(bot)
$.getGroupInfo = ()=>{
    let gid = sandbox.getContext().data.group_id
    if (groups.hasOwnProperty(gid))
        return groups[gid]
}
$.updateGroupCache = ()=>{
    let gid = sandbox.getContext().data.group_id
    updateGroupCache(gid)
}
sandbox.require("$", $)
sandbox.require("向听", require("syanten"))

//传递给沙盒的事件
bot.on("message.group", (data)=>{
    sandbox.setEnv(data)
    sandbox.run(`this.onEvents()`, true)
})
bot.on("notice", (data)=>{
    sandbox.setEnv(data)
    sandbox.run(`this.onEvents()`, true)
})
bot.on("request.group.add", (data)=>{
    sandbox.setEnv(data)
    sandbox.run(`this.onEvents()`, true)
})

//加好友和加群处理
bot.on("request.friend", (data)=>{
    bot.approve(data)
})
bot.on("request.group.invite", (data)=>{
    // bot.approve(data)
})

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
const prefix_list = ["-","/",".","?","!","？","！","－"]
bot.on("message", async(data)=>{
    let me = data.self_id
    let uid = data.user_id
    let gid = data.group_id
    if (blacklist.includes(uid))
        return
    const reply = (msg)=>{
        bot.reply(data, msg, {at_sender: false})
    }
    let message = data.raw_message.trim()
    let prefix = message.substr(0, 1)
    if (prefix_list.includes(prefix)) {
        let split = message.substr(1).trim().split(" ")
        let command = split.shift()
        let param = split.join(" ")
        if (command === "request" && param.length) {
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
        if (isMaster(uid) && command === "update") {
            return initQQData()
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
        if (command === "龙王")
            param = gid
        if (command === "发言")
            param = [gid, uid]
        if (commands.hasOwnProperty(command)) {
            return reply(await commands[command](param))
        }
    } else {
        message = ""
        for (let v of data.message) {
            if (v.type === "text")
                message += v.data.text
            else if (v.type === "at")
                message += `'[CQ:at,qq=${v.data.qq}]'`
            else {
                message += `[CQ:${v.type}`
                for (let k in v.data)
                    message += `,${k}=${v.data[k]}`
                message += `]`
            }

        }
        let code = message.trim()
        let atme = `'[CQ:at,qq=${data.self_id}]'`
        while (code.startsWith(atme))
            code = code.replace(atme, "").trim()
        sandbox.setEnv(data)
        let res = sandbox.run(code, isMaster(uid))
        // if (gid) {
        //     const now = Date.now()
        //     if (fff[gid] && now - fff[gid] <= fff.limit)
        //         return
        //     if (res !== undefined && res !== "")
        //         fff[gid] = now
        // }
        return reply(res)
    }
})

//开启ws服务器处理bot请求
const ws = new WebSocket.Server({server})
ws.on("connection", (conn)=>{
    bot.conn = conn
    conn.on("message", (data)=>{
        bot.onEvent(data)
    })
    initQQData()
})
server.listen(3000)
