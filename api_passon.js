const http = require("http")
const https = require("https")
const sandbox = require("./modules/sandbox/sandbox")

const $ = sandbox.run(`new String(\`这是一个云JavaScript环境。聊天窗口就是控制台。
该文档可能需要一定的编程基础才能充分理解。
该文档默认你会使用JavaScript, 或其他类似语言。
http://usus.lietxia.bid/bot.html\`)`)

let rest = 3
setInterval(()=>{
    rest = 3
}, 50)
const check_frequency = ()=>{
    if (rest === 0)
        throw new Error("调用频率太快")
    --rest
}

const ajax_queue = []
setInterval(()=>{
    while (ajax_queue.length) {
        let {url, cb, headers} = ajax_queue.shift()
        url = encodeURI(url.trim())
        let protocol = url.substr(0, 5) === "https" ? https : http
        let data = []
        const options = {}
        if (headers) {
            options.headers = headers
        }
        try {
            protocol.get(url, options, (res)=>{
                if (res.statusCode !== 200) {
                    cb({statusCode: res.statusCode})
                    return
                }
                res.on("data", chunk=>data.push(chunk))
                res.on("end", ()=>cb(Buffer.concat(data).toString()))
            }).on("error", err=>cb(err))
        } catch (e) {
            cb(e)
        }
    }
}, 200)

const getGid = ()=>sandbox.getContext().data.group_id

module.exports = (bot)=>{
    $.sendPrivateMsg = (uid, msg, escape = false)=>{
        check_frequency()
        bot.sendPrivateMsg(uid, msg, escape)
    }
    $.sendGroupMsg = (gid, msg, escape = false)=>{
        check_frequency()
        bot.sendGroupMsg(gid, msg, escape)
    }
    $.deleteMsg = (message_id)=>{
        check_frequency()
        bot.deleteMsg(message_id)
    }
    $.setGroupKick = (uid, forever = false)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupKick(gid, uid, forever)
    }
    $.setGroupBan = (uid, duration = 60)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupBan(gid, uid, duration)
    }
    $.setGroupAnonymousBan = (flag, duration = 60)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupAnonymousBan(gid, flag, duration)
    }
    $.setGroupAdmin = (uid, enable = true)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupAdmin(gid, uid, enable)
    }
    $.setGroupWholeBan = (enable = true)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupWholeBan(gid, enable)
    }
    $.setGroupAnonymous = (enable = true)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupAnonymous(gid, enable)
    }
    $.setGroupCard = (uid, card = undefined)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupCard(gid, uid, card)
    }
    // $.setGroupLeave = (gid, dismiss = false)=>{
    //     let gid = getGid()
    //     check_frequency()
    //     bot.setGroupLeave(gid, dismiss)
    // }
    $.setGroupSpecialTitle = (uid, title, duration = -1)=>{
        let gid = getGid()
        check_frequency()
        bot.setGroupSpecialTitle(gid, uid, title, duration)
    }
    $.sendGroupNotice = (title, content)=>{
        let gid = getGid()
        check_frequency()
        bot.sendGroupNotice(gid, title, content)
    }
    $.setGroupRequest = (flag, approve = true, reason = undefined)=>{
        check_frequency()
        bot.setGroupRequest(flag, approve, reason)
    }
    $.ajax = (url, callback = ()=>{}, headers = null)=>{
        check_frequency()
        if (typeof url !== "string")
            throw new TypeError("The first param must be a string")
        if (typeof callback !== "function")
            throw new TypeError("The second param must be a function")
        if (typeof headers !== "object")
            throw new TypeError("The third param must be an object")
        let env = sandbox.getContext().data
        let cb = (data)=>{
            sandbox.setEnv(env)
            let function_name = "tmp"+Date.now()
            sandbox.getContext()[function_name] = callback
            sandbox.run(`${function_name}(${JSON.stringify(data)})`)
            sandbox.run(`delete ${function_name}`)
        }
        ajax_queue.push({
            url, cb, headers
        })
    }
    $.get = $.ajax
    return $
}
