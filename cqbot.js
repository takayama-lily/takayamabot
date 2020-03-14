const fs = require("fs")
const vm = require("vm")
const proc = require('child_process')
const https = require("https")
const master = 372914165
let sessions = {
    "private": {},
    "group": {},
    "discuss": {}
}
let ws = null

delete require.cache[require.resolve('./mjutil')]
const mjutil = require("./mjutil")
delete require.cache[require.resolve('./bgm')]
const bgm = require("./bgm")
delete require.cache[require.resolve('./riichi/index')]
const MJ = require('./riichi/index')

const restart = function() {
    let res = {"action": "set_restart_plugin"}
    ws.send(JSON.stringify(res))
}

const deal = function(data) {
    if (!data) return
    if (data.post_type === "message") {
        if (!sessions[data.message_type]) return
        if (data.message_type === "private") {
            data.private_id = data.user_id
        }
        if (!sessions[data.message_type][data[data.message_type + "_id"]]) {
            sessions[data.message_type][data[data.message_type + "_id"]] = new Session(data)
        }
        let session = sessions[data.message_type][data[data.message_type + "_id"]]
        session.receive(data)
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

const main = (conn, data)=>{
    ws = conn
    deal(JSON.parse(data))
}

class Session {
    constructor(data) {
        this.action = "send_" + data.message_type + "_msg"
        for (let i in data) {
            this[i] = data[i]
        }
    }
    _send(msg) {
        if (typeof msg !== "string") {
            try {
                msg = JSON.stringify(msg)
            } catch (e) {
                return
            }
        }
        if (msg.length > 4500) {
            msg = msg.substr(0, 4450) + "\n(...字数太长，只能截取一部分)"
        }
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
    receive(data) {
        if (data.message.includes("constructor")) {
            this._send('由于constructor有bug可在沙盒内操纵父进程，已被禁用。')
            return
        }
        data.message = data.message.replace(/&#91;/g, "[").replace(/&#93;/g, "]").trim()
        vm.runInContext("data="+JSON.stringify(data), context)
        if (data.message.substr(0, 1) === "/") {
            let result
            try {
                result = vm.runInContext(data.message.substr(1), context, {timeout: 500})
            } catch(e) {
                result = e.message
            }
            this._send(result)
        } else if (data.message.substr(0, 2) === "# ") {
            let command = data.message.substr(2)
            if (data.message.substr(2, 5) === "nordo") {
                command = data.message.substr(7)
            }
            command = `timeout 10 bash -c "./exec ${encodeURIComponent(command)}"`
            if (data.user_id !== master || data.message.substr(2, 5) === "nordo") {
                command = `runuser www -c '${command}'`
            }
            proc.exec(command, (error, stdout, stderr) => {
                stdout ? this._send(stdout) : 0
                stderr ? this._send(stderr) : 0
            })
        } else if (data.message.substr(0, 1) === "-") {
            let split = data.message.substr(1).trim().split(" ")
            let command = split.shift()
            let param = split.join(" ")
            if (command === "raw" && param) {
                ws.send(param)
            }
            if (data.user_id === master && command === "re") {
                this._send("重启插件")
                restart()
                return
            }
            if ((command === "雀魂" || command === "qh") && param) {
                mjutil.shuibiao(param).then((res)=>{this._send(res)})
            }
            if (command === "雀魂日服" && param) {
                mjutil.shuibiao(param, true).then((res)=>{this._send(res)})
            }
            if (command === "国服排名") {
                mjutil.ranking(param).then((res)=>{this._send(res)})
            }
            if (command === "日服排名") {
                mjutil.ranking(param, true).then((res)=>{this._send(res)})
            }
            if (command === "牌谱" && param) {
                mjutil.paipu(param).then((res)=>{this._send(res)})
            }
            if (command === "新番") {
                bgm.getCalendar(param).then((res)=>{this._send(res)})
            }
            if (["book","anime","music","game","real"].includes(command)) {
                bgm.getBangumi(command, param).then((res)=>{this._send(res)})
            }
            if (command === "牌理" || command === "pl") {
                if (!param) {
                    let s = `-----"-牌理(-pl)"指令紹介-----
例①自摸 "-pl 1112345678999m9m"
 ※ 手牌: 1112345678999m / 自摸: 9m
例②栄和 "-pl 1112345678999m+9m"
 ※ 手牌: 1112345678999m / 栄和: 9m
例③副露&dora "-pl 33m+456p99s6666z777z+d56z"
 ※ 副露: 456p順子、9s暗槓、発明槓、中明刻 / dora: 白発
例④付属役 "-pl 11123456789999m+rih21"
 ※ 付属役: 立直一発海底(南場東家)
-----詳細説明-----
使用方法: -pl 手牌[+栄和牌][+副露][+dora牌][+付属役]
 ※付属役一覧
    t=天和/地和/人和
    w=w立直  l(r)=立直  y(i)=一発
    h=海底/河底  k=槍槓/嶺上
 ※場風自風設定 (default: 東場南家)
    1=11=東場東家  2=12=東場南家  3=13=東場西家  4=14=東場北家
    21=南場東家  22=南場南家  23=南場西家  24=南場北家
 ※其他
    m=萬子 p=筒子 s=索子 z=字牌 1234567z=東南西北白發中 0=赤dora`
                    this._send(s)
                    return
                }
                try {
                    let msg = param + '\n'
                    let res = new MJ(param).calc()
                    if (!res.isAgari)
                        this._send(msg + '未和')
                    else if (!res.ten)
                        this._send(msg + '無役')
                    else {
                        let s = ''
                        for (let k in res.yaku)
                            s += k + ' ' + res.yaku[k] + '\n'
                        s += res.text
                        this._send(msg + s)
                    }
                } catch(e) {
                    this._send(param + '\n输入有误')
                }
            }
            if (command === "帮助" || command === "help") {
                this._send(`固定指令:
-雀魂 nickname ※查雀魂id，缩写-qh
-雀魂日服 nickname ※查雀魂日服id
-牌谱 paipu_id ※查牌谱
-国服排名 ※查雀魂排名，查三麻排名输入-国服排名 3
-日服排名 ※查雀魂日服排名
-新番 ※新番时间表
-anime name ※查动漫，同类指令:book,music,game,real
-疫情 ※查询即时疫情信息，缩写-yq
-牌理 ※(应该没bug了..)，缩写-pl
-高级 ※查看高级指令`)
            }
            if (command === "高级") {
                this._send(`高级指令:
1.执行js代码: 
    ①输入代码直接执行，如var a=1;无报错信息。
    ②代码放在斜杠后，如/var a=1;有报错信息。
    ※进程有时会重启，目前function类型变量在重启进程后无法还原
2.危险指令暂时不写在这里了`)
            }
            if (command === "疫情" || command === "yq") {
                let gbl = []
                new Promise(resolve=>{
                    https.get("https://view.inews.qq.com/g2/getOnsInfo?name=disease_other", res=>{
                        res.on('data', d=>gbl.push(d))
                        res.on("end", ()=>resolve())
                    })
                }).then(()=>{
                    gbl = Buffer.concat(gbl).toString()
                    gbl = JSON.parse(JSON.parse(gbl.replace("undefined", "")).data).foreignList
                    let msg = ''
                    for (let v of gbl) {
                        msg += v.name + `(${v.date.substr(1)}): 確` + v.confirm
                        msg += v.confirmAdd ? `(+${v.confirmAdd})` : ''
                        msg += ' 亡' + v.dead + ' 癒' + v.heal + '\n'
                    }
                    this._send(msg)
                })
            }
        } else if (data.message.substr(0, 1) === "!") {

        } else {
            try {
                let result = vm.runInContext(data.message, context, {timeout: 500})
                this._send(result)
            } catch(e) {
                if (Math.random() > 0.999) {
                    //this._send(`输入"-帮助"查看指令列表。`)
                }
            }
        }
    }
}

module.exports = main
