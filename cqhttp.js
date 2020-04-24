'use strict'
const Events = require('events')
/**
 * implement of QQBot
 */
class CQHttp extends Events {
    constructor({qq = undefined, timeout = 5000} = {}) {
        super()
        this.qq = qq
        this.timeout = timeout
        this._conn = null
        this.queue = {}
    }
    set conn(conn) {
        this._conn = conn
    }
    onEvent(data) {
        data = JSON.parse(data)
        if (this.qq && data.self_id != this.qq)
            return
        switch (data.post_type) {
            case 'request':
            case 'notice':
            case 'message':
                let event = data.post_type
                this.emit(event, data)
                event += '.' + data[event+'_type']
                this.emit(event, data)
                if (data.sub_type) {
                    event += '.' + data.sub_type
                    this.emit(event, data)
                }
                break
            default:
                if (data.echo && this.queue.hasOwnProperty(data.echo)) {
                    this.queue[data.echo](data)
                    delete this.queue[data.echo]
                } else {
                    this.emit('unhandled', data)
                }
                break
        }
    }
    async sendPrivateMsg(uid, msg, escape = false) {
        let data = this._buildData('send_private_msg', {
            user_id: uid,
            message: msg,
            auto_escape: escape
        })
        return await this._request(data)
    }
    async sendGroupMsg(gid, msg, escape = false) {
        let data = this._buildData('send_group_msg', {
            group_id: gid,
            message: msg,
            auto_escape: escape
        })
        return await this._request(data)
    }
    async sendDiscussMsg(did, msg, escape = false) {
        let data = this._buildData('send_discuss_msg', {
            discuss_id: did,
            message: msg,
            auto_escape: escape
        })
        return await this._request(data)
    }
    // async sendMsg(type, id, msg, escape = false) {
    // 不实现该方法
    // }
    async deleteMsg(mid) {
        let data = this._buildData('delete_msg', {
            message_id: mid
        })
        return await this._request(data)
    }
    async sendLike(uid, times = 10) {
        let data = this._buildData('send_like', {
            user_id: uid,
            times: times
        })
        return await this._request(data)
    }
    async setGroupKick(gid, uid, forever = false) {
        let data = this._buildData('set_group_kick', {
            group_id: gid,
            user_id: uid,
            reject_add_request: forever
        })
        return await this._request(data)
    }
    async setGroupBan(gid, uid, duration = 600) {
        let data = this._buildData('set_group_ban', {
            group_id: gid,
            user_id: uid,
            duration: duration
        })
        return await this._request(data)
    }
    async setGroupAnonymousBan(gid, flag, duration = 600) {
        let data = this._buildData('set_group_anonymous_ban', {
            group_id: gid,
            flag: flag,
            duration: duration
        })
        return await this._request(data)
    }
    async setGroupWholeBan(gid, enable = true) {
        let data = this._buildData('set_group_whole_ban', {
            group_id: gid,
            enable: enable
        })
        return await this._request(data)
    }
    async setGroupAdmin(gid, uid, enable = true) {
        let data = this._buildData('set_group_admin', {
            group_id: gid,
            user_id: uid,
            enable: enable
        })
        return await this._request(data)
    }
    async setGroupAnonymous(gid, enable = true) {
        let data = this._buildData('set_group_anonymous', {
            group_id: gid,
            enable: enable
        })
        return await this._request(data)
    }
    async setGroupCard(gid, uid, card = undefined) {
        let data = this._buildData('set_group_card', {
            group_id: gid,
            user_id: uid,
            card: card
        })
        return await this._request(data)
    }
    async setGroupLeave(gid, dismiss = false) {
        let data = this._buildData('set_group_leave', {
            group_id: gid,
            is_dismiss: dismiss
        })
        return await this._request(data)
    }
    async setGroupSpecialTitle(gid, uid, title, duration = -1) {
        let data = this._buildData('set_group_special_title', {
            group_id: gid,
            user_id: uid,
            special_title: title,
            duration: duration
        })
        return await this._request(data)
    }
    async setDiscussLeave(did) {
        let data = this._buildData('set_discuss_leave', {
            discuss_id: did
        })
        return await this._request(data)
    }
    async setFriendAddRequest(flag, approve = true, remark = undefined) {
        let data = this._buildData('set_friend_add_request', {
            flag: flag,
            approve: approve,
            remark: remark
        })
        return await this._request(data)
    }
    // setGroupAddRequest(flag, type, approve, reason) {
    // 不实现该方法
    // }
    async setGroupRequest(flag, approve = true, reason = undefined) {
        let data = this._buildData('set_group_add_request', {
            flag: flag,
            type: 'add',
            approve: approve,
            reason: reason
        })
        return await this._request(data)
    }
    async setGroupInvitation(flag, approve, reason) {
        let data = this._buildData('set_group_add_request', {
            flag: flag,
            type: 'invite',
            approve: approve,
            reason: reason
        })
        return await this._request(data)
    }
    async sendGroupNotice(gid, title, content) {
        let data = this._buildData('_send_group_notice', {
            group_id: gid,
            title: title,
            content: content
        })
        return await this._request(data)
    }
    async getLoginInfo() {
        let data = this._buildData('get_login_info')
        return await this._request(data)
    }
    async getFriendList() {
        let data = this._buildData('get_friend_list')
        return await this._request(data)
    }
    async getGroupList() {
        let data = this._buildData('get_group_list')
        return await this._request(data)
    }
    async getGroupInfo(gid, cache = true) {
        let data = this._buildData('get_group_info', {
            group_id: gid,
            no_cache: !cache
        })
        return await this._request(data)
    }
    async getGroupMemberInfo(gid, uid, cache = true) {
        let data = this._buildData('get_group_member_info', {
            group_id: gid,
            user_id: uid,
            no_cache: !cache
        })
        return await this._request(data)
    }
    async getGroupMemberList(gid) {
        let data = this._buildData('get_group_member_list', {
            group_id: gid
        })
        return await this._request(data)
    }
    async getGroupNotice(gid) {
        let data = this._buildData('_get_group_notice', {
            group_id: gid
        })
        return await this._request(data)
    }
    async getVipInfo(uid) {
        let data = this._buildData('_get_vip_info', {
            user_id: uid
        })
        return await this._request(data)
    }
    async getStatus() {
        let data = this._buildData('get_status')
        return await this._request(data)
    }
    async approve(origin, approve = true, remark = undefined) {
        let data = this._buildData('.handle_quick_operation', {
            context: origin,
            operation: {
                approve: approve,
                remark: remark,
                reason: remark
            }
        })
        return await this._request(data)
    }
    async reply(origin, msg, option = {}) {
        let data = this._buildData('.handle_quick_operation', {
            context: origin,
            operation: {
                reply: msg,
                ...option
            }
        })
        return await this._request(data)
    }
    _buildData(action, params = {}) {
        return {
            action: action,
            params: params
        }
    }
    _send(data) {
        if (!this._conn)
            return false
        this._conn.send(JSON.stringify(data))
        return true
    }
    async _request(data) {
        return new Promise((resolve, reject)=>{
            data.echo = Math.random() * Date.now()
            if (this._send(data)) {
                let id = setTimeout(()=>{
                    delete this.queue[data.echo]
                    resolve({error: 'timeout'})
                }, this.timeout)
                this.queue[data.echo] = (data)=>{
                    clearTimeout(id)
                    resolve(data)
                }
            } else {
                resolve({error: 'connection error'})
            }
        })
    }
}

module.exports = CQHttp
