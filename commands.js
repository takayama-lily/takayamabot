"use strict"
const commands = {
    "qh": async function(param) {
        return '不再支持"-"前缀，请使用：.雀魂 昵称'
    },
    "bgm": async function(param) {
        return "不再支持"-"前缀，请使用：.新番"
    },
    "anime": async function(param) {
        return `不再支持"-"前缀，请使用如：.动漫 公主连结`
    },
    "yq": async function(param) {
        return `不再支持"-"前缀，请使用：.疫情 美国`
    },
    "pl": async function(param) {
        return `不再支持"-"前缀，请使用：.牌理 或 /牌理`
    },
    "龙王": async(param)=>{
        return `不再支持"-"前缀，请使用：.龙王 或 /龙王`
    },
    "发言": async(param)=>{
        return `不再支持"-"前缀，请使用：.发言 或 /发言`
    },
//     "友人": async(param)=>{
//         if (!param)
//             return "需要输入房间号。"
//         let res = await mjutil.cn.roomJoin(param)
//         if (res.hasOwnProperty("error"))
//             return res.error.message
//         else
//             return `已进入${param}，1分钟不开自动退出。`
//     },
//     "比赛": async(param)=>{
//         if (!param)
//             return "需要输入赛事ID。"
//         let res = await mjutil.cn.contestReady(param)
//         if (res.hasOwnProperty("error"))
//             return res.error.message
//         else
//             return `已进入${param}，1分钟不开自动退出。`
//     },
//     "段位匹配": async(param)=>{
//         await mjutil.cn.match(3)
//     },
//     "停止匹配": async(param)=>{
//         await mjutil.cn.stopMatch()
//     },
//     "状态": async(param)=>{
//         let status = ["待机","匹配","游戏","暂停","准备","离线"]
//         let res = mjutil.cn.getStatus()
//         let text = `位置：${res.current.position}
// 状态：${status[res.status]}`
//         return text
//     },
//     "status": async(param)=>{
//         return mjutil.cn.getStatus()
//     }
}
commands["雀魂"] = commands.qh
commands["牌理"] = commands.pl
commands["疫情"] = commands.yq
commands["新番"] = commands.bgm
commands["动漫"] = commands.anime

module.exports = commands
