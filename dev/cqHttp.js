'use strict'
const QQBot = require('qqbot')
/**
 * implement of QQBot
 */
class CQHttp extends QQBot {
    _onMessage(data) {
        data = JSON.parse(data)
        if (!data.self_id || data.self_id != this.qq)
            return
        switch (data.post_type) {
            case 'request':
            case 'notice':
            case 'message':
                {
                    let event = data.post_type
                    this.emit(event, data)
                    event += '.' + data[event+'_type']
                    this.emit(event, data)
                    if (data.sub_type) {
                        event += '.' + data.sub_type
                        this.emit(event, data)
                    }
                }
                break
            default:
                if (data.echo && this.queue.hasOwnProperty(data.echo))
                    this.queue[data.echo](data)
                else
                    this.emit('unhandled', data)
                break
        }
    }
    _send(data) {
        this.conn.send(JSON.stringify(data))
        return true
    }
    async _request(data) {
        return new Promise((resolve, reject)=>{
            data.echo = Math.random() * Date.now()
            if (this._send(data)) {
                let id = setTimeout(reject, timeout)
                this.queue[data.echo] = (data)=>{
                    clearTimeout(id)
                    resolve(data)
                }
            } else {
                reject()
            }
        })
    }
    async sendPrivateMsg(uid, msg) {}
    async sendGroupMsg(gid, msg) {}
    async sendDiscussMsg(did) {}
    // async sendMsg(type, id, msg) {}
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
    setFriendAddRequest(flag, approve, remark) {}
    // setGroupAddRequest(flag, type, approve, reason) {}
    setGroupRequest(flag, approve, reason) {}
    setGroupInvitation(flag, approve, reason) {}
    sendGroupNotice(gid, title, content) {}
    async getLoginInfo() {}
    async getFriendList() {}
    async getGroupList() {}
    async getGroupInfo(gid) {}
    async getGouupMemberInfo(gid, uid, noCache = true) {}
    async getGouupMemberList(gid) {}
    async getGroupNotice(gid) {}
    approve(origin, approve = true, remark = undefined) {
        data = {
            action: '.handle_quick_operation',
            params: {
                context: origin,
                operation: {
                    approve: approve,
                    remark: remark,
                    reason: remark
                }
            }
        }
        this._send(data)
    }
    reply(origin, msg, option = {}) {
        data = {
            action: '.handle_quick_operation',
            params: {
                context: origin,
                operation: {
                    reply: msg,
                    ...option
                }
            }
        }
        this._send(data)
    }
}

module.exports = CQHttp
