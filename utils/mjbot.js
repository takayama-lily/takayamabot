"use strict"
const MJSoul = require("mjsoul")
const MJ = require("riichi")

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

    static DISCARD = 1
    static CHI = 2
    static PON = 3
    static ANKAN = 4
    static MINKAN = 5
    static KAKAN = 6
    static RIICHI = 7
    static TSUMO = 8
    static RON = 9
    static KUKU = 10
    static KITA = 11

    constructor(config = {}) {
        this.lobby = new MJSoul(config)
        this.game = null
        this.accountInfo = {}
        this.status = Bot.CLOSED
        this.current = {
            connect_token: undefined,
            game_uuid: undefined,
            game_info: {},
            position: "等待" //5位数字:友人 6位数字:比赛 "match":段位
        }
        this.waitID = 0
        this.matchType = 3&4
        this.matchRank = "both"
        this.matchFlag = false //不间断进行段位匹配

        this.table = {
            seat: 0,
            bakaze: 0,
            jikaze: 0,
            tehai: [],
            furo: [],
            dora: [],
            honba: 0,
            riichi: 0,
            al: false,
            left: 0,
            score: [],
            enimy: [],
            rule: {
                type: 4,
                mode: 0,
            }
        }

        this._init()
    }

    getStatus() {
        return {
            status: this.status,
            current: this.current,
            table: this.table
        }
    }

    /**
     * login
     * 如果只传一个account不传password，代表用token登陆
     * @param {string} account 
     * @param {string} password 
     */
    async login(account, password) {
        this.reOpen = async()=>{
            return await this.login(account, password)
        }
        let id
        if (password === undefined) {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    id = (await this.lobby.sendAsync("oauth2Login", {
                        type: 10,
                        access_token: token
                    })).account_id
                    resolve()
                })
            })
        } else {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    id = (await this.lobby.sendAsync("login", {
                        account: account,
                        password: this.lobby.hash(password)
                    })).account_id
                    resolve()
                })
            })
        }
        this.accountInfo = (await this.lobby.sendAsync("fetchAccountInfo", {account_id: id})).account
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
        //lobby断线自动重连一次
        this.lobby.on("close", ()=>{
            if (this.status !== Bot.FAILURE) {
                this.status = Bot.FAILURE
                this.reOpen()
            }
        })
        this.lobby.on('NotifyAccountLogout', this.reOpen)
        this.lobby.on('NotifyAnotherLogin', this.reOpen)

        //友人kick通知
        this.lobby.on("NotifyRoomKickOut", (data)=>{
            if (!data.account_id) {
                this._clearWaitID()
                this._nextTick()
            }
        })

        //game开始通知
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
            this.game.on("error", (e)=>{})
            this.game.on("close", this._nextTick.bind(this))
            this.game.on("NotifyGamePause", (data)=>{
                this.status = data.paused ? Bot.PAUSING : Bot.GAMING
            })
            this.game.on("NotifyGameTerminate", this.game.close)
            this.game.on("NotifyGameEndResult", this.game.close)
            this.game.on("ActionPrototype", this._onAction.bind(this))
            this.game.open(this._onGameStart.bind(this))
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
            this.table.rule.type = data.seat_list.length
            this.table.seat = data.seat_list.indexOf(this.accountInfo.account_id)
            if (restore) {
                // let game = await this.game.sendAsync("syncGame", {round_id: 0, step: 0}) //todo
            } else {
                await this.game.sendAsync("enterGame")
            }
        } catch(e) {
            console.log(e)
        }
    }

    async _nextTick() {
        try {
            if (this.current.position.toString().length === 5)
                await this.lobby.sendAsync("leaveRoom")
        } catch (e) {}
        this.accountInfo = (await this.lobby.sendAsync("fetchAccountInfo", {account_id: this.accountInfo.account_id})).account
        this.status = Bot.WAITING
        this.current.position = "等待"
        if (this.matchFlag)
            return this.match()
    }

    /**
     * 段位
     * @param {number} type 3:三麻 4:四麻，3&4:全部
     * @param {string} rank "low":低級場 "high":上級場 "both":全部 todo
     * @returns {boolean} 
     */
    async match(type = this.matchType, rank = this.matchRank) {
        this.matchType = type
        this.matchRank = rank
        this.matchFlag = true
        if (this.status !== Bot.WAITING)
            return false
        this.status = Bot.MATCHING
        this.current.position = "match"
        if (type % 3 === 0) {
            let mode = this._getMatchMode(3, rank)
            for (let v of mode)
                await this.lobby.sendAsync("matchGame", {match_mode: v})
        }
        if (type % 4 === 0) {
            let mode = this._getMatchMode(4, rank)
            for (let v of mode)
                await this.lobby.sendAsync("matchGame", {match_mode: v})
        }
    }
    async stopMatch() {
        this.matchFlag = false
        if (this.status === Bot.MATCHING) {
            try {
                if (this.matchType % 3 === 0) {
                    let mode = this._getMatchMode(3, rank)
                    for (let v of mode)
                        await this.lobby.sendAsync("cancelMatch", {match_mode: v})
                }
                if (this.matchType % 4 === 0) {
                    let mode = this._getMatchMode(4, rank)
                    for (let v of mode)
                        await this.lobby.sendAsync("cancelMatch", {match_mode: v})
                }
                this._nextTick()
            } catch(e) {}
        }
    }
    _getMatchMode(type, rank) {
        if (type === 3) {
            let level = parseInt(this.accountInfo.level3.id.toString().substr(2, 1))
            switch (level) {
                case 1:
                    return [17,18]
                case 2:
                    return [17,18,19,20]
                case 3:
                    return [19,20,21,22]
                case 4:
                    return [21,22,23,24]
                case 5:
                    return [23,24,25,26]
                case 6:
                    return [25,26]
            }
        }
        if (type === 4) {
            let level = parseInt(this.accountInfo.level.id.toString().substr(2, 1))
            switch (level) {
                case 1:
                    return [2,3]
                case 2:
                    return [2,3,5,6]
                case 3:
                    return [5,6,8,9]
                case 4:
                    return [8,9,11,12]
                case 5:
                    return [11,12,14,15]
                case 6:
                    return [14,15]
            }
        }
    }

    /**
     * 大会
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
            this.current.position = id
            this.waitID = setTimeout(async()=>{
                await this.lobby.sendAsync("stopCustomizedContest")
                this._nextTick()
            }, 180000)
            return true
        } catch(e) {
            console.log(e)
            return false
        }
    }

    /**
     * 友人
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
            this.current.position = id
            this.waitID = setTimeout(async()=>{
                await this.lobby.sendAsync("leaveRoom")
                this._nextTick()
            }, 180000)
            return true
        } catch(e) {
            console.log(e)
            return false
        }
    }

    //test用
    async _createRoom() {
        await this.lobby.sendAsync("createRoom", {
            player_count: 1,
            mode: {
                mode: 3,
                ai: true
            }
        })
        await this.lobby.sendAsync("startRoom")
    }

    /**
     * 打牌、立直、抜北、暗槓、加槓、九九流局、自摸、栄和、吃、碰、明槓、見逃
     * @param {string} tile 0-9mpsz形式
     * @param {number} index 吃碰杠的选择，比如["3m|4m","4m|6m","6m|7m"]，选择吃法的index
     */
    async discard(tile, moqie = false) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.DISCARD,
            tile: tile,
            moqie: moqie,
            timeuse: 0,
            tile_state: 0
        })
    }
    async riichi(tile, moqie = false) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.RIICHI,
            tile: tile,
            moqie: moqie,
            timeuse: 0,
            tile_state: 0
        })
    }
    async kita(moqie = false) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.KITA,
            moqie: moqie,
            timeuse: 0
        })
    }
    async ankan(index = 0) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.ANKAN,
            index: index,
            timeuse: 0
        })
    }
    async kakan(index = 0) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.KAKAN,
            index: index,
            timeuse: 0
        })
    }
    async kuku() {
        await this.game.sendAsync("inputOperation", {
            type: Bot.KUKU,
            index: 0,
            timeuse: 0
        })
    }
    async tsumo() {
        await this.game.sendAsync("inputOperation", {
            type: Bot.TSUMO,
            index: 0
        })
    }
    async ron() {
        await this.game.sendAsync("inputChiPengGang", {
            type: Bot.RON,
            index: 0
        })
    }
    async chi(index = 0) {
        await this.game.sendAsync("inputChiPengGang", {
            type: Bot.CHI,
            index: index,
            timeuse: 0
        })
    }
    async pon(index = 0) {
        await this.game.sendAsync("inputChiPengGang", {
            type: Bot.PON,
            index: index,
            timeuse: 0
        })
    }
    async minkan() {
        await this.game.sendAsync("inputChiPengGang", {
            type: Bot.MINKAN,
            index: 0,
            timeuse: 0
        })
    }
    async pass() {
        await this.game.sendAsync("inputChiPengGang", {
            cancel_operation: true,
            timeuse: 0
        })
    }

    async _onAction(action) {
        switch (action.name) {
            case "ActionMJStart":
                break
            case "ActionLiuJu":
                break
            case "ActionHule":
                break
            case "ActionNewRound":
                // console.log(action.data)
                this.table.tehai = action.data.tiles
                this.table.dora = action.data.doras
                this.table.bakaze = action.data.chang
                this.table.jikaze = (this.table.seat - action.data.ju + 4) % 4
                this.table.riichi = action.data.liqibang
                this.table.honba = action.data.ben
                this.table.al = action.data.al
                this.table.left = action.data.left_tile_count
                this.table.score = action.data.scores
                break
            case "ActionNoTile":
                break
            case "ActionBaBei":
                break
            case "ActionDiscardTile":
                // console.log("seat:", action.data.seat, "出牌:", action.data.tile)
                break
            case "ActionDealTile":
                // console.log("seat:", action.data.seat, "摸牌:", action.data.tile)
                this.table.left = action.data.left_tile_count
                if (action.data.seat === this.table.seat) {
                    this.table.tehai.push(action.data.tile)
                }
                break
            case "ActionChiPengGang":
                break
            case "ActionAnGangAddGang":
                break
            default:
                break
        }
        if (action.data && action.data.operation) {
            if (action.name === "ActionNewRound") {
                await new Promise((resolve)=>{
                    setTimeout(resolve, 3000)
                })
            }
            let type = []
            for (let v of action.data.operation.operation_list) {
                type.push(v.type)
            }
            if (!type.length)
                return
            if (type.includes(Bot.TSUMO))
                return this.tsumo()
            if (type.includes(Bot.RON))
                return this.ron()
            if (type.includes(Bot.KUKU))
                return this.kuku()
            if (type.includes(Bot.KITA)) {
                this.table.tehai.splice(this.table.tehai.indexOf("4z"), 1)
                return this.kita("4z" === action.data.tile)
            }
            if (type.includes(Bot.RIICHI)) {
                let kiru = this._nanikiru()
                return this.riichi(kiru, kiru === action.data.tile)
            }
            if (type.includes(Bot.DISCARD)) {
                let kiru = this._nanikiru()
                return this.discard(kiru, kiru === action.data.tile)
            }
            return this.pass()
        }
    }

    _nanikiru() {
        const mj = new MJ(this.table.tehai.join(""))
        let result = mj.calc().syanten
        let kiru = ""
        let machi = 0
        for (let k in result) {
            if (k === "now")
                continue
            let cnt = 0
            for (let kk in result[k])
                cnt += result[k][kk]
            if (cnt >= machi) {
                machi = cnt
                kiru = k
            }
        }
        if (kiru === "5m" && !this.table.tehai.includes("5m"))
            kiru = "0m"
        if (kiru === "5p" && !this.table.tehai.includes("5p"))
            kiru = "0p"
        if (kiru === "5s" && !this.table.tehai.includes("5s"))
            kiru = "0s"
        this.table.tehai.splice(this.table.tehai.indexOf(kiru), 1)
        return kiru
    }
}

module.exports = Bot

// async function test() {
//     let bot = new Bot({url: "wss://gateway-hk.majsoul.com:4501"})
//     await bot.login("429245111@qq.com", "552233")
//     await bot.joinRoom(10560)
// }
// test()
