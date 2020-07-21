const fs = require("fs")
const url = require("url")
const querystring = require("querystring")
const http = require("http")
const WebSocket = require("ws")
const zlib = require("zlib")
const spawn = require("child_process")
const cheerio = require("cheerio")
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

    //后台管理
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

    else if (r.pathname === "/tenhou" && query.id) {
        const tmp = async(id, type)=>{
            const header_url = "http://otokomyouri.com/SearchByName/SBNHeader.aspx"
            const body_url = "http://otokomyouri.com/SearchByName/SBNBody.aspx"
            const post_data = {
                __VIEWSTATE: "/wEPDwUJODY5Njk0NDUyZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAgUKY2hrTW9udGhseQUJY2hrQ2hva2luAKeflpBy9eLXkc9/wCHEnXAT88bsE7pMeFGuhkOBB9o=",
                __VIEWSTATEGENERATOR: "35472AE9",
                __EVENTVALIDATION: "/wEdAA05g6xyCM5pIdHQS3r6qpx5nQD2+KyNjZqXGtohkeEbpWDMKSmpxcegtZH59zzEfdhj7rCv+3dAL1csO0hgF9VBDrKGGU7SXzlxUwb3vaKFbKHFaru9f9t/Ao4wZpQIbk0rS5GXjaXuV85G/QBrNqlgXC3y7fdVPmBDYiSVwMjNn1WYJpDioHyrkdNyuxYl9y9nM5s4/eUl09HAe782CVNnAjjx93hDXkPy/5Tc+5/dB9qmN0ZChGbKYeh4UUkOdl7mq4mgPNUbaGxbkU0ej673LudtZO9FnDQTO8WAihus77dwtmzT23Egh05Fked4bQw=",
                txtPlayerID: id,
                btnExecute: "実行",
                cmb34: type,
                cmbTonNan: "両方",
                cmbRank: "鳳凰",
                txtChokin: "100",
            }
            let Cookie = type === "四" ? "ASP.NET_SessionId=ftj4zylrjvah020w3qi0wht2" : "ASP.NET_SessionId=slgaeak3tahusweo1akujtkj"
            return new Promise((resolve)=>{
                const options = {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', Cookie}
                }
                const req = http.request(header_url, options, (res)=>{
                    http.get(body_url, {headers: {Cookie}}, (res)=>{
                        let data = ""
                        res.on("data", chunk=>data+=chunk)
                        res.on("end", ()=>{
                            let jq = cheerio.load(data)
                            resolve(jq("#lblRateDan font").text())
                        })
                    }).on("error", ()=>resolve({}))
                }).on("error", ()=>resolve(""))
                req.write(querystring.stringify(post_data))
                req.end()
            })
        }
        const [result1, result2] = await Promise.all([
            tmp(query.id, "四"),
            tmp(query.id, "三")
        ])
        return {4: result1, 3: result2}
    }
    
    //github webhock
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
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}

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
const prefix_list = ["-","/","?","？","！","－"]
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

require("./api_passon")(bot)

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
