const sandbox = require("./modules/sandbox/sandbox")
const $ = new String(`这是一个完整的ECMAScript6沙箱
聊天窗口可以看做一个与之交互的命令行界面
你刚才输入的"$"是一个全局变量
输入$.help查看开发文档
※本文档可能需要一定的编程基础才能充分理解`)
$.help = `● 以下是QQAPI：
　　　发送私聊: $.sendPrivateMsg(uid,msg)
　　　发送群聊: $.sendGroupMsg(gid,msg)
　　　撤回消息: $.deleteMsg(message_id)
　　设置群名片: $.setGroupCard(uid,card)
　处理加群请求: $.setGroupRequest(flag,approve=true,reason=undefined) ※flag可以在群事件中拿到，reason仅在拒绝时有效
　　发布群公告: $.sendGroupNotice(title,content)
　　　　群踢人: $.setGroupKick(uid)
　　　　群禁言: $.setGroupBan(uid,duration=60)
设置或取消管理: $.setGroupAdmin(uid,enable=true)
　　设置群头衔: $.setGroupSpecialTitle(uid,title,duration=-1)
　　获取群信息: $.getGroupInfo() ※获取群名和成员列表等(group_name,memebers)
更新群信息缓存: $.updateGroupCache()
※uid表示QQ号，gid表示群号
※有调用频率限制，部分需要管理员或群主权限

● 以下是通用API：
alert(msg) ※输出内容到调用的群或私聊(无返回值)
self() ※返回当前群的数据库根对象(不会串群)
at(qq) ※返回at一个人，默认为调用者
qq() ※返回调用者的QQ号
qun() ※返回调用者的群号
user(card=1) ※返回调用者的群名片或昵称，card参数为真时优先取群名片，否则取QQ昵称
data ※环境变量

● 自定义群事件处理：
需要自行重写"on_message_群号"和"on_notice_群号"函数，例如群号为1234567，则重写

//该函数在有群消息时触发
function on_message_1234567(data) { 
    if (data.raw_message == "你好")
        alert("你也好")
}

//该函数在有群事件时触发(入群、退群、加群请求等)
function on_event_1234567(data) { 
    alert(data)
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
    return $
}
