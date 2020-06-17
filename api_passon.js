const sandbox = require("./modules/sandbox/sandbox")
const $ = new String(`输入$.help查看文档`)
$.help = `部分需要管理员或群主权限
$.sendPrivateMsg //发送私聊
$.sendGroupMsg //发送群聊
$.setGroupLeave //退群
$.setGroupCard //设置群名片
$.sendGroupNotice //发布群公告
$.setGroupKick //群踢人
$.setGroupBan //群禁言
$.setGroupAnonymousBan //禁言匿名者
$.setGroupWholeBan //设置&取消全员禁言
$.setGroupAnonymous //设置&取消允许匿名
$.setGroupAdmin //设置&取消管理
$.setGroupSpecialTitle //设置群头衔`

const frequency = {}
const check_frequency = (object)=>{
    if (frequency.hasOwnProperty(object) && Date.now() - frequency[object] < 1000)
        throw new Error("调用频率太快")
    frequency[object] = Date.now()
}

module.exports = (bot)=>{
    $.sendPrivateMsg = (uid, msg, escape = false)=>{
        check_frequency(uid)
        bot.sendPrivateMsg(uid, msg, escape)
    }
    $.sendGroupMsg = (gid, msg, escape = false)=>{
        check_frequency(gid)
        bot.sendGroupMsg(gid, msg, escape)
    }
    $.setGroupKick = (gid, uid, forever = false)=>{
        check_frequency(gid)
        bot.setGroupKick(gid, uid, forever)
    }
    $.setGroupBan = (gid, uid, duration = 60)=>{
        check_frequency(gid)
        bot.setGroupBan(gid, uid, duration)
    }
    $.setGroupAnonymousBan = (gid, flag, duration = 60)=>{
        check_frequency(gid)
        bot.setGroupAnonymousBan(gid, flag, duration)
    }
    $.setGroupAdmin = (gid, uid, enable = true)=>{
        check_frequency(gid)
        bot.setGroupAdmin(gid, uid, enable)
    }
    $.setGroupWholeBan = (gid, enable = true)=>{
        check_frequency(gid)
        bot.setGroupWholeBan(gid, enable)
    }
    $.setGroupAnonymous = (gid, enable = true)=>{
        check_frequency(gid)
        bot.setGroupAnonymous(gid, enable)
    }
    $.setGroupCard = (gid, uid, card = undefined)=>{
        check_frequency(gid)
        bot.setGroupCard(gid, uid, card)
    }
    $.setGroupLeave = (gid, dismiss = false)=>{
        check_frequency(gid)
        bot.setGroupLeave(gid, dismiss)
    }
    $.setGroupSpecialTitle = (gid, uid, title, duration = -1)=>{
        check_frequency(gid)
        bot.setGroupSpecialTitle(gid, uid, title, duration)
    }
    $.sendGroupNotice = (gid, title, content)=>{
        check_frequency(gid)
        bot.sendGroupNotice(gid, title, content)
    }
    sandbox.require("$", $)
}

sandbox.require("向听", require("syanten"))
