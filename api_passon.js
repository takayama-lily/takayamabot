const sandbox = require("./modules/sandbox/sandbox")
const $ = new String(`输入$.help查看文档`)
$.help = `● 以下是QQAPI：
$.sendPrivateMsg //发送私聊
$.sendGroupMsg //发送群聊
$.deleteMsg //撤回消息
$.setGroupLeave //退群
$.setGroupCard //设置群名片
$.setGroupRequest //处理加群请求
$.sendGroupNotice //发布群公告
$.setGroupKick //群踢人
$.setGroupBan //群禁言
$.setGroupAnonymousBan //禁言匿名者
$.setGroupWholeBan //设置&取消全员禁言
$.setGroupAnonymous //设置&取消允许匿名
$.setGroupAdmin //设置&取消管理
$.setGroupSpecialTitle //设置群头衔
(有调用频率限制，部分需要管理员或群主权限)

● 以下是通用API：
alert(msg) //输出(无返回值)
self() //返回当前群的数据库(不会串群)
at(qq) //返回at一个人

● 自定义群事件处理：
需要自行实现"on_notice_群号"和"on_message_群号"函数，例如群号为1234567，则实现
function on_notice_1234567(data) { //该函数在有群事件时触发
    alert(JSON.stringify(data))
}
function on_message_1234567(data) { //该函数在有群消息时触发
    alert(JSON.stringify(data))
}`

let rest = 3
setInterval(()=>{
    rest = 3
}, 50)
const check_frequency = ()=>{
    if (rest === 0)
        throw new Error("调用频率太快")
    --rest
}

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
    $.setGroupKick = (gid, uid, forever = false)=>{
        check_frequency()
        bot.setGroupKick(gid, uid, forever)
    }
    $.setGroupBan = (gid, uid, duration = 60)=>{
        check_frequency()
        bot.setGroupBan(gid, uid, duration)
    }
    $.setGroupAnonymousBan = (gid, flag, duration = 60)=>{
        check_frequency()
        bot.setGroupAnonymousBan(gid, flag, duration)
    }
    $.setGroupAdmin = (gid, uid, enable = true)=>{
        check_frequency()
        bot.setGroupAdmin(gid, uid, enable)
    }
    $.setGroupWholeBan = (gid, enable = true)=>{
        check_frequency()
        bot.setGroupWholeBan(gid, enable)
    }
    $.setGroupAnonymous = (gid, enable = true)=>{
        check_frequency()
        bot.setGroupAnonymous(gid, enable)
    }
    $.setGroupCard = (gid, uid, card = undefined)=>{
        check_frequency()
        bot.setGroupCard(gid, uid, card)
    }
    $.setGroupLeave = (gid, dismiss = false)=>{
        check_frequency()
        bot.setGroupLeave(gid, dismiss)
    }
    $.setGroupSpecialTitle = (gid, uid, title, duration = -1)=>{
        check_frequency()
        bot.setGroupSpecialTitle(gid, uid, title, duration)
    }
    $.sendGroupNotice = (gid, title, content)=>{
        check_frequency()
        bot.sendGroupNotice(gid, title, content)
    }
    $.setGroupRequest = (flag, approve = true, reason = undefined)=>{
        check_frequency()
        bot.setGroupRequest(flag, approve, reason)
    }
    sandbox.require("$", $)
}

sandbox.require("向听", require("syanten"))
