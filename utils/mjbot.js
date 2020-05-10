"use strict"
const EventEmitter = require("events")
const MJSoul = require("mjsoul")
const nanikiru = require("./nanikiru")

/**
 * 这是一个雀魂打牌机器人
 * 
 * 雀魂在进入牌局时，会创建一个新的ws连接，牌局结束后销毁
 * 此时会维护两个连接，一个是大厅里的，一个是牌局
 * 两个连接域名相同，前者端口号后两位是01，后者是02
 */
class Bot extends EventEmitter {
    static CLOSED = -1
    static WAITING = 0
    static MATCHING = 1
    static GAMING = 2
    static PAUSING = 3
    static READY = 4
    static FAILURE = 5

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
    static PASS = 12

    constructor(config = {}) {
        super()
        this.lobby = new MJSoul(config)
        this.game = null
        this.accountInfo = {}
        this.status = Bot.CLOSED
        this.current = {
            connect_token: undefined,
            game_uuid: undefined,
            game_info: {},
            position: "lobby" //5位数字:友人 6位数字:比赛 "rank":段位 "lobby":待机
        }

        this.waitID = 0
        this._maxWaitTime = 60 //最大等待时间，不开自动退出

        this.matchType = 3&4
        this.matchRank = "both"
        this.matchFlag = false //不间断进行段位匹配

        this.table = {
            seat: 0, //自座席 0-3東南西北
            bakaze: 0, //場風 0-3東南西北
            jikaze: 0, //自風 0-3東南西北
            tehai: [], //自手牌配列
            hai: "", //トリガー牌
            from: 0, //from座席
            hints: [],
            dora: [], //表ドラ配列
            honba: 0, //本場数
            riichi: 0, //立直数
            isAL: false, //all last
            left: 0, //残牌数
            score: [], //各家点数(seat順)
            players: [], // {0: {furo:[], kawa: [], isRiichi: 0, riichiHai: ""}} (seat順)
            rules: {
                type: 4, //3三麻 4四麻
                mode: 0, //東風 東南 todo
            }
        }

        this.reOpen = async()=>{}
        this._init()
    }

    set maxWaitTime(maxWaitTime) {
        this._maxWaitTime = maxWaitTime
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
     * @param {string} account 邮箱/手机/token
     * @param {string} password 
     */
    async login(account, password) {
        account = account.toString().trim()
        this.reOpen = async()=>{
            return await this.login(account, password)
        }
        let resLogin
        if (password === undefined) {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    resLogin = await this.lobby.sendAsync("oauth2Login", {
                        type: 10,
                        access_token: token
                    })
                    resolve()
                })
            })
        } else {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    resLogin = await this.lobby.sendAsync("login", {
                        account: account,
                        password: this.lobby.hash(password),
                        type: isNaN(account) ? 0 : 1
                    })
                    resolve()
                })
            })
        }
        await this.lobby.sendAsync("loginBeat", {contract: "DF2vkXCnfeXp4WoGrBGNcJBufZiMN3uP"})
        if (resLogin.game_info) {
            this.current.connect_token = resLogin.game_info.connect_token
            this.current.game_uuid = resLogin.game_info.game_uuid
        }
        this.accountInfo = (await this.lobby.sendAsync("fetchAccountInfo")).account
        this.status = Bot.WAITING
        this.current.position = "lobby"
        if (this.current.game_uuid && !this.game) {
            // 掉线 todo
        }
        return resLogin
    }

    async sendAsync(name, data) {
        return await this.lobby.sendAsync(name, data)
    }

    _clearWaitID() {
        clearTimeout(this.waitID)
        this.waitID = 0
    }

    _init() {
        this.lobby.on("error", (err)=>{})
        //lobby断线自动重连一次
        this.lobby.on("close", ()=>{
            if (this.status !== Bot.FAILURE) {
                this.status = Bot.FAILURE
                this.reOpen()
            } else {
                this.emit("close")
            }
        })
        this.lobby.on('NotifyAccountLogout', (data)=>{
            this.reOpen()
        })
        this.lobby.on('NotifyAnotherLogin', (data)=>{
            this.reOpen()
        })

        //友人kick通知
        this.lobby.on("NotifyRoomKickOut", (data)=>{
            if (!data.account_id) {
                this._clearWaitID()
                this._nextTick()
            }
        })

        //game开始通知
        this.lobby.on("NotifyRoomGameStart", this._onGameStart.bind(this))
        this.lobby.on("NotifyMatchGameStart", this._onGameStart.bind(this))
    }

    async _onGameStart(data) {
        this._clearWaitID()
        this.status = Bot.GAMING
        this.current.connect_token = data.connect_token
        this.current.game_uuid = data.game_uuid
        if (this.lobby.url[this.lobby.url.length-1] === "/")
            this.lobby.url = this.lobby.url.substr(0, this.lobby.url.length-1)
        let url = this.lobby.url.substr(0, this.lobby.url.length - 2) + "02"
        this.game = new MJSoul({
            url: url,
            timeout: this.lobby.timeout,
            wsOption: this.lobby.wsOption
        })
        this.game.on("error", (e)=>{})
        this.game.on("close", ()=>{
            if (this.current.game_uuid) {
                //掉线 todo
            }
            this.game = null
            this._nextTick()
        })
        this.game.on("NotifyGamePause", (data)=>{
            this.status = data.paused ? Bot.PAUSING : Bot.GAMING
        })
        this.game.on("NotifyGameTerminate", this._onGameOver.bind(this))
        this.game.on("NotifyGameEndResult", this._onGameOver.bind(this))
        this.game.on("ActionPrototype", this._onAction.bind(this))
        this.game.open(async()=>{
            try {
                let data = await this.game.sendAsync("authGame", {
                    account_id: this.accountInfo.account_id,
                    token: this.current.connect_token,
                    game_uuid: this.current.game_uuid
                })
                this.current.game_info = data
                this.table.rules.type = data.seat_list.length
                this.table.seat = data.seat_list.indexOf(this.accountInfo.account_id)
                await this.game.sendAsync("enterGame")
            } catch(e) {}
        })
    }
    _onGameOver() {
        this.current.connect_token = undefined
        this.current.game_uuid = undefined
        this.current.game_info = undefined
        this.game.close()
    }

    async _nextTick() {
        try {
            this.accountInfo = (await this.lobby.sendAsync("fetchAccountInfo")).account
            if (this.matchFlag) {
                if (this.accountInfo.room_id > 0)
                    await this.roomLeave()
                this.status = Bot.WAITING
                return await this.match()
            } else if (this.accountInfo.room_id > 0) {
                await this.roomReady()
                this.waitID = setTimeout(async()=>{
                    await this.roomLeave()
                    this._nextTick()
                }, this._maxWaitTime * 1000 + 30000)
            } else {
                this.status = Bot.WAITING
                this.current.position = "lobby"
            }
        } catch (e) {
            console.log(e)
        }
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
        try {
            if (type % 3 === 0) {
                let mode = this._getMatchMode(3, rank)
                for (let v of mode) {
                    await this.lobby.sendAsync("matchGame", {match_mode: v})
                    this.status = Bot.MATCHING
                }
            }
            if (type % 4 === 0) {
                let mode = this._getMatchMode(4, rank)
                for (let v of mode) {
                    await this.lobby.sendAsync("matchGame", {match_mode: v})
                    this.status = Bot.MATCHING
                }
            }
        } catch(e) {
            console.log(e)
        }
        if (this.status === Bot.MATCHING) {
            this.current.position = "rank"
            return true
        }
        return false
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
            } catch(e) {
                console.log(e)
            }
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
    async contestReady(id) {
        if (this.status !== Bot.WAITING || this.matchFlag)
        return {error: {message: "正在对局中，无法加入。", code: -1}}
        try {
            let unique_id = (await this.lobby.sendAsync("fetchCustomizedContestByContestId", {contest_id: id})).contest_info.unique_id
            await this.lobby.sendAsync("startCustomizedContest", {unique_id: unique_id})
            this.status = Bot.READY
            this.current.position = id
            this.waitID = setTimeout(async()=>{
                await this.contestCancel()
                this._nextTick()
            }, this._maxWaitTime * 1000)
            return {}
        } catch(e) {
            switch (e.error.code) {
                case 1023:
                    e.error.message = `正在对局中，无法加入。`
                    break
                case 2501:
                    e.error.message = `赛事${id}不存在。`
                    break
                case 2511:
                    e.error.message = `没有赛事${id}的参赛资格。`
                    break
                default:
                    console.log(e)
                    e.error.message = `对局中，无法加入。`
                    break
            }
            return e
        }
    }
    async contestCancel() {
        try {
            await this.lobby.sendAsync("stopCustomizedContest")
        } catch(e) {
            console.log(e)
        }
    }

    /**
     * 友人
     * @param {number} id 
     * @returns {boolean} 
     */
    async roomJoin(id) {
        if (this.status !== Bot.WAITING || this.matchFlag)
            return {error: {message: "正在对局中，无法加入。", code: -1}}
        try {
            await this.lobby.sendAsync("joinRoom", {room_id: id})
            await this.roomReady()
            this.current.position = id
            this.waitID = setTimeout(async()=>{
                await this.roomLeave()
                this._nextTick()
            }, this._maxWaitTime * 1000)
            return {}
        } catch(e) {
            switch (e.error.code) {
                case 1100:
                    e.error.message = `房间号${id}不存在。`
                    break
                case 1105:
                    e.error.message = `已经加入了这个房间。`
                    break
                case 1109:
                    e.error.message = `正在对局中，无法加入。`
                    break
                default:
                    console.log(e)
                    e.error.message = `对局中，无法加入。`
                    break
            }
            return e
        }
    }
    async roomLeave() {
        try {
            await this.lobby.sendAsync("leaveRoom")
        } catch(e) {
            console.log(e)
        }
    }
    async roomReady() {
        try {
            await this.lobby.sendAsync("readyPlay", {ready: true})
            this.status = Bot.READY
        } catch(e) {
            console.log(e)
            await this.roomLeave()
            this._nextTick()
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
    async discard(tile) {
        let moqie = tile === this.table.tehai[this.table.tehai.length-1]
        this.table.tehai.splice(this.table.tehai.indexOf(tile), 1)
        await this.game.sendAsync("inputOperation", {
            type: Bot.DISCARD,
            tile: tile,
            moqie: moqie,
            timeuse: 1,
            tile_state: 0
        })
    }
    async riichi(tile) {
        let moqie = tile === this.table.tehai[this.table.tehai.length-1]
        this.table.tehai.splice(this.table.tehai.indexOf(tile), 1)
        await this.game.sendAsync("inputOperation", {
            type: Bot.RIICHI,
            tile: tile,
            moqie: moqie,
            timeuse: 1,
            tile_state: 0
        })
    }
    async kita() {
        let moqie = "4z" === this.table.tehai[this.table.tehai.length-1]
        this.table.tehai.splice(this.table.tehai.indexOf("4z"), 1)
        await this.game.sendAsync("inputOperation", {
            type: Bot.KITA,
            moqie: moqie,
            timeuse: 1
        })
    }
    async ankan(index = 0) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.ANKAN,
            index: index,
            timeuse: 1
        })
    }
    async kakan(index = 0) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.KAKAN,
            index: index,
            timeuse: 1
        })
    }
    async kuku() {
        await this.game.sendAsync("inputOperation", {
            type: Bot.KUKU,
            index: 0,
            timeuse: 1
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
            timeuse: 1
        })
    }
    async pon(index = 0) {
        await this.game.sendAsync("inputChiPengGang", {
            type: Bot.PON,
            index: index,
            timeuse: 1
        })
    }
    async minkan() {
        await this.game.sendAsync("inputChiPengGang", {
            type: Bot.MINKAN,
            index: 0,
            timeuse: 1
        })
    }
    async pass() {
        await this.game.sendAsync("inputChiPengGang", {
            cancel_operation: true,
            timeuse: 1
        })
    }

    async _onAction(action) {
        let data = action.data
        // console.log(data)
        switch (action.name) {
            case "ActionMJStart":
            case "ActionNoTile":
                return
            case "ActionHule":
            case "ActionLiuJu":
                this.game.sendAsync("confirmNewRound").catch(()=>{})
                return
            case "ActionNewRound":
                //初期化
                this.table.bakaze = data.chang
                this.table.jikaze = (this.table.seat - data.ju + this.table.rules.type) % this.table.rules.type
                this.table.tehai = data.tiles
                this.table.hai = ""
                this.table.from = this.table.seat
                this.table.dora = data.doras
                this.table.honba = data.ben
                this.table.riichi = data.liqibang
                this.table.isAL = false
                this.table.left = data.left_tile_count
                this.table.score = data.scores
                this.table.players = []
                for (let i = 0; i < this.table.rules.type; i++) {
                    this.table.players[i] = {
                        furo: [],
                        kawa: [],
                        isRiichi: 0,
                        riichiHai: ""
                    }
                }
                break
            case "ActionBaBei":
                //副露变更(抜北)
                this.table.players[data.seat].furo.push("4z")
                this.table.from = data.seat
                this.table.hai = "4z"
                break
            case "ActionDiscardTile":
                //牌河变更
                this.table.players[data.seat].kawa.push(data.tile)
                this.table.from = data.seat
                this.table.hai = data.tile
                if (data.is_liqi || data.is_wliqi) {
                    //立直
                    this.table.players[data.seat].isRiichi = data.is_wliqi ? 2 : 1
                    this.table.players[data.seat].riichiHai = data.tile
                }
                break
            case "ActionDealTile":
                //摸牌
                this.table.left = data.left_tile_count
                this.table.from = data.seat
                this.table.hai = data.tile
                if (data.seat === this.table.seat) {
                    this.table.tehai.push(data.tile)
                }
                break
            //副露变更
            case "ActionChiPengGang":
                for (let v of data.froms) {
                    if (v !== data.seat) {
                        //被吃碰杠的牌
                        let last = this.table.players[v].kawa.pop()
                        this.table.players[v].kawa.push("!"+last)
                    }
                }
                this.table.players[data.seat].furo.push(data.tiles.sort().join(""))
                break
            case "ActionAnGangAddGang":
                this.table.from = data.seat
                this.table.hai = data.tiles
                if (data.type === 3)
                    this.table.players[data.seat].furo.push(data.tiles.repeat(2))
                else {
                    for (let i in this.table.players[data.seat].furo) {
                        if (this.table.players[data.seat].furo[i].includes(data.tiles))
                            this.table.players[data.seat].furo[i] += data.tiles
                    }
                }
                break
        }
        if (data.doras && data.doras.length > 0) {
            //dora变更
            this.table.dora = data.doras
        }
        if (data.liqi) {
            //立直成功 立直棒&点数变更
            this.table.riichi = data.liqi.liqibang
            this.table.score[data.liqi.seat] = data.liqi.score
        }
        if (data && data.operation) {
            // console.log(data.operation.operation_list)
            if (action.name === "ActionNewRound") {
                await new Promise((resolve)=>{
                    setTimeout(resolve, 3000)
                })
            }
            let types = []
            for (let v of data.operation.operation_list) {
                types.push(v.type)
            }
            if (!types.length)
                return
            this.table.hints = types
            let res = nanikiru(this.table)
            switch (res.type) {
                case Bot.DISCARD:
                    return this.discard(res.tiles)
                case Bot.RIICHI:
                    return this.riichi(res.tiles)
                case Bot.KITA:
                    return this.kita()
                case Bot.KUKU:
                    return this.kuku()
                case Bot.TSUMO:
                    return this.tsumo()
                case Bot.RON:
                    return this.ron()
                case Bot.MINKAN:
                    if (this.table.hai[0] === "0")
                        this.table.hai = "5" + this.table.hai[1]
                    while (this.table.tehai.includes(this.table.hai))
                        this.table.tehai.splice(this.table.tehai.indexOf(this.table.hai), 1)
                    if (this.table.hai[0] === "5")
                        this.table.tehai.splice(this.table.tehai.indexOf("0"+this.table.hai[1]), 1)
                    return this.minkan()
                case Bot.ANKAN:
                    for (let v of data.operation.operation_list) {
                        if (v.type === Bot.ANKAN) {
                            for (let i in v.combination) {
                                if (v.combination[i].includes(res.tiles)) {
                                    while (this.table.tehai.includes(res.tiles))
                                        this.table.tehai.splice(this.table.tehai.indexOf(res.tiles), 1)
                                    if (res.tiles[0] === "5")
                                        this.table.tehai.splice(this.table.tehai.indexOf("0"+res.tiles[1]), 1)
                                    return this.ankan(i)
                                }
                            }
                        }
                    }
                case Bot.KAKAN:
                    for (let v of data.operation.operation_list) {
                        if (v.type === Bot.KAKAN) {
                            for (let i in v.combination) {
                                if (v.combination[i].includes(res.tiles)) {
                                    this.table.tehai.splice(this.table.tehai.indexOf(res.tiles), 1)
                                    return this.kakan(i)
                                }
                            }
                        }
                    }
                case Bot.CHI:
                    for (let v of data.operation.operation_list) {
                        if (v.type === Bot.CHI) {
                            for (let v of res.tiles.split("|"))
                                this.table.tehai.splice(this.table.tehai.indexOf(v), 1)
                            return this.chi(v.combination.indexOf(res.tiles))
                        }
                    }
                case Bot.PON:
                    for (let v of data.operation.operation_list) {
                        if (v.type === Bot.PON) {
                            for (let v of res.tiles.split("|"))
                                this.table.tehai.splice(this.table.tehai.indexOf(v), 1)
                            return this.pon(v.combination.indexOf(res.tiles))
                        }
                    }
                case Bot.PASS:
                    return this.pass()
            }
        }
    }
}

module.exports = Bot

// async function test() {
//     let bot = new Bot({url: "wss://gateway-hk.majsoul.com:4501"})
//     bot.on("close", ()=>{
//         console.log(1)
//     })
//     let res
//     res = await bot.login("372914165@qq.com", "552233")
//     // res = await bot.contestReady(917746)
//     // res = await bot.roomJoin(12308)
//     await bot.match(3)
// }
// test()
