const http = require("http")
const https = require("https")
const sandbox = require("./modules/sandbox/sandbox")

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

// CQ数据库初始化
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('/var/www/db/eventv2.db', sqlite3.OPEN_READONLY)

const $ = sandbox.exec(`new String(\`这是一个云JavaScript环境。聊天窗口就是控制台。
该文档可能需要一定的编程基础才能充分理解。
该文档默认你会使用JavaScript, 或其他类似语言。
https://takayama-lily.github.io/takayamabot/static/bot.html
--------------------
①尝试实现一个自定义功能, 输入如下代码：
hello = function() {
    return "world"
}
②你定义了一个叫hello的功能。现在试着输入：.hello 或者 /hello\`)`)

const getGid = ()=>sandbox.getContext().data.group_id

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
        return sandbox.throw("Error", "调用频率太快")
    buckets[uid].time = Date.now()
    ++buckets[uid].cnt
}

const query = (sql, callback)=>{
    checkFrequency()
    if (typeof sql !== "string")
        sandbox.throw("TypeError", "The first param must be a string")
    if (typeof callback !== "function")
        sandbox.throw("TypeError", "The second param must be a function")
    let env = sandbox.getContext().data
    let cb = (data)=>{
        sandbox.setEnv(env)
        let function_name = "tmp_query_"+Date.now()
        sandbox.getContext()[function_name] = callback
        sandbox.exec(`${function_name}(${JSON.stringify(data)})`)
        sandbox.exec(`delete ${function_name}`)
    }
    db.get(sql, (err, row)=>{
        if (err)
            cb(JSON.stringify(err))
        else
            cb(JSON.stringify(row))
    })
}
sandbox.include("query", query)

sandbox.include("setTimeout", (fn, timeout = 1000, argv = [])=>{
    checkFrequency()
    if (typeof fn !== "function")
        sandbox.throw("TypeError", "The first param must be a function")
    timeout = parseInt(timeout)
    if (isNaN(timeout) || timeout < 1000)
        sandbox.throw("Error", "时间不能小于1000毫秒")
    let env = sandbox.getContext().data
    let cb = ()=>{
        sandbox.setEnv(env)
        let function_name = "tmp_timeout_"+Date.now()
        sandbox.getContext()[function_name] = fn
        sandbox.exec(`${function_name}.apply(null, ${JSON.stringify(argv)})`)
        sandbox.exec(`delete ${function_name}`)
    }
    setTimeout(cb, timeout)
})
const fetch = (url, callback = ()=>{}, headers = null)=>{
    checkFrequency()
    if (typeof url !== "string")
        sandbox.throw("TypeError", "The first param must be a string")
    if (typeof callback !== "function")
        sandbox.throw("TypeError", "The second param must be a function")
    if (typeof headers !== "object")
        sandbox.throw("TypeError", "The third param must be an object")
    let env = sandbox.getContext().data
    let cb = (data)=>{
        sandbox.setEnv(env)
        let function_name = "tmp_fetch_"+Date.now()
        sandbox.getContext()[function_name] = callback
        sandbox.exec(`${function_name}(${JSON.stringify(data)})`)
        sandbox.exec(`delete ${function_name}`)
    }
    url = url.trim()
    let protocol = url.substr(0, 5) === "https" ? https : http
    let data = []
    let size = 0
    const options = {}
    if (headers) {
        options.headers = headers
    }
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
sandbox.include("crypto", require("crypto"))
sandbox.include("querystring", require("querystring"))

sandbox.include("path", require("path"))
sandbox.include("url", require("url"))
sandbox.include("string_decoder", require("string_decoder"))
sandbox.include("util", require("util"))

sandbox.include("os", require("os"))
sandbox.include("vm", require("vm"))

sandbox.include("Buffer", Buffer)
sandbox.include("Events", require("events"))

module.exports = (bot)=>{

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

    const checkAuth = (gid)=>{
        if (sandbox.getContext().isMaster())
            return
        let uid = sandbox.getContext().data.user_id
        try {
            if (["owner","admin"].includes(groups[gid].members[uid].role))
                return 
        } catch (e) {}
        sandbox.throw("Error", "403 Forbidden")
    }

    bot.on("connection", ()=>{
        initQQData()
        sandbox.exec(`this.afterInit()`)
    })

    //传递给沙盒的事件
    bot.on("message", (data)=>{
        sandbox.setEnv(data)
        sandbox.exec(`this.onEvents()`)
    })
    bot.on("notice", (data)=>{
        if (["group_admin","group_decrease","group_increase"].includes(data.notice_type))
            updateGroupCache(data.group_id)
        sandbox.setEnv(data)
        sandbox.exec(`this.onEvents()`)
    })
    bot.on("request", (data)=>{
        sandbox.setEnv(data)
        sandbox.exec(`this.onEvents()`)
    })

    // bot api
    $.getGroupInfo = ()=>{
        let gid = getGid()
        return groups[gid]
    }
    $.sendPrivateMsg = (uid, msg, escape = false)=>{
        checkFrequency()
        bot.sendPrivateMsg(uid, msg, escape)
    }
    $.sendGroupMsg = (gid, msg, escape = false)=>{
        checkFrequency()
        bot.sendGroupMsg(gid, msg, escape)
    }
    $.deleteMsg = (message_id)=>{
        checkFrequency()
        bot.deleteMsg(message_id)
    }
    $.setGroupKick = (uid, forever = false)=>{
        let gid = getGid()
        checkAuth(gid)
        checkFrequency()
        bot.setGroupKick(gid, uid, forever)
    }
    $.setGroupBan = (uid, duration = 60)=>{
        let gid = getGid()
        checkFrequency()
        bot.setGroupBan(gid, uid, duration)
    }
    $.setGroupAnonymousBan = (flag, duration = 60)=>{
        let gid = getGid()
        checkFrequency()
        bot.setGroupAnonymousBan(gid, flag, duration)
    }
    $.setGroupAdmin = (uid, enable = true)=>{
        let gid = getGid()
        checkFrequency()
        bot.setGroupAdmin(gid, uid, enable)
    }
    $.setGroupWholeBan = (enable = true)=>{
        let gid = getGid()
        checkAuth(gid)
        checkFrequency()
        bot.setGroupWholeBan(gid, enable)
    }
    $.setGroupAnonymous = (enable = true)=>{
        let gid = getGid()
        checkFrequency()
        bot.setGroupAnonymous(gid, enable)
    }
    $.setGroupCard = (uid, card = undefined)=>{
        let gid = getGid()
        checkFrequency()
        bot.setGroupCard(gid, uid, card)
    }
    $.setGroupLeave = (dismiss = false)=>{
        let gid = getGid()
        checkAuth(gid)
        checkFrequency()
        bot.setGroupLeave(gid, dismiss)
    }
    $.setGroupSpecialTitle = (uid, title, duration = -1)=>{
        let gid = getGid()
        checkFrequency()
        bot.setGroupSpecialTitle(gid, uid, title, duration)
    }
    $.sendGroupNotice = (title, content)=>{
        let gid = getGid()
        checkAuth(gid)
        checkFrequency()
        bot.sendGroupNotice(gid, title, content)
    }
    $.setGroupRequest = (flag, approve = true, reason = undefined)=>{
        checkFrequency()
        bot.setGroupRequest(flag, approve, reason)
    }
    $.setFriendRequest = (flag, approve = true, remark = undefined)=>{
        checkFrequency()
        bot.setFriendRequest(flag, approve, remark)
    }
    $.setGroupInvitation = (flag, approve = true, reason = undefined)=>{
        checkFrequency()
        bot.setGroupInvitation(flag, approve, reason)
    }

    sandbox.include("$", $)
}