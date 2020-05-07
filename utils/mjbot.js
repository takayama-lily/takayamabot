"use strict"
const MJSoul = require("mjsoul")

/**
 * 这是一个雀魂打牌机器人
 * 
 * 雀魂在进入牌局时，会创建一个新的ws连接，牌局结束后销毁
 * 此时会维护两个连接，一个是大厅里的，一个是牌局
 * 两个连接域名相同，前者端口号后两位是01，后者是02
 */
class Bot {
    static CLOSED = -1
    static WAITING = 0
    static MATCHING = 1
    static GAMING = 2
    static PAUSING = 3
    static READY = 4
    static FAILURE = 9

    constructor(config = {}) {
        this.lobby = new MJSoul(config)
        this.game = null
        this.accountInfo = {}
        this.status = Bot.CLOSED
        this.current = {
            connect_token: undefined,
            game_uuid: undefined,
            game_info: {}
        }
        this.waitID = 0
        this._init()
    }

    /**
     * 登陆
     * 如果只传一个account，代表用token登陆
     * @param {string} account 
     * @param {string} password 
     */
    async login(account, password) {
        this.reOpen = async()=>{
            return await this.login(account, password)
        }
        if (password === undefined) {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    this.accountInfo = await this.lobby.sendAsync("oauth2Login", {
                        type: 10,
                        access_token: token
                    })
                    resolve()
                })
            })
        } else {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    this.accountInfo = await this.lobby.sendAsync("login", {
                        account: account,
                        password: this.lobby.hash(password)
                    })
                    resolve()
                })
            })
        }
        this.status = Bot.WAITING
        if (this.accountInfo.game_info) {
            // 掉线不会回到对局中
        }
    }

    async reOpen() {}

    async sendAsync(name, data) {
        return await this.lobby.sendAsync(name, data)
    }

    _clearWaitID() {
        if (this.waitID) {
            clearTimeout(this.waitID)
            this.waitID = 0
        }
    }

    _init() {

        this.lobby.on("error", (err)=>{})
        //断线自动重连一次
        this.lobby.on("close", ()=>{
            if (this.status !== Bot.FAILURE) {
                this.status = Bot.FAILURE
                this.reOpen()
            }
        })
        this.lobby.on('NotifyAccountLogout', this.reOpen)
        this.lobby.on('NotifyAnotherLogin', this.reOpen)

        //好友房被踢通知
        this.lobby.on("NotifyRoomKickOut", (data)=>{
            if (!data.account_id) {
                this._clearWaitID()
                this.status = Bot.WAITING
            }
        })

        //游戏开始通知
        this.lobby.on("NotifyRoomGameStart", (data)=>{
            this._clearWaitID()
            this.status = Bot.GAMING
            this.current.connect_token = data.connect_token
            this.current.game_uuid = data.game_uuid
            let url = this.lobby.url.substr(0, this.lobby.url.length - 2) + "02"
            this.game = new MJSoul({
                url: url,
                timeout: this.lobby.timeout,
                wsOption: this.lobby.wsOption
            })
            this.game.on("error", (err)=>{})
            this.game.on("close", ()=>{
                this.status = bot.WAITING
            })
            this.game.on("NotifyGamePause", (data)=>{
                this.status = data.paused ? Bot.PAUSING : Bot.GAMING
            })
            this.game.on("NotifyGameTerminate", this.game.close)
            this.game.on("ActionPrototype", this._onAction)
            this.game.open(this._onGameStart)
        })
    }

    async _onGameStart(restore = false) {
        try {
            let data = await this.game.sendAsync("authGame", {
                account_id: this.accountInfo.account_id,
                token: this.current.connect_token,
                game_uuid: this.current.game_uuid
            })
            this.current.game_info = data
            if (restore) {
                // let game = await this.game.sendAsync("syncGame", {round_id: 0, step: 0})
            } else {
                await this.game.sendAsync("enterGame")
            }
        } catch(e) {}
    }

    /**
     * 比段位匹配
     * @param {number} type 3表示三麻，4表示四麻，3&4表示全部
     * @param {string} rank "low"表示低级场，"high"表示高级场，"both"表示全部
     * @returns {boolean} 
     */
    async match(type = 3&4, rank = "both") {
        if (this.status !== Bot.WAITING)
            return false
        this.status = Bot.MATCHING
        await this.lobby.sendAsync("matchGame", {match_mode: 23})
    }

    /**
     * 加入比赛场(3分钟未开自动取消)
     * @param {number} id
     * @returns {boolean} 
     */
    async joinContest(id) {
        if (this.status !== Bot.WAITING)
            return false
        try {
            let unique_id = (await this.lobby.sendAsync("fetchCustomizedContestByContestId", {contest_id: id})).contest_info.unique_id
            await this.lobby.sendAsync("startCustomizedContest", {unique_id: unique_id})
            this.status = Bot.READY
            this.waitID = setTimeout(async()=>{
                await this.lobby.sendAsync("stopCustomizedContest")
                this.status = Bot.WAITING
            }, 180000)
            return true
        } catch(e) {
            return false
        }
    }

    /**
     * 加入好友房(3分钟未开自动退出)
     * @param {number} id 
     * @returns {boolean} 
     */
    async joinRoom(id) {
        if (this.status !== Bot.WAITING)
            return false
        try {
            await this.lobby.sendAsync("joinRoom", {room_id: id})
            await this.lobby.sendAsync("readyPlay", {ready: true})
            this.status = Bot.READY
            this.waitID = setTimeout(async()=>{
                await this.lobby.sendAsync("leaveRoom")
                this.status = Bot.WAITING
            }, 180000)
            return true
        } catch(e) {
            return false
        }
    }

    d() {}
    n() {}

    _onAction(action) {
        // console.log(action)
    }
}

module.exports = Bot

// async function test() {
//     let bot = new Bot({url: "wss://gateway-hk.majsoul.com:4501"})
//     await bot.login("429245111@qq.com", "552233")
//     await bot.joinRoom(95774)
// }
// test()
