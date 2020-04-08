'use strict'
const Events = require('events')
/**
 * abstract qq api
 * ws only
 */
class QQBot extends Events {
    constructor({qq, token}) {
        super()
        this.qq = qq
        this.token = token
        this.queue = {}
        this.timeout = 10000
        this.conn = null
    }
    onConn(conn) {

    }
    _onMessage(data) {}
    _send(data) {}
    async sendPrivateMsg(uid, msg) {}
    async sendGroupMsg(gid, msg) {}
    async sendDiscussMsg(did) {}
    async sendMsg() {}
    deleteMsg(mid) {}
    sendLike(uid) {}
    setGroupKick(gid) {}
    setGroupBan(gid) {}
    setGroupAnonymousBan(gid) {}
    setGroupWholeBan(gid) {}
    setGroupAdmin(gid) {}
    setGroupAnonymous(gid) {}
    setGroupCard(gid) {}
    setGroupLeave(gid) {}
    setGroupSpecialTitle(gid) {}
    setDiscussLeave(did) {}
    async _request(data) {}
    approve(origin, result = true, remark = undefined) {}
    reply(origin, msg, option = {}) {}
}

module.exports = QQBot
