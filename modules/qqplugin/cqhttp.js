'use strict'
const Events = require('events')
const stringify = require ('string.ify')

// 色情敏感词过滤
const ero = /(母狗|看批|日批|香批|批里|成人|无码|苍井空|b里|嫩b|嫩比|小便|大便|粪|屎|尿|淦|屄|屌|奸|淫|穴|yin|luan|xue|jiao|cao|sao|肏|肛|骚|逼|妓|艹|子宫|月经|危险期|安全期|戴套|无套|内射|中出|射在里|射在外|精子|卵子|受精|幼女|嫩幼|粉嫩|日我|日烂|草我|草烂|干我|日死|草死|干死|狂草|狂干|狂插|狂操|日比|草比|搞我|舔我|舔阴|浪女|浪货|浪逼|浪妇|发浪|浪叫|淫荡|淫乱|荡妇|荡女|荡货|操烂|抽插|被干|被草|被操|被日|被上|被艹|被插|被射|射爆|射了|颜射|射脸|按摩棒|肉穴|小穴|阴核|阴户|阴阜|阴蒂|阴囊|阴部|阴道|阴唇|阴茎|肉棒|阳具|龟头|勃起|爱液|蜜液|精液|食精|咽精|吃精|吸精|吞精|喷精|射精|遗精|梦遗|深喉|人兽|兽交|滥交|拳交|乱交|群交|肛交|足交|脚交|口爆|口活|口交|乳交|乳房|乳头|乳沟|巨乳|玉乳|豪乳|暴乳|爆乳|乳爆|乳首|乳罩|奶子|奶罩|摸奶|胸罩|摸胸|胸部|胸推|推油|大保健|黄片|爽片|a片|野战|叫床|露出|露b|漏出|漏b|乱伦|轮奸|轮暴|轮操|强奸|强暴|情色|色情|全裸|裸体|果体|酥痒|捏弄|套弄|体位|骑乘|后入|二穴|三穴|嬲|调教|凌辱|饥渴|好想要|性交|性奴|性虐|性欲|性行为|性爱|做爱|作爱|手淫|撸管|自慰|痴女|jj|jb|j8|j8|鸡8|鸡ba|鸡鸡|鸡巴|鸡吧|鸡儿|肉便器|rbq|泄欲|发泄|高潮|潮吹|潮喷|爽死|爽翻|爽爆|你妈|屁眼|后庭|菊花|援交|操死|插死)/ig

const stringify_config = stringify.configure({
    pure:            false,
    json:            false,
    maxDepth:        2,
    maxLength:       10,
    maxArrayLength:  20,
    maxObjectLength: 20,
    maxStringLength: 30,
    precision:       undefined,
    formatter:       undefined,
    pretty:          true,
    rightAlignKeys:  true,
    fancy:           false,
    indentation:     '  ',
})

const filter = (msg)=>{
    if (typeof msg === "undefined")
        return
    else if (typeof msg !== "string")
        msg = stringify_config(msg)
    msg = msg.replace(ero, "⃺")
    if (msg.length > 20000)
        msg = msg.substr(0, 19996) + "\n..."
    if (!msg.length)
        return
    return msg
}

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
        // console.log(data)
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
        msg = filter(msg)
        if (!msg) return
        let data = this._buildData('send_private_msg', {
            user_id: uid,
            message: msg,
            auto_escape: escape
        })
        return await this._request(data)
    }
    async sendGroupMsg(gid, msg, escape = false) {
        msg = filter(msg)
        if (!msg) return
        let data = this._buildData('send_group_msg', {
            group_id: gid,
            message: msg,
            auto_escape: escape
        })
        return await this._request(data)
    }
    async sendDiscussMsg(did, msg, escape = false) {
        msg = filter(msg)
        if (!msg) return
        let data = this._buildData('send_discuss_msg', {
            discuss_id: did,
            message: msg,
            auto_escape: escape
        })
        return await this._request(data)
    }
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
    async setFriendRequest(flag, approve = true, remark = undefined) {
        let data = this._buildData('set_friend_add_request', {
            flag: flag,
            approve: approve,
            remark: remark
        })
        return await this._request(data)
    }
    async setGroupRequest(flag, approve = true, reason = undefined) {
        let data = this._buildData('set_group_add_request', {
            flag: flag,
            type: 'add',
            approve: approve,
            reason: reason
        })
        return await this._request(data)
    }
    async setGroupInvitation(flag, approve = true, reason = undefined) {
        //手机QQ在拒绝邀请时不支持reason
        let data = this._buildData('set_group_add_request', {
            flag: flag,
            type: 'invite',
            approve: approve,
            reason: reason
        })
        return await this._request(data)
    }
    async sendGroupNotice(gid, title, content) {
        let data = this._buildData('send_group_notice', {
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
        msg = filter(msg)
        if (!msg) return
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
        // console.log(data)
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
