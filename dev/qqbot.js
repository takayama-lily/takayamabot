'use strict'
const Events = require('events')
const plugin = require('./cqHttp')
class QQBot extends Events {
    /**
     * @param {qq, plugin, selfEventsOnly, autoAcceptFriend} config 
     */
    constructor(config = {}) {
        for (let k in config)
            this[k] = config[k]
        this.plugin = require(this.plugin)
        this.friends = {}
        this.groups = {}
    }
    onMessage(conn, data) {
        this.conn = conn
        data = plugin.parseData(data)
        data = {
            qq: 123456,
            event: 'message',
            message: '',
            uid: 123456,
            gid: 123456
        }
        this.emit(data.event, data)
    }
    _buildMessage() {

    }
    acceptFriendRequest(token) {}
    refuseFriendRequest(token, reason) {}
    acceptGroupRequest(token) {}
    refuseGroupRequest(token, reason, forever = false) {}
    acceptGroupInvitation(token) {}
    refuseGroupInvitation(token, reason) {}
    sendPrivateMessage(uid, message, anonymous = false) {}
    sendGroupMessage(gid, message) {}
    addGroupAdmin(gid, uid) {}
    removeGroupAdmin(gid, uid) {}
    kickGroupMember(gid, uid) {}


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

module.exports = QQBot
