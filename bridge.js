const http = require("http")
const https = require("https")
const sandbox = require("./modules/sandbox/sandbox")

let bot = null

// CQ数据库初始化
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('/var/www/db/eventv2.db', sqlite3.OPEN_READONLY)

const $ = sandbox.exec(`new String(\`这是一个云JavaScript环境。聊天窗口就是控制台。
该文档默认你会使用JavaScript, 或其他类似语言。
https://takayama-lily.github.io/takayamabot/static/bot.html
--------------------
①尝试实现一个自定义功能, 输入如下代码：
hello = function() {
    //在这里添加注释说明，则功能一览中会收录此函数(不识别块注释)
    return "world"
}
②你定义了一个叫hello的功能。现在试着输入：.hello 或者 /hello
--------------------
※友情提示：开头添加反斜杠"\\\\"可以打开调试\`)`)

const getGid = ()=>sandbox.getContext().data.group_id

const async_queue = {}
const checkAndAddAsyncQueue = (o)=>{
    const key = sandbox.getContext().data.self_id + sandbox.getContext().data.group_id + sandbox.getContext().data.user_id
    if (!async_queue.hasOwnProperty([key])) {
        async_queue[key] = new Map()
        async_queue[key].set("start_moment", 0)
    }
    if (async_queue[key].get("start_moment") > 0 && Date.now() - async_queue[key].get("start_moment") > 60000) {
        async_queue[key].set("start_moment", 0)
        throw new Error("判定为递归调用，中断。")
    }
    async_queue[key].set(o, {start_time: Date.now(), end_time: undefined})
}

const asyncCallback = (o, env, callback, argv = [])=>{
    const key = env.self_id + env.group_id + env.user_id
    let start_moment = async_queue[key].get("start_moment")
    let endless_flag = false
    async_queue[key].forEach((v, k, map)=>{
        if (k === o)
            v.end_time = Date.now()
        else if (v.end_time && Date.now() - v.end_time > 500)
            map.delete(k)
        else {
            endless_flag = true
            if (start_moment === 0)
                async_queue[key].set("start_moment", Date.now())
        }
    })
    if (!endless_flag)
        async_queue[key].set("start_moment", 0)
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

sandbox.include("query", function(sql, callback) {
    checkFrequency()
    checkAndAddAsyncQueue(this)
    if (typeof sql !== "string")
        throw new TypeError("sql(第一个参数)必须是字符串。")
    if (typeof callback !== "function")
        throw new TypeError("callback(第二个参数)必须是函数。")
    const env = sandbox.getContext().data
    db.get(sql, (err, row)=>{
        if (err)
            asyncCallback(this, env, callback, [JSON.stringify(err)])
        else
            asyncCallback(this, env, callback, [JSON.stringify(row)])
    })
})

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
    const options = {}
    if (headers)
        options.headers = headers
    try {
        protocol.get(url, options, (res)=>{
            if (res.statusCode !== 200) {
                cb(JSON.stringify({code: res.statusCode}))
                return
            }
            res.on("data", chunk=>{
                size += chunk.length
                if (size > 1000000) {
                    res.destroy()
                    return
                }
                data.push(chunk)
            })
            res.on("end", ()=>cb(Buffer.concat(data).toString()))
        }).on("error", err=>cb(JSON.stringify(err)))
    } catch (e) {
        cb(JSON.stringify(e))
    }
}
sandbox.include("fetch", fetch)
$.ajax = fetch
$.get = fetch

//导入一些工具模块
sandbox.include("向听", require("syanten"))
sandbox.include("MJ", require("riichi"))
// sandbox.include("cheerio", require("cheerio"))
sandbox.include("moment", require("moment"))
sandbox.include("assert", require("assert"))
sandbox.include("crypto", require("crypto"))
sandbox.include("querystring", require("querystring"))
sandbox.include("path", require("path"))
sandbox.include("url", require("url"))
sandbox.include("string_decoder", require("string_decoder"))
sandbox.include("util", require("util"))
sandbox.include("os", require("os"))
sandbox.include("vm", require("vm"))
sandbox.include("Buffer", Buffer)
// sandbox.include("Events", require("events"))

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

//初始化数据，主要是获取群和群员列表
const groups = new Proxy(Object.create(null), {
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
const updateGroupCache = async(gid, cache = false)=>{
    gid = parseInt(gid)
    let group = (await bot.getGroupInfo(gid, cache)).data
    let members = (await bot.getGroupMemberList(gid)).data
    if (!group || !members)
        return
    group.update_time = Date.now()
    group = Object.setPrototypeOf(group, null)
    group.members = Object.create(null)
    for (let v of members) {
        group.members[v.user_id] = Object.setPrototypeOf(v, null)
        Object.freeze(group.members[v.user_id])
    }
    groups[gid] = group
    Object.freeze(groups[gid])
}
const initQQData = async()=>{
    let res = await bot.getGroupList()
    if (!res.retcode && res.data instanceof Array) {
        for (let v of res.data) {
            await updateGroupCache(v.group_id, true)
        }
    }
}

const setEnv = (data)=>{
    if (data.group_id && groups[data.group_id]) {
        data.group_name = groups[data.group_id].group_name
    }
    sandbox.setEnv(data)
}

// bot api
$.getGroupInfo = ()=>{
    let gid = getGid()
    return groups[gid]
}
$.sendPrivateMsg = (uid, msg, escape = false)=>{
    precheck()
    bot.sendPrivateMsg(uid, msg, escape)
}
$.sendGroupMsg = (gid, msg, escape = false)=>{
    precheck()
    bot.sendGroupMsg(gid, msg, escape)
}
$.deleteMsg = (message_id)=>{
    precheck()
    bot.deleteMsg(message_id)
}
$.setGroupKick = (uid, forever = false)=>{
    precheck()
    let gid = getGid()
    bot.setGroupKick(gid, uid, forever)
}
$.setGroupBan = (uid, duration = 60)=>{
    precheck()
    let gid = getGid()
    bot.setGroupBan(gid, uid, duration)
}
$.setGroupAnonymousBan = (flag, duration = 60)=>{
    precheck()
    let gid = getGid()
    bot.setGroupAnonymousBan(gid, flag, duration)
}
$.setGroupAdmin = (uid, enable = true)=>{
    precheck()
    let gid = getGid()
    bot.setGroupAdmin(gid, uid, enable)
}
$.setGroupWholeBan = (enable = true)=>{
    precheck()
    let gid = getGid()
    bot.setGroupWholeBan(gid, enable)
}
$.setGroupAnonymous = (enable = true)=>{
    precheck()
    let gid = getGid()
    bot.setGroupAnonymous(gid, enable)
}
$.setGroupCard = (uid, card = undefined)=>{
    precheck()
    let gid = getGid()
    bot.setGroupCard(gid, uid, card)
}
$.setGroupLeave = (dismiss = false)=>{
    precheck()
    let gid = getGid()
    bot.setGroupLeave(gid, dismiss)
}
$.setGroupSpecialTitle = (uid, title, duration = -1)=>{
    precheck()
    let gid = getGid()
    bot.setGroupSpecialTitle(gid, uid, title, duration)
}
$.sendGroupNotice = (title, content)=>{
    let gid = getGid()
    precheck()
    bot.sendGroupNotice(gid, title, content)
}
$.setGroupRequest = (flag, approve = true, reason = undefined)=>{
    precheck()
    bot.setGroupRequest(flag, approve, reason)
}
$.setFriendRequest = (flag, approve = true, remark = undefined)=>{
    precheck()
    bot.setFriendRequest(flag, approve, remark)
}
$.setGroupInvitation = (flag, approve = true, reason = undefined)=>{
    precheck()
    bot.setGroupInvitation(flag, approve, reason)
}
sandbox.include("$", $)

module.exports = (o)=>{
    bot = o

    bot.on("connection", ()=>{
        initQQData()
        sandbox.exec(`try{this.afterInit()}catch(e){}`)
    })

    //传递给沙盒的事件
    bot.on("message", (data)=>{
        setEnv(data)
        if (data.raw_message.trim().substr(0,1) !== "-") {
            let message = ""
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
            let res = sandbox.run(message)
            let echo = true
            if (message.match(/^'\[CQ:at,qq=\d+\]'$/))
                echo = false
            if (res === null && message === "null")
                echo = false
            if (["number","boolean"].includes(typeof res) && res.toString() === message)
                echo = false
            if (message.substr(0,1) === "\\" && typeof res === "undefined")
                res = "undefined"
            if (echo)
                bot.reply(data, res, {at_sender: false})
        }
        sandbox.exec(`try{this.onEvents()}catch(e){}`)
    })
    bot.on("notice", (data)=>{
        if (["group_admin","group_decrease","group_increase"].includes(data.notice_type))
            updateGroupCache(data.group_id)
        setEnv(data)
        sandbox.exec(`try{this.onEvents()}catch(e){}`)
    })
    bot.on("request", (data)=>{
        setEnv(data)
        sandbox.exec(`try{this.onEvents()}catch(e){}`)
    })
}
