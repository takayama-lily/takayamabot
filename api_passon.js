const http = require("http")
const https = require("https")
const sandbox = require("./modules/sandbox/sandbox")

const $ = sandbox.run(`new String(\`这是一个云JavaScript环境。聊天窗口就是控制台。
该文档可能需要一定的编程基础才能充分理解。
该文档默认你会使用JavaScript, 或其他类似语言。
http://usus.lietxia.bid/bot.html\`)`)

$.help = $.doc = `● 前言
请勿设置任何可能导致封号的敏感违规内容。
调式手段是在代码前加上反斜杠"\\", 这样会输出错误信息。
支持使用CQ码定义图片等消息。
环境内只包含ECMAScript6原生API, 和一些增强API, 不要尝试使用浏览器或nodejs的特有API。
由于安全原因, 无法使用this、async、const三个关键字, 并且不支持eval和Promise异步。
由于输入习惯问题, 以下全角字符会被自动转为半角: 小括号,双引号,逗号,等号

● 以下是增强API：
env() ※返回环境变量对象(包含发言者的QQ信息和群信息等)
self() ※返回当前群的根数据对象()
alert(msg) ※输出内容到调用的群或私聊(无返回值)
$.ajax(url, callback, headers=null) ※暂时不支持POST
※用法: $.ajax("https://www.example.com", function(data){
    alert(data)
})

● 以下是QQ相关增强API(除获取群信息外无返回值)：
　　　发送私聊: $.sendPrivateMsg(uid,msg)
　　　发送群聊: $.sendGroupMsg(gid,msg)
　　　撤回消息: $.deleteMsg(message_id)
　　设置群名片: $.setGroupCard(uid,card)
　处理加群请求: $.setGroupRequest(flag,approve=true,reason=undefined) ※flag可以在群事件中拿到, reason仅在拒绝时有效
　　发布群公告: $.sendGroupNotice(title,content)
　　　　群踢人: $.setGroupKick(uid)
　　　　群禁言: $.setGroupBan(uid,duration=60)
设置或取消管理: $.setGroupAdmin(uid,enable=true)
　　设置群头衔: $.setGroupSpecialTitle(uid,title,duration=-1)
　　获取群信息: $.getGroupInfo() ※返回一个包含当前群数据的对象
更新群信息缓存: $.updateGroupCache()
※uid表示QQ号, gid表示群号
※有调用频率限制, 部分需要管理员或群主权限

● 自定义群事件处理：
需要自行重写"on_message_群号"和"on_notice_群号"函数, 例如群号为1234567, 则重写

//该函数在有群消息时触发
function on_message_1234567(data) { 
    if (data.raw_message == "你好")
        alert("你也好")
}
//该函数在有群事件时触发(入群、退群、加群请求等)
function on_event_1234567(data) { 
    alert(data)
}

● 其他可用函数：
at(QQ号) ※返回at一个人(string), 默认为发言者
qq(), qun() ※返回发言者的QQ号,群号(number)
user(card=1) ※返回发言者的群名片或昵称(string), card参数为真时优先取群名片
img(url, cache=true) ※返回一张图片(string)
random(min,max) ※随机返回一个min到max-1的整数(number)
time2str(timestamp) ※把时间戳转换为一个容易理解的时间(string)
parseQQ(at文) ※从at文中解析出QQ号(number)
protectQQ(QQ号或at文) ※隐藏部分QQ号起到保护作用(string)
base64Encode(str), base64Decode(str) ※base64编解码
hash(algorithm, data) ※用法: hash("md5","str") 已封装md5(),sha1(),sha256()等函数
hmac(algorithm, key, data) ※用法: hmac("md5","secret-key","str")
querystring ※nodejs的querystring模块

● 注意
宿主进程有时会重启, 此时环境内所有全局对象都会经历一次序列化和反序列化，
会导致以下数据会丢失：对象间的继承关系, 对象中的成员函数。

※欢迎加入小兔子俱乐部(892703008)
※20200705`

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
