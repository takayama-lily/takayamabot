const http = require("http")
const https = require("https")
const WebSocket = require("ws")
const zlib = require("zlib")
const sandbox = require("./modules/sandbox/sandbox")
const Bot = require("./modules/qqplugin/cqhttp")
const bots = {}

// CQ数据库初始化
// const sqlite3 = require('sqlite3')
// const db = new sqlite3.Database('/var/www/db/eventv2.db', sqlite3.OPEN_READONLY)

const getGid = ()=>sandbox.getContext().data.group_id
const getSid = ()=>sandbox.getContext().data.self_id

const async_queue = {}
const checkAndAddAsyncQueue = (o)=>{
    const key = getSid() + getGid() + sandbox.getContext().data.user_id
    if (!async_queue.hasOwnProperty([key])) {
        async_queue[key] = new Map()
        async_queue[key].set("start_moment", 0)
    }
    let endless_flag = false
    let start_moment = async_queue[key].get("start_moment")
    async_queue[key].forEach((v, k, map)=>{
        if (k === "start_moment")
            return
        if (v.end_time && Date.now() - v.end_time > 500)
            map.delete(k)
        else {
            endless_flag = true
            if (start_moment === 0)
                async_queue[key].set("start_moment", Date.now())
        }
    })
    if (!endless_flag)
        async_queue[key].set("start_moment", 0)
    if (async_queue[key].get("start_moment") > 0 && Date.now() - async_queue[key].get("start_moment") > 60000) {
        async_queue[key].set("start_moment", 0)
        throw new Error("判定为递归调用，中断。")
    }
    async_queue[key].set(o, {start_time: Date.now(), end_time: undefined})
}

const asyncCallback = (o, env, callback, argv = [])=>{
    const key = env.self_id + env.group_id + env.user_id
    async_queue[key].get(o).end_time = Date.now()
    sandbox.setEnv(env)
    const function_name = "tmp_" + Date.now()
    const argv_name = "tmp_argv_" + Date.now()
    sandbox.getContext()[function_name] = callback
    sandbox.getContext()[argv_name] = argv
    try {
        sandbox.exec(`this.${function_name}.apply(null, this.${argv_name})`)
    } catch (e) {}
    sandbox.exec(`delete this.${function_name};delete this.${argv_name}`)
}

const buckets = {}
const checkFrequency = ()=>{
    let uid = sandbox.getContext().data.user_id
    if (!uid)
        return
    if (buckets.hasOwnProperty(uid) && Date.now() - buckets[uid].time > 300)
        delete buckets[uid]
    if (!buckets.hasOwnProperty(uid))
        buckets[uid] = {time: 0, cnt: 0}
    if (buckets[uid].cnt >= 3)
        throw new Error("调用频率太快。") 
    buckets[uid].time = Date.now()
    ++buckets[uid].cnt
}

const precheck = function() {
    checkFrequency()
    let fn = arguments.callee.caller
    let function_name = "current_called_api_"+Date.now()
    sandbox.getContext()[function_name] = fn
    sandbox.exec(`if (typeof this.beforeApiCalled === "function") {
    this.beforeApiCalled(this.${function_name})
    delete this.${function_name}
}`)
}

// sandbox.include("query", function(sql, callback) {
//     checkFrequency()
//     checkAndAddAsyncQueue(this)
//     if (typeof sql !== "string")
//         throw new TypeError("sql(第一个参数)必须是字符串。")
//     if (typeof callback !== "function")
//         throw new TypeError("callback(第二个参数)必须是函数。")
//     const env = sandbox.getContext().data
//     db.get(sql, (err, row)=>{
//         if (err)
//             asyncCallback(this, env, callback, [JSON.stringify(err)])
//         else
//             asyncCallback(this, env, callback, [JSON.stringify(row)])
//     })
// })

sandbox.include("setTimeout", function(fn, timeout = 5000, argv = []) {
    checkFrequency()
    checkAndAddAsyncQueue(this)
    if (typeof fn !== "function")
        throw new TypeError("fn(第一个参数)必须是函数。")
    timeout = parseInt(timeout)
    if (isNaN(timeout) || timeout < 5000)
        throw new Error("延迟时间不能小于5000毫秒。")
    const env = sandbox.getContext().data
    const cb = ()=>asyncCallback(this, env, fn, argv)
    return setTimeout(cb, timeout)
})
sandbox.include("clearTimeout", clearTimeout)

const fetch = function(url, callback = ()=>{}, headers = null) {
    checkFrequency()
    checkAndAddAsyncQueue(this)
    if (typeof url !== "string")
        throw new TypeError("url(第一个参数)必须是字符串。")
    if (typeof callback !== "function")
        throw new TypeError("callback(第二个参数)必须是函数。")
    if (typeof headers !== "object")
        throw new TypeError("headers(第三个参数)必须是对象。")
    const env = sandbox.getContext().data
    const cb = (data)=>asyncCallback(this, env, callback, [data])
    url = url.trim()
    const protocol = url.substr(0, 5) === "https" ? https : http
    let data = []
    let size = 0
    const options = {
        headers: {
            "Accept-Encoding": "gzip",
            ...headers
        }
    }
    try {
        protocol.get(url, options, (res)=>{
            if (res.statusCode !== 200) {
                cb(JSON.stringify({code: res.statusCode}))
                return
            }
            res.on("data", chunk=>{
                size += chunk.length
                if (size > 500000) {
                    res.destroy()
                    return
                }
                data.push(chunk)
            })
            res.on("end", ()=>{
                if (res.headers["content-encoding"] && res.headers["content-encoding"].includes("gzip")) {
                    zlib.gunzip(Buffer.concat(data), (err, buffer)=>{
                        if (err)
                            buffer = JSON.stringify(err)
                        cb(buffer.toString())
                    })
                } else
                    cb(Buffer.concat(data).toString())
            })
        }).on("error", err=>cb(JSON.stringify(err)))
    } catch (e) {
        cb(JSON.stringify(e))
    }
}
sandbox.include("fetch", fetch)

//master可以执行任意代码
sandbox.include("run", (code)=>{
    if (sandbox.getContext().isMaster()) {
        try {
            return eval(code)
        } catch(e) {
            return e.stack
        }
    } else
        throw new Error("403 forbidden")
})

//导入一些工具模块
sandbox.include("向听", require("syanten"))
sandbox.include("MJ", require("riichi"))
// sandbox.include("cheerio", require("cheerio"))
sandbox.getContext().cheerio = require("cheerio") //临时对应
sandbox.include("moment", require("moment"))
sandbox.include("assert", require("assert"))
sandbox.include("crypto", require("crypto"))
sandbox.include("querystring", require("querystring"))
sandbox.include("path", require("path"))
// sandbox.include("url", require("url"))
// sandbox.include("string_decoder", require("string_decoder"))
// sandbox.include("util", require("util"))
sandbox.include("os", require("os"))
// sandbox.include("vm", require("vm"))
sandbox.include("Buffer", Buffer)
// sandbox.include("Events", require("events"))

// qq api
const $ = {}
$.getGroupInfo = ()=>{
    return bots[getSid()].groups[getGid()]
}
$.sendPrivateMsg = (uid, msg, escape_flag = false)=>{
    precheck()
    bots[getSid()].sendPrivateMsg(uid, msg, escape_flag)
}
$.sendGroupMsg = (gid, msg, escape_flag = false)=>{
    precheck()
    bots[getSid()].sendGroupMsg(gid, msg, escape_flag)
}
$.deleteMsg = (message_id)=>{
    precheck()
    bots[getSid()].deleteMsg(message_id)
}
$.setGroupKick = (uid, forever = false)=>{
    precheck()
    bots[getSid()].setGroupKick(getGid(), uid, forever)
}
$.setGroupBan = (uid, duration = 60)=>{
    precheck()
    bots[getSid()].setGroupBan(getGid(), uid, duration)
}
$.setGroupAnonymousBan = (flag, duration = 60)=>{
    precheck()
    bots[getSid()].setGroupAnonymousBan(getGid(), flag, duration)
}
$.setGroupAdmin = (uid, enable = true)=>{
    precheck()
    bots[getSid()].setGroupAdmin(getGid(), uid, enable)
}
$.setGroupWholeBan = (enable = true)=>{
    precheck()
    bots[getSid()].setGroupWholeBan(getGid(), enable)
}
$.setGroupAnonymous = (enable = true)=>{
    precheck()
    bots[getSid()].setGroupAnonymous(getGid(), enable)
}
$.setGroupCard = (uid, card = undefined)=>{
    precheck()
    bots[getSid()].setGroupCard(getGid(), uid, card)
}
$.setGroupLeave = (dismiss = false)=>{
    precheck()
    bots[getSid()].setGroupLeave(getGid(), dismiss)
}
$.setGroupSpecialTitle = (uid, title, duration = -1)=>{
    precheck()
    bots[getSid()].setGroupSpecialTitle(getGid(), uid, title, duration)
}
$.sendGroupNotice = (title, content)=>{
    precheck()
    bots[getSid()].sendGroupNotice(getGid(), title, content)
}
$.setGroupRequest = (flag, approve = true, reason = undefined)=>{
    precheck()
    bots[getSid()].setGroupRequest(flag, approve, reason)
}
$.setFriendRequest = (flag, approve = true, remark = undefined)=>{
    precheck()
    bots[getSid()].setFriendRequest(flag, approve, remark)
}
$.setGroupInvitation = (flag, approve = true, reason = undefined)=>{
    precheck()
    bots[getSid()].setGroupInvitation(flag, approve, reason)
}
$.ajax = fetch
$.get = fetch
sandbox.include("$", $)

const createBot = (self_id)=>{
    const bot = new Bot()
    const setEnv = (data)=>{
        if (data.group_id && bot.groups[data.group_id]) {
            data.group_name = bot.groups[data.group_id].group_name
        }
        sandbox.setEnv(data)
    }
    const updateGroupCache = async(gid, cache = false)=>{
        gid = parseInt(gid)
        let group = (await bot.getGroupInfo(gid, cache)).data
        let members = (await bot.getGroupMemberList(gid)).data
        if (!group || !members)
            return
        group.update_time = Date.now()
        group.members = {}
        for (let v of members) {
            group.members[v.user_id] = Object.setPrototypeOf(v, null)
            Object.freeze(group.members[v.user_id])
        }
        bot.groups[gid] = group
        Object.freeze(bot.groups[gid])
    }
    const initQQData = async()=>{
        let res = await bot.getGroupList()
        if (!res.retcode && res.data instanceof Array) {
            for (let v of res.data) {
                await updateGroupCache(v.group_id, true)
            }
        }
    }
    bot.groups = new Proxy({}, {
        get: (o, k)=>{
            if (o[k]) {
                if (Date.now() - o[k].update_time >= 1800000)
                    updateGroupCache(k)
                return o[k]
            } else {
                updateGroupCache(k)
                return undefined
            }
        }
    })
    bot.on("connection", ()=>{
        initQQData()
        setEnv({self_id})
        sandbox.exec(`try{this.afterConn(${self_id})}catch(e){}`)
    })
    //传递给沙盒的事件
    bot.on("message", (data)=>{
        if (bots.hasOwnProperty(data.user_id) && data.user_id > self_id && data.group_id)
            return bot.setGroupLeave(data.group_id)
        setEnv(data)
        let message = ""
        if (Array.isArray(data.message)) {
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
        } else {
            message = data.message
        }
        message = message.trim()
        let res = sandbox.run(message)
        let echo = true
        if (message.match(/^'\[CQ:at,qq=\d+\]'$/))
            echo = false
        if (res === null && message === "null")
            echo = false
        if (["number","boolean"].includes(typeof res) && res.toString() === message)
            echo = false
        if (message.substr(0,1) === "\\" && typeof res === "undefined")
            res = "<undefined>"
        if (echo) {
            if (data.message_type === "private")
                bot.sendPrivateMsg(data.user_id, res)
            else
                bot.sendGroupMsg(data.group_id, res)
        }
        try {
            sandbox.exec(`try{this.onEvents()}catch(e){}`)
        } catch (e) {}
    })
    bot.on("notice", (data)=>{
        setEnv(data)
        if (["group_admin","group_decrease","group_increase"].includes(data.notice_type))
            updateGroupCache(data.group_id)
        try {
            sandbox.exec(`try{this.onEvents()}catch(e){}`)
        } catch (e) {}
    })
    bot.on("request", (data)=>{
        setEnv(data)
        try {
            sandbox.exec(`try{this.onEvents()}catch(e){}`)
        } catch (e) {}
    })
    return bot
}

//防止沙盒逃逸
Function.prototype.view = Function.prototype.toString
Function.prototype.constructor = new Proxy(Function, {
    apply: ()=>{
        throw Error("想跟妾身斗，汝还差得远呢。")
    },
    constructor: ()=>{
        throw Error("想跟妾身斗，汝还差得远呢。")
    }
})
Object.freeze(Object)
Object.freeze(Object.prototype)
Object.freeze(Function)
// Object.freeze(Function.prototype)

module.exports = (server)=>{
    //开启ws服务器处理bot请求
    const wss = new WebSocket.Server({server})
    wss.on("connection", (ws, req)=>{
        const self_id = req.headers["x-self-id"]
        if (!self_id) 
            return ws.close(4000, "QQ number is not currect.")
        const access_token = req.headers["authorization"]
        if (process.env.SANDBOX_AUTH && (!access_token || !access_token.includes(process.env.SANDBOX_AUTH)))
            return ws.close(4001, "Auth failed.")
        if (!bots.hasOwnProperty(self_id))
            bots[self_id] = createBot(parseInt(self_id))
        bots[self_id].conn = ws
        ws.on("message", (data)=>{
            bots[self_id].onEvent(data)
        })
        bots[self_id].emit("connection")
    })
}
