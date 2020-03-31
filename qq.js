'use strict'
const Events = require('events')
class QQ extends Events {
    constructor(qq, plugin) {
        this.qq = qq
        this.plugin = plugin
        this.friends = {}
        this.groups = {}
    }
    onEvent(o) {

    }
    onRequest(o) {

    }
    onMessage(o) {

    }
    send(msg) {
        if (typeof msg === 'undefined')
            return
        if (typeof msg === 'function') {
            msg = `[Function: ${msg.name?msg.name:'anonymous'}]`
        } else if (typeof msg === "object") {
            try {
                msg = JSON.stringify(msg)
            } catch (e) {
                msg = "对象过大无法保存，将被丢弃。"
            }
        } else if (typeof msg !== 'string') {
            msg = msg.toString()
        }
        if (typeof msg === 'string' && msg.length > 4500)
            msg = msg.substr(0, 4495) + "\n..."
        this.plugin
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
}

const owner = 372914165
const master = []
const isMaster = (uid)=>{
    return uid === owner || master.includes(uid)
}

module.exports = QQ
