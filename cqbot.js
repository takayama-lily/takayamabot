const fs = require("fs")
const vm = require("vm")
const proc = require('child_process')
const https = require("https")
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}
let timeout = 50
const sessions = {
    "private": {},
    "group": {},
    "discuss": {}
}
let ws = null

const mjutil = require("./mjutil")
const bgm = require("./bgm")
const MJ = require('riichi')

const restart = function() {
    let res = {"action": "set_restart_plugin"}
    ws.send(JSON.stringify(res))
}

const main = (conn, data)=>{
    ws = conn
    data = JSON.parse(data)
    if (data.post_type === "message") {
        if (!sessions[data.message_type]) return
        if (data.message_type === "private") {
            data.private_id = data.user_id
        }
        if (!sessions[data.message_type][data[data.message_type + "_id"]]) {
            sessions[data.message_type][data[data.message_type + "_id"]] = new Session(data)
        }
        let session = sessions[data.message_type][data[data.message_type + "_id"]]
        session.onMessage(data)
    }
    if (data.post_type === "request") {
        if (data.request_type === "friend") {
            ws.send(JSON.stringify({
                "action": "set_friend_add_request",
                "params": {
                    "flag": data.flag
                }
            }))
        }
        if (data.request_type === "group" && data.sub_type === "invite") {
            ws.send(JSON.stringify({
                "action": "set_group_add_request",
                "params": {
                    "flag": data.flag,
                    "sub_type": "invite"
                }
            }))
        }
    }
}

class Session {
    constructor(data) {
        this.action = "send_" + data.message_type + "_msg"
        for (let i in data) {
            this[i] = data[i]
        }
    }
    _send(msg) {
        if ([NaN, Infinity, -Infinity].includes(msg))
            msg = msg.toString()
        if (typeof msg === 'function')
            msg = `[Function: ${msg.name?msg.name:'anonymous'}]`
        if (typeof msg !== "string") {
            try {
                msg = JSON.stringify(msg)
            } catch (e) {
                msg = "对象过大无法保存，将被丢弃。"
            }
        }
        if (typeof msg === 'string' && msg.length > 4500)
            msg = msg.substr(0, 4495) + "\n..."
        let res = {
            "action": this.action,
            "params": {
                "user_id": this.user_id,
                "group_id": this.group_id,
                "discuss_id": this.discuss_id,
                "message": msg
            }
        }
        ws.send(JSON.stringify(res))
    }
    onMessage(data) {
        data.message = data.message.replace(/&#91;/g, "[").replace(/&#93;/g, "]").replace(/&amp;/g, "&").trim()
        let prefix = data.message.substr(0, 1)
        if (prefix === "#") {
            return
            let command = data.message.substr(1)
            if (command.substr(0, 5) === "nordo")
                command = command.substr(5)
            command = `timeout 1 bash -c "./exec ${encodeURIComponent(command)}"`
            if (!isMaster(data.user_id) || data.message.substr(1, 5) === "nordo") {
                command = `runuser www -c '${command}'`
            }
            proc.exec(command, (error, stdout, stderr) => {
                stdout ? this._send(stdout) : 0
                stderr ? this._send(stderr) : 0
            })
        } else if (prefix === "-") {
            let split = data.message.substr(1).trim().split(" ")
            let command = split.shift()
            let param = split.join(" ")
            if (command === "raw" && param.length) {
                ws.send(param)
            }
            if (isMaster(data.user_id) && command === "re") {
                this._send("重启插件")
                restart()
            }
            if (isMaster(data.user_id) && command === "run" && param.length) {
                let result
                try {
                    result = eval(data.message.substr(5))
                } catch(e) {
                    result = e.stack
                }
                this._send(result)
            }
            if (command === "uptime") {
                this._send(process.uptime() + '秒前开机')
            }
            if ((command === "雀魂" || command === "qh")) {
                if (!param.length)
                    this._send("你没有输入昵称。输入例:\n-qh 金发同盟")
                else
                    mjutil.shuibiao(param).then((res)=>{this._send(res)})
            }
            if ((command === "雀魂日服" || command === "qhjp") && param.length) {
                mjutil.shuibiao(param, true).then((res)=>{this._send(res)})
            }
            if (command === "国服排名" || command === "rank") {
                mjutil.ranking(param).then((res)=>{this._send(res)})
            }
            if (command === "日服排名" || command === "rankjp") {
                mjutil.ranking(param, true).then((res)=>{this._send(res)})
            }
            if ((command === "牌谱" || command === "pp") && param.length) {
                mjutil.paipu(param).then((res)=>{this._send(res)})
            }
            if (command === "新番" || command === "bgm") {
                bgm.getCalendar(param).then((res)=>{this._send(res)})
            }
            if (["book","anime","music","game","real"].includes(command)) {
                bgm.getBangumi(command, param).then((res)=>{this._send(res)})
            }
            if (command === "牌理" || command === "pl") {
                if (!param) {
                    let s = `-----牌理指令紹介-----
自摸例: -pl 111m234p567s1122z2z
栄和例: -pl 111m234p567s1122z+2z
★mpsz=萬筒索字 1-7z=東南西北白發中 0=赤
★未和牌的时候会自动计算向听数牌理
★查看高级用法输入: -pl 高级`
                    this._send(s)
                    return
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
                    this._send(s)
                    return
                }
                try {
                    let msg = param + '\n'
                    let res = new MJ(param).calc()
                    if (res.error) {
                        this._send(param + '\n手牌数量不正确或输入有误')
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
                        this._send(msg + s)
                    } else {
                        let s = ''
                        for (let k in res.yaku)
                            s += k + ' ' + res.yaku[k] + '\n'
                        s += res.text
                        if (!res.ten)
                            s = '無役'
                        this._send(msg + s)
                    }
                } catch(e) {
                    this._send(param + '\n手牌数量不正确或输入有误')
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
                        this._send(msg)
                    } catch (e) {
                        this._send("疫情服务暂时不可用")
                    }
                })
            }
        } else if (prefix === "!") {

        } else {
            let code = data.message
            if ((data.message.includes("this") || data.message.includes("async")) && !isMaster(data.user_id)) {
                if (prefix === "/" || prefix === "\\")
                    this._send('安全原因，代码不要包含this和async关键字。')
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
                this._send(result)
            } catch(e) {
                if (prefix === "/" || prefix === "\\") {
                    let line = e.stack.split('\n')[0].split(':').pop()
                    this._send(e.name + ': ' + e.message + ' (line: ' + parseInt(line) + ')')
                }
            }
        }
    }
}

module.exports = main
