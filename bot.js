'use strict'
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('/var/www/db/eventv2.db')
const extras = require('./extras')
const sandbox = require("./utils/sandbox")
const ero = require('./ero')
const whitelist = [199711085,933269791,331678612,701548657,601691323,231406576]
const blacklist = [3507349275,429245111]
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
const at = (qq)=>`[CQ:at,qq=${qq}]`
let ws = null

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
        let message = ""
        for (let v of data.message) {
            if (v.type === "text")
                message += v.data.text
            else if (v.type) {
                if (v.type === 'at')
                    message += "\""
                message += "[CQ:" + v.type
                for (let k in v.data)
                    message += `,${k}=${v.data[k]}`
                message += "]"
                if (v.type === 'at')
                    message += "\""
            }
        }
        data.message = message
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
        if (typeof msg === 'undefined')
            return
        if (typeof msg === 'function')
            msg = `[Function: ${msg.name?msg.name:'anonymous'}]`
        if (typeof msg === "object") {
            try {
                msg = JSON.stringify(msg)
            } catch (e) {
                msg = "对象过大无法保存，将被丢弃。"
            }
        } else if (typeof msg !== 'string') {
            msg = msg.toString()
        }
        if (typeof msg === 'string') {
            msg = msg.replace(ero, '**')
            if (msg.length > 4500)
                msg = msg.substr(0, 4495) + "\n..."
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
    async onMessage(data) {
        data.message = data.message.trim()
        let prefix = data.message.substr(0, 1)
        if (prefix === "!") return
        if (prefix === "-") {
            let split = data.message.substr(1).trim().split(" ")
            let command = split.shift()
            let param = split.join(" ")
            if (isMaster(data.user_id) && command === "raw" && param.length) {
                ws.send(param)
            }
            // if (isMaster(data.user_id) && command === "re") {
            //     this._send("重启插件")
            //     let res = {"action": "set_restart_plugin"}
            //     ws.send(JSON.stringify(res))
            // }
            if (command === 'query' && param) {
                let beachmark = Date.now()
                db.get(param, (err, row)=>{
                    beachmark = Date.now() - beachmark
                    if (err)
                        this._send(err.message)
                    else if (!row)
                        this._send("没有结果("+beachmark+"ms)")
                    else
                        this._send(JSON.stringify(row)+`\n(Beachmark: ${beachmark}ms)`)
                })
            }
            if (command === '龙王') {
                let offset = new Date().getTimezoneOffset() * 60000
                let today = (new Date(new Date(Date.now() + offset + 8 * 3600000).toDateString()).getTime() - offset - 8 * 3600000) / 1000
                let yesterday = today - 86400
                let sql1 = `select count(1) as cnt,account from event
                    where type=2 and \`group\`='qq/group/${this.group_id}' and account!='' and time>=${yesterday} and time<${today}
                    group by account order by cnt desc limit 1`
                let sql2 = `select count(1) as cnt,account from event
                    where type=2 and \`group\`='qq/group/${this.group_id}' and account!='' and time>=${today}
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
                this._send(str1+"\n"+str2)
            }if (command === '发言') {
                let offset = new Date().getTimezoneOffset() * 60000
                let today = (new Date(new Date(Date.now() + offset + 8 * 3600000).toDateString()).getTime() - offset - 8 * 3600000) / 1000
                let yesterday = today - 86400
                let sql1 = `select count(1) as cnt from event
                    where type=2 and \`group\`='qq/group/${data.group_id}' and account='qq/user/${data.user_id}' and time>=${yesterday} and time<${today}`
                let sql2 = `select count(1) as cnt from event
                    where type=2 and \`group\`='qq/group/${data.group_id}' and account='qq/user/${data.user_id}' and time>=${today}`
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
                this._send(at(data.user_id)+str1+"\n"+str2)
            }
            if (command === '获得管理') {
                ws.send(JSON.stringify({
                    "action": "set_group_admin",
                    "params": {
                        "user_id": data.user_id,
                        "group_id": data.group_id,
                        "enable": true
                    }
                }))
            }
            if (command === '放弃管理') {
                ws.send(JSON.stringify({
                    "action": "set_group_admin",
                    "params": {
                        "user_id": data.user_id,
                        "group_id": data.group_id,
                        "enable": false
                    }
                }))
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
            if (command === "setu" && !whitelist.includes(data.group_id)) {
                this._send("这里不够纯洁，无法使用此服务。")
                return
            }
            if (extras.hasOwnProperty(command)) {
                this._send(await extras[command](param))
            }
        } else {
            if (blacklist.includes(data.user_id))
                return
            let code = data.message
            let debug = ["\\"].includes(prefix)
            if (data.message.includes("const") && !isMaster(data.user_id)) {
                if (debug)
                    this._send('const被禁止使用了')
                return
            }
            if ((data.message.includes("this") || data.message.includes("async")) && !isMaster(data.user_id)) {
                if (debug)
                    this._send('安全原因，代码不要包含this和async关键字。')
                return
            }
            if (debug) {
                code = code.substr(1)
            }
            code = code.replace(/(（|）|，|″|“|”|＝)/g, (s)=>{
                if (["″","“","”"].includes(s)) return '"'
                // if (["‘","’"].includes(s)) return "'"
                if (s === "，") return ", "
                if (s === "＝") return "="
                return String.fromCharCode(s.charCodeAt(0) - 65248)
            })
            sandbox.run("data="+JSON.stringify(data), 50)
            sandbox.run("Object.freeze(data);Object.freeze(data.sender);Object.freeze(data.anonymous);", 50)
            let result = sandbox.run(code, timeout, debug)
            this._send(result)
        }
    }
}

module.exports = main
