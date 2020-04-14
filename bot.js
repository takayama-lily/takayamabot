'use strict'
const extras = require('./extras')
const sandbox = require("./utils/sandbox")
const ero = require('./ero')
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
let ws = null

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
        data.raw_message = data.raw_message.trim()
        let prefix = data.raw_message.substr(0, 1)
        if (prefix === "!") return
        if (prefix === "-") {
            let split = data.raw_message.substr(1).trim().split(" ")
            let command = split.shift()
            let param = split.join(" ")
            if (command === "raw" && param.length) {
                ws.send(param)
            }
            if (isMaster(data.user_id) && command === "re") {
                this._send("重启插件")
                restart()
            }
            if (command === '获得管理') {
                ws.send(JSON.stringify({
                    "action": "set_group_admin",
                    "params": {
                        "user_id": this.user_id,
                        "group_id": this.group_id,
                        "enable": true
                    }
                }))
            }
            if (command === '放弃管理') {
                ws.send(JSON.stringify({
                    "action": "set_group_admin",
                    "params": {
                        "user_id": this.user_id,
                        "group_id": this.group_id,
                        "enable": false
                    }
                }))
            }
            if (isMaster(data.user_id) && command === "run" && param.length) {
                let result
                try {
                    result = eval(data.raw_message.substr(5))
                } catch(e) {
                    result = e.stack
                }
                this._send(result)
            }
            if (extras.hasOwnProperty(command)) {
                this._send(await extras[command](param))
            }
        } else {
            if (blacklist.includes(data.user_id))
                return
            let code = data.raw_message
            let debug = ["\\", '/'].includes(prefix)
            if (data.raw_message.includes("const") && !isMaster(data.user_id)) {
                if (debug)
                    this._send('const被禁止使用了')
                return
            }
            if ((data.raw_message.includes("this") || data.raw_message.includes("async")) && !isMaster(data.user_id)) {
                if (debug)
                    this._send('安全原因，代码不要包含this和async关键字。')
                return
            }
            if (debug) {
                code = code.substr(1)
            }
            code = code.replace(/[（），″“”]/g, (s)=>{
                if (["″","“","”"].includes(s)) return '"'
                // if (["‘","’"].includes(s)) return "'"
                if (s === "，") return ", "
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
