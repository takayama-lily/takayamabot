'use strict'
const Events = require('events')
/**
 * abstract qqbot api
 * ws only
 */
class QQBot extends Events {
    constructor({qq}) {
        super()
        this.qq = qq
        this.queue = {}
        this.timeout = 10000
        this.conn = null
    }
    setConn(conn) {
        this.conn = conn
        this.conn.on('message', this._onMessage)
    }
    _onMessage(data) {}
    _send(data) {}
    async _request(data) {}
    async sendPrivateMsg(uid, msg) {}
    async sendGroupMsg(gid, msg) {}
    async sendDiscussMsg(did) {}
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
    setFriendAddRequest(flag, approve, reason) {}
    setGroupRequest(flag, approve, reason) {}
    setGroupInvitation(flag, approve, reason) {}
    sendGroupNotice(gid, title, content) {}
    async getLoginInfo() {}
    async getFriendList() {}
    async getGroupList() {}
    async getGroupInfo(gid) {}
    async getGouupMemberInfo(gid, uid) {}
    async getGouupMemberList(gid) {}
    async getGroupNotice(gid) {}
    approve(origin, result = true, reason = undefined) {}
    reply(origin, msg, option = {}) {}
}
module.exports = QQBot
