"use strict"
const https = require("https")
const MJ = require("riichi")
const mjutil = require("./utils/majsoul")
const bgm = require("./utils/bgm")
const at = (qq)=>`[CQ:at,qq=${qq}]`
const buildImage = (url)=>`[CQ:image,file=${encodeURI(url)}]`

// CQ数据库初始化
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('/var/www/db/eventv2.db')

const commands = {
    "qh": async function(param) {
        if (!param.length)
            return "需要输入用户ID。"
        if (isNaN(param))
            return '现在无法使用用户名，只能使用ID来找到用户。'
        return await mjutil.shuibiao(param)
    },
    "qhcn": async function(param) {
        return await mjutil.shuibiao(param)
    },
    "qhjp": async function(param) {
        if (!param.length)
            return "需要输入用户ID。"
        if (isNaN(param))
            return '现在无法使用用户名，只能使用ID来找到用户。'
        // if (!param.length)
        //     return "没有输入用户名。输入例:\n-qhjp 千羽黒乃"
        else
            return await mjutil.shuibiao(param, true)
    },
    "rank": async function(param) {
        return await mjutil.ranking(param)
    },
    "rankjp": async function(param) {
        return await mjutil.ranking(param, true)
    },
    "bgm": async function(param) {
        return await bgm.getCalendar(param)
    },
    "anime": async function(param) {
        if (!param.length)
            return "没有输入名称。输入例:\n-动漫 公主连结"
        else
          return await bgm.getBangumi("anime", param)
    },
    "yq": async function(param) {
        let gbl = []
        return new Promise(resolve=>{
            https.get("https://api.inews.qq.com/newsqa/v1/automation/foreign/country/ranklist", res=>{
                res.on("data", d=>gbl.push(d))
                res.on("end", ()=>resolve())
            }).on("error", err=>{})
        }).then(()=>{
            try {
                gbl = Buffer.concat(gbl).toString()
                gbl = JSON.parse(gbl).data
                let msg = `${param?param:"国外"}疫情(${gbl[0].date.substr(1)}):\n`
                for (let v of gbl) {
                    if (param && !v.name.includes(v.name))
                        continue
                    if (!param && v.confirm < 1000)
                        continue
                    msg += v.name + `: 確` + v.confirm
                    msg += v.confirmAdd ? `(+${v.confirmAdd})` : ""
                    msg += "亡" + v.dead + "癒" + v.heal + "\n"
                }
                return msg
            } catch (e) {
                return "服务暂时不可用"
            }
        })
    },
    "pl": async function(param) {
        param = param.trim()
        if (!param) {
            let s = `-----牌理指令紹介-----
自摸例: -pl 111m234p567s1122z2z
栄和例: -pl 111m234p567s1122z+2z
★mpsz=萬筒索字 1-7z=東南西北白發中 0=赤
★未和牌的时候会自动计算向听数牌理
★查看高级用法输入: -pl 高级`
            return s
        }
        if (param === '高级') {
            let s = `-----牌理指令紹介-----
★副露&dora "-pl 33m+456p99s6666z777z+d56z"
※副露: 456p順子、9s暗槓、発明槓、中明刻 / dora: 白発
★付属役 "-pl 11123456789999m+rih21"
※付属役: 立直一発海底(南場東家)
★付属役一覧
t=天和/地和/人和
w=w立直  l(r)=立直  y(i)=一発
h=海底/河底  k=槍槓/嶺上
o=古役有効 (目前只有人和,大七星)
★場風自風設定 (default: 東場南家)
1=11=東場東家  2=12=東場南家  3=13=東場西家  4=14=東場北家
21=南場東家  22=南場南家  23=南場西家  24=南場北家
-----Code Github-----
https://github.com/takayama-lily/riichi`
            return s
        }
        try {
            let beachmark = Date.now()
            let res = new MJ(param).calc()
            let msg = param + ` (${Date.now()-beachmark}毫秒)\n`
            if (res.error) {
                return param + '\n手牌数量不正确或输入有误'
            } else if (!res.isAgari) {
                let s = ''
                if (!res.syanten.now) {
                    s += '聴牌'
                } else {
                    s += res.syanten.now + '向聴'
                }
                if (res.syanten.hasOwnProperty('wait')) {
                    s += ' 待'
                    let c = 0
                    for (let i in res.syanten.wait) {
                        s += i
                        c += parseInt(res.syanten.wait[i])
                    }
                    s += `共${c}枚`
                } else {
                    for (let i in res.syanten) {
                        if (i !== 'now' && Object.keys(res.syanten[i]).length > 0) {
                            s += '\n打' + i + ' 摸'
                            let c = 0
                            for (let ii in res.syanten[i]) {
                                s += ii
                                c += parseInt(res.syanten[i][ii])
                            }
                            s += `共${c}枚`
                        }
                    }
                }
                return msg + s
            } else {
                let s = ''
                for (let k in res.yaku)
                    s += k + ' ' + res.yaku[k] + '\n'
                s += res.text
                if (!res.ten)
                    s = '無役'
                return msg + s
            }
        } catch(e) {
            return param + '\n手牌数量不正确或输入有误'
        }
    },
    "setu": async function(param) {
        return new Promise(resolve=>{
            let data = ""
            https.get("https://api.lolicon.app/setu/?apikey=958955415e99d70b61c227&r18=0&size1200=true&keyword"+param, res=>{
                res.on("data", chunk=>data+=chunk)
                res.on("end", ()=>{
                    try {
                        data = JSON.parse(data)
                        if (!data.data.length) resolve("没找到")
                        let url = data.data[0].url
                        resolve(buildImage(url))
                    } catch(e) {
                        resolve("服务暂时不可用")
                    }
                })
            }).on("error", err=>{
                resolve("服务暂时不可用")
            })
        })
    },
    "query": async(param)=>{
        let beachmark = Date.now()
        return new Promise((resolve, reject)=>{
            db.get(param, (err, row)=>{
                beachmark = Date.now() - beachmark
                if (err)
                    resolve(err.message)
                else if (!row)
                    resolve("没有结果(" + beachmark + "ms)")
                else
                    resolve(JSON.stringify(row) + `\n(Beachmark: ${beachmark}ms)`)
            })
        })
    },
    "龙王": async(param)=>{
        let gid = param
        if (!gid) return "请在群里使用该命令"
        let offset = new Date().getTimezoneOffset() * 60000
        let today = (new Date(new Date(Date.now() + offset + 8 * 3600000).toDateString()).getTime() - offset - 8 * 3600000) / 1000
        let yesterday = today - 86400
        let sql1 = `select count(1) as cnt,account from event
            where type=2 and \`group\`='qq/group/${gid}' and account!='' and time>=${yesterday} and time<${today}
            group by account order by cnt desc limit 1`
        let sql2 = `select count(1) as cnt,account from event
            where type=2 and \`group\`='qq/group/${gid}' and account!='' and time>=${today}
            group by account order by cnt desc limit 1`
        let [str1, str2] = await Promise.all([
            new Promise((resolve, reject)=>{
                db.get(sql1, (err, row)=>{
                    if (!row)
                        resolve("昨日没有记录")
                    else
                        resolve(`昨天本群发言最多的是${at(row.account.split("/").pop())}(${row.cnt}条)`)
                })
            }),
            new Promise((resolve, reject)=>{
                db.get(sql2, (err, row)=>{
                    if (!row)
                        resolve("今日没有记录")
                    else
                        resolve(`今天截至目前最多的是${at(row.account.split("/").pop())}(${row.cnt}条)`)
                })
            }),
        ])
        return str1 + "\n" + str2
    },
    "发言": async(param)=>{
        let gid = param[0]
        let uid = param[1]
        if (!gid) return "请在群里使用该命令"
        let offset = new Date().getTimezoneOffset() * 60000
        let today = (new Date(new Date(Date.now() + offset + 8 * 3600000).toDateString()).getTime() - offset - 8 * 3600000) / 1000
        let yesterday = today - 86400
        let sql1 = `select count(1) as cnt from event
            where type=2 and \`group\`='qq/group/${gid}' and account='qq/user/${uid}' and time>=${yesterday} and time<${today}`
        let sql2 = `select count(1) as cnt from event
            where type=2 and \`group\`='qq/group/${gid}' and account='qq/user/${uid}' and time>=${today}`
        let [str1, str2] = await Promise.all([
            new Promise((resolve, reject)=>{
                db.get(sql1, (err, row)=>{
                    resolve(` 昨天你在本群发言${row.cnt}条`)
                })
            }),
            new Promise((resolve, reject)=>{
                db.get(sql2, (err, row)=>{
                    resolve(`今天截至目前你在本群发言${row.cnt}条`)
                })
            }),
        ])
        return at(uid) +str1 + "\n" + str2
    }
}
commands["雀魂"] = commands.qh
commands["排名"] = commands.rank
commands["牌理"] = commands.pl
commands["疫情"] = commands.yq
commands["新番"] = commands.bgm
commands["动漫"] = commands.anime
commands["色图"] = commands.setu

module.exports = commands
