'use strict'
const blacklist = [3507349275,429245111]
const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}
const reboot = ()=>{
    process.exit(1)
}
const sessions = {
    "private": {},
    "group": {},
    "discuss": {}
}
let ws = null

// 固定指令
const commands = require('./commands')

// 沙盒初始化
const sandbox = require("./utils/sandbox")
sandbox.require("向听", require('syanten'))
let timeout = 50

// 敏感词
const ero = require('./ero')

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
    if (data.post_type === "notice") {
        if (data.notice_type === "group_ban" && data.sub_type === "ban") {
            if (data.user_id === data.self_id && data.duration > 86400)
                ws.send(JSON.stringify({
                    "action": "set_group_leave",
                    "params": {
                        "group_id": data.group_id
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
            if (!msg.length)
                return
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
            if (isMaster(data.user_id) && command === "raw" && param.length)
                return ws.send(param)
            if (command === '获得管理') {
                return ws.send(JSON.stringify({
                    "action": "set_group_admin",
                    "params": {
                        "user_id": data.user_id,
                        "group_id": data.group_id,
                        "enable": true
                    }
                }))
            }
            if (command === '放弃管理') {
                return ws.send(JSON.stringify({
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
                return this._send(result)
            }
            if (command === '龙王')
                param = data.group_id
            if (command === '发言')
                param = [data.group_id, data.user_id]
            if (commands.hasOwnProperty(command)) {
                return this._send(await commands[command](param))
            }
        } else {
            if (blacklist.includes(data.user_id))
                return
            return this._send(sandbox.run(data, timeout, isMaster(data.user_id)))
        }
    }
}

module.exports = main
