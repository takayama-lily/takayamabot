"use strict"
const EventEmitter = require("events")
const MJSoul = require("mjsoul")
const MPSZ = ['m', 'p', 's', 'z']

/**
 * 这是一个雀魂打牌机器人
 * 
 * 雀魂在进入牌局时，会创建一个新的ws连接，牌局结束后销毁
 * 此时会维护两个连接，一个是大厅里的，一个是牌局
 * 两个连接域名相同，前者端口号后两位是01，后者是02
 */
class Bot extends EventEmitter {

    /**
     * 状態類型：未连接、待机中、匹配中、游戏中、游戏暂停、准备中、连接断开
     */
    static CLOSED = -1
    static WAITING = 0
    static MATCHING = 1
    static GAMING = 2
    static PAUSING = 3
    static READY = 4
    static FAILURE = 5

    /**
     * 操作類型：1~12 出牌、吃、碰、暗槓、明槓、加槓、立直、自摸、栄和、九九流局、北、見逃
     */
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

    /**
     * from 9牌山 8嶺上
     */
    static YAMA = 9
    static RINSHAN = 8

    /**
     * 0一局戦 1
     * 23東風戦 2半荘戦
     */
    static FIGHT1 = 0
    static FIGHT4 = 1
    static FIGHT8 = 2

    constructor(config = {}) {
        super()
        this.lobby = new MJSoul(config) //lobby ws connection
        this.game = null //game ws connection
        this.account_info = {}
        this.status = Bot.CLOSED
        this.current = {
            connect_token: undefined,
            game_uuid: undefined,
            game_info: {},
            position: "lobby" //5位数字:友人 6位数字:比赛 "rank":段位 "lobby":待机
        }

        this.wait_id = 0
        this.wait_timeout = 60 //最大等待时间，不开自动退出

        this.match_type = 3&4
        this.match_rank = "both"
        this.match_flag = false //不间断进行段位匹配
        this.match_name = {
            2: "銅之間四人東",
            3: "銅之間四人南",
            5: "銀之間四人東",
            6: "銀之間四人南",
            8: "金之間四人東",
            9: "金之間四人南",
            11: "玉之間四人東",
            12: "玉之間四人南",
            14: "王座之間四人東",
            15: "王座之間四人南",
            17: "銅之間三人東",
            18: "銅之間三人南",
            19: "銀之間三人東",
            20: "銀之間三人南",
            21: "金之間三人東",
            22: "金之間三人南",
            23: "玉之間三人東",
            24: "玉之間三人南",
            25: "王座之間三人東",
            26: "王座之間三人南",
            29: "休闲场四人東",
            30: "休闲场四人南",
            31: "休闲场三人東",
            32: "休闲场三人南",
        }

        // 该变量通过operation事件传到外部 手牌使用mpsz格式
        this.round = {
            seat: 0, //自座席 0-3東南西北起，永远不变
            bakaze: 0, //場風 0-3東南西北
            kyoku: 0, //局 0-3一二三四
            tehai: [], //自手牌
            hai: "", //触发操作的牌
            from: 0, //触发操作的牌的玩家座席，9牌山 8嶺上
            dora: [], //ドラ指示牌
            honba: 0, //本場棒数
            riichi: 0, //立直棒数
            is_al: false, //是否all last
            left: 0, //残牌数
            score: [], //各家点数(seat順)
            players: [ //各家情况(seat順)
                {
                    furo: [], //副露；1s2s3s 1s1s1s 1s1s1s1s 1s1s 的形式；单4z为拔北
                    kawa: [], //牌河；小写表示手切，大写表示模切；索引代表旬目，被跳过则值为null，保证所有人旬目相同；鸣牌则所有人增加一旬null；被鸣的牌加叹号记为如"!1z"的形式
                    is_riichi: 0, //0:未立直 1:立直 2:W立直
                    riichi_i: -1 //立直旬目
                }
            ],
            rules: {
                type: 4, //3三麻 4四麻
                mode: 2, //0一局 1東風 2東南
            },
            hints: [], //操作提示1-11
        }
        this.action = {}

        this.reOpen = async()=>{}
        
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
        this.lobby.on("NotifyRoomGameStart", (data)=>{
            this._onGameStart(data)
        })
        this.lobby.on("NotifyMatchGameStart", (data)=>{
            this.current.position = this.match_name[data.match_mode_id]
            this._onGameStart(data)
        })
    }

    getStatus() {
        return {
            status: this.status,
            current: this.current,
            round: this.round
        }
    }

    /**
     * login
     * 如果只传一个account不传password，代表用token登陆
     * @param {string} account 邮箱/手机/token
     * @param {string} password 
     */
    async login(account, password) {
        if (account)
            account = account.toString().trim()
        this.reOpen = async()=>{
            return await this.login(account, password)
        }
        let res_login
        if (password === undefined) {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    res_login = await this.lobby.sendAsync("oauth2Login", {
                        type: 10,
                        access_token: account,
                        client_version_string: "web-0.9.205"
                    })
                    resolve()
                })
            })
        } else {
            await new Promise((resolve, reject)=>{
                this.lobby.open(async()=>{
                    res_login = await this.lobby.sendAsync("login", {
                        account: account,
                        password: this.lobby.hash(password),
                        client_version_string: "web-0.9.205",
                        type: isNaN(account) ? 0 : 1
                    })
                    resolve()
                })
            })
        }
        await this.lobby.sendAsync("loginBeat", {contract: "DF2vkXCnfeXp4WoGrBGNcJBufZiMN3uP"})
        if (res_login.game_info) {
            this.current.connect_token = res_login.game_info.connect_token
            this.current.game_uuid = res_login.game_info.game_uuid
        }
        this.account_info = (await this.lobby.sendAsync("fetchAccountInfo")).account
        this.status = Bot.WAITING
        this.current.position = "lobby"
        if (this.current.game_uuid && !this.game) {
            // 掉线 todo
        }
        return res_login
    }

    async sendAsync(name, data) {
        return await this.lobby.sendAsync(name, data)
    }

    //----------------------------------------------------------------------------------------------------

    async _onGameStart(data) {
        this._clearWaitID()
        this.status = Bot.GAMING
        this.current.connect_token = data.connect_token
        this.current.game_uuid = data.game_uuid
        // if (this.lobby.url[this.lobby.url.length-1] === "/")
        //     this.lobby.url = this.lobby.url.substr(0, this.lobby.url.length-1)
        // let url = this.lobby.url.substr(0, this.lobby.url.length - 2) + "02"
        let url = "wss://gateway-v2.maj-soul.com:7443"
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
                    account_id: this.account_info.account_id,
                    token: this.current.connect_token,
                    game_uuid: this.current.game_uuid
                })
                this.current.game_info = data
                this.round.rules.type = data.seat_list.length
                this.round.seat = data.seat_list.indexOf(this.account_info.account_id)
                if ([3,4,13,14].includes(data.game_config.mode.mode))
                    this.round.rules.mode = Bot.FIGHT1
                else if ([1,11].includes(data.game_config.mode.mode))
                    this.round.rules.mode = Bot.FIGHT4
                else if ([2,12].includes(data.game_config.mode.mode))
                    this.round.rules.mode = Bot.FIGHT8
                await this.game.sendAsync("enterGame")
            } catch(e) {
                console.log(e)
            }
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
            this.account_info = (await this.lobby.sendAsync("fetchAccountInfo")).account
            if (this.match_flag) {
                if (this.account_info.room_id > 0)
                    await this.roomLeave()
                this.status = Bot.WAITING
                return await this.match()
            } else if (this.account_info.room_id > 0) {
                await this.roomReady()
                this.wait_id = setTimeout(async()=>{
                    await this.roomLeave()
                    this._nextTick()
                }, this.wait_timeout * 1000 + 30000)
            } else {
                this.status = Bot.WAITING
                this.current.position = "lobby"
            }
        } catch (e) {
            console.log(e)
        }
    }

    _clearWaitID() {
        clearTimeout(this.wait_id)
        this.wait_id = 0
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * 段位
     * @param {number} type 3:三麻 4:四麻，3&4:全部
     * @param {string} rank "low":低級場 "high":上級場 "both":全部 todo
     * @returns {boolean} 
     */
    async match(type = this.match_type, rank = this.match_rank) {
        this.match_type = type
        this.match_rank = rank
        this.match_flag = true
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
        this.match_flag = false
        if (this.status === Bot.MATCHING) {
            try {
                if (this.match_type % 3 === 0) {
                    let mode = this._getMatchMode(3, this.match_rank)
                    for (let v of mode)
                        await this.lobby.sendAsync("cancelMatch", {match_mode: v})
                }
                if (this.match_type % 4 === 0) {
                    let mode = this._getMatchMode(4, this.match_rank)
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
            let level = parseInt(this.account_info.level3.id.toString().substr(2, 1))
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
            let level = parseInt(this.account_info.level.id.toString().substr(2, 1))
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

    //----------------------------------------------------------------------------------------------------

    /**
     * 大会
     * @param {number} id
     * @returns {boolean} 
     */
    async contestReady(id) {
        if (this.status !== Bot.WAITING || this.match_flag)
        return {error: {message: "正在对局中，无法加入哦。", code: -1}}
        try {
            let unique_id = (await this.lobby.sendAsync("fetchCustomizedContestByContestId", {contest_id: id})).contest_info.unique_id
            await this.lobby.sendAsync("startCustomizedContest", {unique_id: unique_id})
            this.status = Bot.READY
            this.current.position = id
            this.wait_id = setTimeout(async()=>{
                await this.contestCancel()
                this._nextTick()
            }, this.wait_timeout * 1000)
            return {}
        } catch(e) {
            switch (e.error.code) {
                case 1023:
                    e.error.message = `正在对局中，无法加入哦。`
                    break
                case 2501:
                    e.error.message = `赛事${id}找不到哦。`
                    break
                case 2511:
                    e.error.message = `没有赛事${id}的参赛资格。`
                    break
                default:
                    console.log(e)
                    e.error.message = `对局中，无法加入哦。`
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
        if (this.status !== Bot.WAITING || this.match_flag)
            return {error: {message: "正在对局中，无法加入哦。", code: -1}}
        try {
            await this.lobby.sendAsync("joinRoom", {room_id: id})
            await this.roomReady()
            this.current.position = id
            this.wait_id = setTimeout(async()=>{
                await this.roomLeave()
                this._nextTick()
            }, this.wait_timeout * 1000)
            return {}
        } catch(e) {
            switch (e.error.code) {
                case 1100:
                    e.error.message = `房间${id}找不到哦。`
                    break
                case 1101:
                    e.error.message = `房间${id}满员，赶紧踢一个吧。`
                    break
                case 1105:
                    e.error.message = `已经加入了这个房间。`
                    break
                case 1109:
                    e.error.message = `正在对局中，无法加入哦。`
                    break
                default:
                    console.log(e)
                    e.error.message = `对局中，无法加入哦。`
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

    //----------------------------------------------------------------------------------------------------

    _isTsumoKiri(hai) {
        //判断模切
        return hai === this.round.tehai[this.round.tehai.length-1]
    }

    /**
     * 打牌、立直、抜北、暗槓、加槓、九九流局、自摸、栄和、吃、碰、明槓、見逃
     * @param {string} tile 0-9mpsz形式
     * @param {number} index 吃碰杠的选择，比如["3m|4m","4m|6m","6m|7m"]，选择吃法的index
     */
    async discard(hai) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.DISCARD,
            tile: hai,
            moqie: this._isTsumoKiri(hai),
            timeuse: 1,
            tile_state: 0
        })
    }
    async riichi(hai) {
        await this.game.sendAsync("inputOperation", {
            type: Bot.RIICHI,
            tile: hai,
            moqie: this._isTsumoKiri(hai),
            timeuse: 1,
            tile_state: 0
        })
    }
    async kita() {
        await this.game.sendAsync("inputOperation", {
            type: Bot.KITA,
            moqie: this._isTsumoKiri("4z"),
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
 
    //----------------------------------------------------------------------------------------------------

    _isMe(seat) {
        return seat === this.round.seat
    }
    _tehaiLost(hai) {
        this.round.tehai.splice(this.round.tehai.indexOf(hai), 1)
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
                this.round.bakaze = data.chang
                this.round.kyoku = data.ju
                this.round.tehai = data.tiles
                this.round.hai = ""
                this.round.from = this.round.seat
                this.round.dora = data.doras
                this.round.honba = data.ben
                this.round.riichi = data.liqibang
                this.round.is_al = false
                this.round.left = data.left_tile_count
                this.round.score = data.scores
                this.round.players = []
                for (let i = 0; i < this.round.rules.type; i++) {
                    this.round.players[i] = {
                        furo: [],
                        kawa: [],
                        is_riichi: 0,
                        riichi_i: -1
                    }
                }
                break
            case "ActionDealTile":
                //摸牌
                this.round.left = data.left_tile_count
                this.round.from = data.seat
                this.round.hai = data.tile
                if (this._isMe(data.seat)) {
                    this.round.tehai.push(data.tile)
                }
                break
            case "ActionBaBei":
                //抜北
                this.round.players[data.seat].furo.push("4z")
                this.round.from = data.seat
                this.round.hai = "4z"
                if (this._isMe(data.seat)) {
                    this._tehaiLost("4z")
                }
                break
            case "ActionDiscardTile":
                //切牌 手切记为小写，模切记为大写
                let hai = data.moqie ? data.tile[0] + data.tile[1].toUpperCase() : data.tile[0] + data.tile[1].toLowerCase()
                this.round.players[data.seat].kawa.push(hai)
                this.round.from = data.seat
                this.round.hai = data.tile
                if (data.is_liqi || data.is_wliqi) {
                    //立直
                    this.round.players[data.seat].is_riichi = data.is_wliqi ? 2 : 1
                    this.round.players[data.seat].riichi_i = this.round.players[data.seat].kawa.length
                }
                if (this._isMe(data.seat)) {
                    this._tehaiLost(data.tile)
                }
                break
            case "ActionChiPengGang":
                for (let i in data.froms) {
                    let seat = data.froms[i]
                    if (seat !== data.seat) {
                        //被吃碰杠的牌
                        let last = this.round.players[seat].kawa.pop()
                        this.round.players[seat].kawa.push("!"+last)
                        //被跳过的人增加一旬
                        let skip = (data.seat - seat + this.round.rules.type) % this.round.rules.type - 1
                        for (let n = 1; n <= skip; n++) {
                            this.round.players[(seat + n) % this.round.rules.type].kawa.push(null)
                        }
                    } else if (this._isMe(seat)) {
                        this._tehaiLost(data.tiles[i])
                    }
                }
                this.round.players[data.seat].furo.push(data.tiles.sort().join(""))
                break
            case "ActionAnGangAddGang":
                this.round.from = data.seat
                this.round.hai = data.tiles
                if (data.type === 3) { //暗槓
                    this.round.players[data.seat].furo.push(data.tiles.repeat(2))
                    if (this._isMe(data.seat)) {
                        let hai = data.tiles.replace("0", "5")
                        while (this.round.tehai.includes(hai))
                            this._tehaiLost(hai)
                        if (hai[0] === "5" && hai[1] !== "z") {
                            hai = "0"+hai[1]
                            while (this.round.tehai.includes(hai))
                                this._tehaiLost(hai)
                        }
                    }
                } else { //加槓
                    for (let i in this.round.players[data.seat].furo) {
                        if (this.round.players[data.seat].furo[i].includes(data.tiles.replace("0", "5")))
                            this.round.players[data.seat].furo[i] += data.tiles
                    }
                    if (this._isMe(data.seat)) {
                        this._tehaiLost(data.tiles)
                    }
                }
                break
        }
        if (data.doras && data.doras.length > 0) {
            //dora变更
            this.round.dora = data.doras
        }
        if (data.liqi) {
            //立直成功 立直棒&点数变更
            this.round.riichi = data.liqi.liqibang
            this.round.score[data.liqi.seat] = data.liqi.score
        }
        // console.log(this.round, this.round.players)
        if (data && data.operation) {
            // console.log(data.operation.operation_list)
            if (action.name === "ActionNewRound") {
                // 新开局的时候，3秒以后才能出牌
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
            this.round.hints = types
            this.action = action
            this.emit("operation", this.round)
        } else {
            //鸣牌增加一旬
            if (["ActionBaBei","ActionChiPengGang","ActionAnGangAddGang"].includes(action.name)) {
                for (let i in this.round.players)
                    this.round.players[i].kawa.push(null)
            }
        }
    }

    _naru(type, hai) {
        for (let v of this.action.data.operation.operation_list) {
            if (v.type === Bot[type.toUpperCase()]) {
                for (let i in v.combination) {
                    if (v.combination[i].includes(hai)) {
                        return this[type.toLowerCase()](0)
                    }
                }
            }
        }
    }

    /**
     * 使用 bot.on("operation", (round)=>{
     *      // 监听可操作的事件
     *      // 会得到一个round对象
     *      // 然后调用该方法进行打牌操作
     * }) 
     * @param {number} type 操作類型1~12；出牌、吃、碰、暗槓、明槓、加槓、立直、自摸、栄和、九九流局、北、見逃
     * @param {string} hai 牌；出牌或立直或暗杠或加杠格式是"5m", 吃是"4m|6m", 碰是"5m|0m", 自摸荣和流局拔北明杠见逃为空
     */
    doAction(type, hai) {
        switch (type) {
            case Bot.DISCARD:
                this.discard(hai)
                break
            case Bot.RIICHI:
                this.riichi(hai)
                break
            case Bot.KITA:
                this.kita()
                break
            case Bot.KUKU:
                this.kuku()
                break
            case Bot.TSUMO:
                this.tsumo()
                break
            case Bot.RON:
                this.ron()
                break
            case Bot.MINKAN:
                this.minkan()
                break
            case Bot.ANKAN:
                this._naru("ankan", hai)
                break
            case Bot.KAKAN:
                this._naru("kakan", hai)
                break
            case Bot.CHI:
                this._naru("chi", hai)
                break
            case Bot.PON:
                this._naru("pon", hai)
                break
            case Bot.PASS:
                this.pass()
                break
            default:
                break
        }
    }

    //其他api
    //login(account, password) 登录(支持邮箱、手机、token)
    //match(type, mode) 段位匹配，会等当前游戏结束
    //stopMatch() 停止段位匹配，会等当前游戏结束
    //getStatus() 获取当前bot状态
    //roomJoin(room_id) 加入友人房并准备
    //roomLeave() 离开友人房
    //contestReady(contest_id) 大会室准备
    //contestCancel() 大会室取消准备
    //sendAsync(name, data) 大厅查询
}

module.exports = Bot
