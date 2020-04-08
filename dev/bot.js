'use strict'
const proc = require('child_process')
const https = require("https")
const MJ = require('riichi')
const mjutil = require("./utils/majsoul")
const bgm = require("./utils/bgm")
const mjutil = require("./utils")
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}
let timeout = 50


const qqbot = new CQPlugin({

})

qqbot.on('message.group')


const main = (client, data)=>{
    data.message = data.message.replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&amp;/g, "&").trim()
    let prefix = data.message.substr(0, 1)
    if (prefix === "-") {
        let split = data.message.substr(1).trim().split(" ")
        let command = split.shift()
        let param = split.join(" ")
        if (command === "raw" && param.length) {
            ws.send(param)
        }
        if (isMaster(data.user_id) && command === "re") {
            client.send("重启插件")
            restart()
        }
        if (isMaster(data.user_id) && command === "run" && param.length) {
            let result
            try {
                result = eval(data.message.substr(5))
            } catch(e) {
                result = e.stack
            }
            client.send(result)
        }
        if (command === "uptime") {
            client.send(process.uptime() + '秒前开机')
        }
        if ((command === "雀魂" || command === "qh")) {
            if (!param.length)
                client.send("你没有输入昵称。输入例:\n-qh 金发同盟")
            else
                mjutil.shuibiao(param).then((res)=>{client.send(res)})
        }
        if ((command === "雀魂日服" || command === "qhjp") && param.length) {
            mjutil.shuibiao(param, true).then((res)=>{client.send(res)})
        }
        if (command === "国服排名" || command === "rank") {
            mjutil.ranking(param).then((res)=>{client.send(res)})
        }
        if (command === "日服排名" || command === "rankjp") {
            mjutil.ranking(param, true).then((res)=>{client.send(res)})
        }
        if ((command === "牌谱" || command === "pp") && param.length) {
            mjutil.paipu(param).then((res)=>{client.send(res)})
        }
        if (command === "新番" || command === "bgm") {
            bgm.getCalendar(param).then((res)=>{client.send(res)})
        }
        if (["book","anime","music","game","real"].includes(command)) {
            bgm.getBangumi(command, param).then((res)=>{client.send(res)})
        }
        if (command === "牌理" || command === "pl") {
            if (!param) {
                let s = `-----"-牌理(-pl)"指令紹介-----
例①自摸 "-pl 1112345678999m9m"
★手牌: 1112345678999m / 自摸: 9m
例②栄和 "-pl 1112345678999m+9m"
★手牌: 1112345678999m / 栄和: 9m
例③副露&dora "-pl 33m+456p99s6666z777z+d56z"
★副露: 456p順子、9s暗槓、発明槓、中明刻 / dora: 白発
例④付属役 "-pl 11123456789999m+rih21"
★付属役: 立直一発海底(南場東家)
-----詳細説明-----
使用方法: -pl 手牌[+栄和牌][+副露][+dora牌][+付属役]
★付属役一覧
t=天和/地和/人和
w=w立直  l(r)=立直  y(i)=一発
h=海底/河底  k=槍槓/嶺上
o=古役有効 (目前只有人和,大七星)
★場風自風設定 (default: 東場南家)
1=11=東場東家  2=12=東場南家  3=13=東場西家  4=14=東場北家
21=南場東家  22=南場南家  23=南場西家  24=南場北家
★其他
m=萬子 p=筒子 s=索子 z=字牌 1234567z=東南西北白發中 0=赤dora
★向聴牌理計算
未和牌的时候会自动计算
-----Code Github-----
https://github.com/takayama-lily/riichi`
                client.send(s)
                return
            }
            try {
                let msg = param + '\n'
                let res = new MJ(param).calc()
                if (res.error) {
                    client.send(param + '\n手牌数量不正确或输入有误')
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
                    client.send(msg + s)
                } else {
                    let s = ''
                    for (let k in res.yaku)
                        s += k + ' ' + res.yaku[k] + '\n'
                    s += res.text
                    if (!res.ten)
                        s = '無役'
                    client.send(msg + s)
                }
            } catch(e) {
                client.send(param + '\n手牌数量不正确或输入有误')
            }
        }
        if (command === "疫情" || command === "yq") {
            let gbl = []
            new Promise(resolve=>{
                https.get("https://view.inews.qq.com/g2/getOnsInfo?name=disease_foreign", res=>{
                    res.on('data', d=>gbl.push(d))
                    res.on("end", ()=>resolve())
                }).on("error", err=>{})
            }).then(()=>{
                try {
                    gbl = Buffer.concat(gbl).toString()
                    gbl = JSON.parse(JSON.parse(gbl.replace("undefined", "")).data).foreignList
                    let msg = `国外主要疫情(${gbl[0].date.substr(1)}):\n`
                    for (let v of gbl) {
                        if (v.confirm < 100 || !v.dead)
                            continue
                        msg += v.name + `: 確` + v.confirm
                        msg += v.confirmAdd ? `(+${v.confirmAdd})` : ''
                        msg += '亡' + v.dead + '癒' + v.heal + '\n'
                    }
                    client.send(msg)
                } catch (e) {
                    client.send("疫情服务暂时不可用")
                }
            })
        }
    } else if (prefix === "!") {

    } else {
        let code = data.message
        if ((data.message.includes("this") || data.message.includes("async")) && !isMaster(data.user_id)) {
            if (prefix === "/" || prefix === "\\")
                client.send('安全原因，代码不要包含this和async关键字。')
            return
        }
        if (prefix === "/" || prefix === "\\") {
            code = code.substr(1)
        }
        try {
            vm.runInContext("data="+JSON.stringify(data), context)
            vm.runInContext("Object.freeze(data);Object.freeze(data.sender);Object.freeze(data.anonymous);", context)
            code = code.replace(/[（），″“”]/g, (s)=>{
                if (["″","“","”"].includes(s)) return '"'
                // if (["‘","’"].includes(s)) return "'"
                if (s === "，") return ", "
                return String.fromCharCode(s.charCodeAt(0) - 65248)
            })
            let result = vm.runInContext(code, context, {timeout: timeout})
            client.send(result)
        } catch(e) {
            if (prefix === "/" || prefix === "\\") {
                let line = e.stack.split('\n')[0].split(':').pop()
                client.send(e.name + ': ' + e.message + ' (line: ' + parseInt(line) + ')')
            }
        }
    }
}

module.exports = main
