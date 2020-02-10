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
        if (typeof msg === "string" && msg.length > 2000) {
            msg = msg.substr(0, 2000) + "\n(...字数太长，只能截取一部分)"
        }
        let res = {
            "action": this.action,
            "params": {
                "user_id": this.user_id,
                "group_id": this.group_id,
                "discuss_id": this.discuss_id,
                "message": typeof msg === "string" ? msg : JSON.stringify(msg)
            }
        }
        ws.send(JSON.stringify(res))
    }
    receive(data) {
        if (data.message.includes("constructor")) return
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
            if (command === "雀魂" && param) {
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
            if (command === "帮助") {
                this._send(`固定指令:
-疫情 (查询即时疫情信息)
-雀魂 nickname (查雀魂id)
-雀魂日服 nickname (查雀魂日服id)
-牌谱 paipu_id (查牌谱)
-国服排名 (雀魂排名;三麻排名输入-国服排名 3)
-日服排名 (雀魂日服排名)
-新番 (新番时间表)
-anime name (查动漫;同类指令:book,music,game,real)
-高级 (查看高级指令)`)
            }
            if (command === "高级") {
                this._send(`高级指令:
1.执行js代码: 
    ①输入代码直接执行，如var a=1;无报错信息。
    ②代码放在斜杠后，如/var a=1;有报错信息。
2.危险指令暂时不写在这里了`)
            }
            if (command === "疫情" ) {
                let gbl = []
                new Promise(resolve=>{
                    https.get("https://view.inews.qq.com/g2/getOnsInfo?name=disease_h5", res=>{
                        res.on('data', d=>gbl.push(d))
                        res.on("end", ()=>resolve())
                    })
                }).then(()=>{
                    gbl = Buffer.concat(gbl).toString()
                    gbl = JSON.parse(JSON.parse(gbl.replace("undefined", "")).data)
                    let area = gbl.areaTree
                    let msg = "", step = 0
                    area = area[0].children.concat(area.slice(1))
                    for (let k in area) {
                        step++
                        let v = area[k]
                        let t = v.total
                        msg += step % 2  ? "\n" : "; "
                        msg += v.name + ":"
                        msg += t.confirm ? "确" + t.confirm : ""
                        msg += t.dead ? "亡" + t.dead : ""
                        msg += t.heal ? "愈" + t.heal : ""
                    }
                    msg = `国内合计:确${gbl.chinaTotal.confirm} 疑${gbl.chinaTotal.suspect} 亡${gbl.chinaTotal.dead} 愈${gbl.chinaTotal.heal}` + msg
                    msg += `\n(截至${gbl.lastUpdateTime} 来源腾讯news)`
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
