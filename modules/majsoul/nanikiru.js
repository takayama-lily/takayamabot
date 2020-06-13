"use strict"
const MJ = require("riichi")
const agari = require("agari")
const sht = require("syanten")
const MPSZ = ['m', 'p', 's', 'z']

/**
 * 操作類型：1~12 出牌、吃、碰、暗槓、明槓、加槓、立直、自摸、栄和、九九流局、北、見逃
 */
const OPERATION = {
    DISCARD: 1,
    CHI:     2,
    PON:     3,
    ANKAN:   4,
    MINKAN:  5,
    KAKAN:   6,
    RIICHI:  7,
    TSUMO:   8,
    RON:     9,
    KUKU:   10,
    KITA:   11,
    PASS:   12,
}

/**
 * from 9牌山 8嶺上
 */
const FROM = {
    YAMA: 9,
    RINSHAN: 8,
}

/**
 * 0一局戦 1東風戦 2半荘戦
 */
const MODE = {
    FIGHT1: 0,
    FIGHT4: 1,
    FIGHT8: 2,
}

/**
 * 打牌策略
 * 根据场况调整(立直、副露、点差)
 */
const POLICY = {
    FULL_ATTACK: Symbol("全攻不留安"),
    HALF_ATTACK: Symbol("半攻留安"),
    HALF_DEFEND: Symbol("半防不退向听"),
    FULL_DEFEND: Symbol("全防弃胡"),
    FULL_ATTACK_BEFORE: 6,
    HALF_DEFEND_AFTER: 12,
}

const HAND_KOKUSI = Symbol("国士向手牌")
const HAND_CHITUI = Symbol("七対向手牌")
const HAND_COMMON = Symbol("一般向手牌")
const HAI_VALUES = {}
HAI_VALUES[HAND_KOKUSI] = {
    DORA: 8,
    5: 2,       //中张5
    HAI3: 5,   //牌残枚数
    HAI2: 4,
    HAI1: 1,
    HAI0: -100,
    KOTSU: -100,//>=3枚(刻子槓子)
    TUITSU: 20  //対子
}
HAI_VALUES[HAND_CHITUI] = {
    DORA: 8,
    ROTO: 2,
    5: 2,
    HAI3: 5,
    HAI2: 4,
    HAI1: 1,
    HAI0: -100,
    KOTSU: -100
}
HAI_VALUES[HAND_COMMON] = {
    DORA: 5,
    YAKU3: 2,
    YAKU2: -100,
    YAKU1: -50,
    YAKU0: -50,
    JI3: -100,
    JI2: -100,
    JI1: -50,
    JI0: -50
}

class NaniKiru {
    constructor(round) {
        //round对象至少需要包含如下字段；牌用mpsz格式表示
        this.round = {
            seat: 0, //自座席 0-3東南西北起，永远不变
            bakaze: 0, //場風 0-3東南西北
            kyoku: 0, //局 0-3一二三四
            tehai: [], //自手牌
            hai: "", //触发操作的牌
            from: 0, //触发操作的牌的玩家座席，9牌山 8嶺上
            dora: [], //表ドラ
            honba: 0, //本場棒数
            riichi: 0, //立直棒数
            // is_al: false, //是否all last
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
                kuitan: true,
                aka_num: 3
            },
            hints: [], //操作提示1-11
        }

        round.tehai_arr = this.transToHaiArr(round.tehai)
        switch (round.rules.mode) {
            case MODE.FIGHT1:
                round.is_al = true
                break
            case MODE.FIGHT4:
                round.is_al = round.kyoku >= (round.type - 1)
                break
            case MODE.FIGHT8:
            default:
                round.is_al = round.bakaze >= 1 && (round.kyoku >= (round.type - 1))
                break
        }

        this.round = round
        this.round.jikaze = this.getKaze(this.round.seat)
        this.syanten = sht.syanten(this.round.tehai_arr)
        this.syanten7 = sht.syanten7(this.round.tehai_arr)
        this.syanten13 = sht.syanten13(this.round.tehai_arr)

        //dora牌
        this.round.dorahints = this.round.dora
        this.round.dora = []
        for (let v of this.round.dorahints) {
            v = v.replace(/0/g, "5")
            if (v[1] === "z") {
                let dora
                switch (v[0]) {
                    case "1":
                        dora = "2z"
                        break
                    case "2":
                        dora = "3z"
                        break
                    case "3":
                        dora = "4z"
                        break
                    case "4":
                        dora = "1z"
                        break
                    case "5":
                        dora = "6z"
                        break
                    case "6":
                        dora = "7z"
                        break
                    case "7":
                        dora = "5z"
                        break
                }
                this.round.dora.push(dora)
            } else {
                if (v[0] === "9")
                    this.round.dora.push("1"+v[1])
                else
                    this.round.dora.push(parseInt(v[0])+1+v[1])
            }
        }

        this.decidePolicy()
        this.type = 0
        this.hai = ""
    }

    decidePolicy() {
        this.policy = POLICY.FULL_ATTACK
    }

    getKaze(seat) {
        return (seat - this.round.kyoku + this.round.rules.type) % this.round.rules.type
    }
    isOya(seat) {
        return this.getKaze(seat) === 0
    }

    isMenzen() {
        for (let v of this.round.players[this.round.seat].furo) {
            if (v.length > 4)
                return false
        }
        return true
    }
    countRoto() {
        let tmp_roto = [
            this.round.tehai_arr[0][0], this.round.tehai_arr[0][8],
            this.round.tehai_arr[1][0], this.round.tehai_arr[1][8],
            this.round.tehai_arr[2][0], this.round.tehai_arr[2][8],
            ...this.round.tehai_arr[3]
        ]
        let cnt = 0
        for (let v of tmp_roto)
            cnt += v > 0
        return cnt
    }
    countToitsu() {
        return 6 - this.syanten7
    }
    createTmpTehai() {
        return this.round.tehai.map((v)=>{
            return v.replace("0", "5")
        })
    }
    transToHaiArr(tehai) {
        let hai_arr = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0]
        ]
        for (let v of tehai) {
            let n = parseInt(v[0])
            n = n === 0 ? 5 : n
            let i = MPSZ.indexOf(v[1])
            hai_arr[i][n-1]++
        }
        return hai_arr
    }
    isYakuhai(hai) {
        return ["5z","6z","7z",(this.round.bakaze+1)+"z",(this.round.jikaze+1)+"z"].includes(hai)
    }
    isDorahai(hai) {
        return hai[0] === "0" || this.round.dora.includes(hai)
    }
    isRotohai(hai) {
        return hai[1] === "z" || ["1","9"].includes(hai[0])
    }
    isJihai(hai) {
        return hai[1] === "z" || (this.round.rules.type === 3 && ["1m","9m"].includes(hai))
    }
    is19hai(hai) {
        return !this.isJihai(hai) && ["1","9"].includes(hai[0])
    }
    // _isSuji(hai, sujihai) {
    //     if (hai[1] === "z")
    //         return false
    //     // switch (hai[0]) {
    //     //     case ""
    //     // }
    // }
    // _countAnpaiPlayers(hai) {
    //     let cnt = 0
    //     for (let player of this.round.players) {
    //         for (let v of player.kawa) {
    //             v = v.replace(/0/g, "5").replace("!","")
    //             if (hai === v) {
    //                 cnt++
    //                 break
    //             }
    //         }
    //     }
    //     return cnt
    // }
    // _countSujiPlayers(hai) {
    //     let cnt = 0
    //     for (let player of this.round.players) {
    //         for (let v of player.kawa) {
    //             v = v.replace(/0/g, "5").replace("-","")
    //             if (this._isSuji(v, hai)) {
    //                 cnt++
    //                 break
    //             }
    //         }
    //     }
    //     return cnt
    // }
    countAppeared(hai) {
        let cnt = 0
        for (let player of this.round.players) {
            for (let v of player.kawa) {
                if (v && hai === v.replace("0", "5").toLowerCase())
                    cnt++
            }
            for (let v of player.furo) {
                v = v.replace(/0/g, "5")
                if (v.length === 4)
                    v += v
                while (v.includes(hai)) {
                    v = v.replace(hai, "")
                    cnt++
                }
            }
        }
        for (let v of this.round.dorahints) {
            cnt += v === hai
        }
        return cnt
    }
    isAllast() {
        return this.round.is_al === true
    }

    /**
     * 获得自己点位
     * @return {number}
     */
    getMyRanking() {
        let my_score = this.round.score[this.round.seat]
        let score = [...this.round.score].sort((a, b) => a - b)
        return score.indexOf(my_score) + 1
    }

    /**
     * 获得与第n名的点差
     * @param {number} n 
     * @return {number}
     */
    getScoreMinus(n) {
        if (n === 4 && this.round.rules.type === 3) n = 3
        let my_score = this.round.score[this.round.seat]
        let score = [...this.round.score].sort((a, b) => a - b)
        return my_score - score[n-1]
    }

    /**
     * 评估对手打点
     * @param {number} seat 
     * @return {number}
     */
    estimateEnemyScore(seat) {
        let han = 0
        if (this.round.players[seat].is_riichi > 0) {
            han += is_riichi + this.round.dora.length
        }
        for (let v of this.round.players[seat].furo) {
            if (v === "4z")
                ++han
            let i = 0
            let hai
            while (hai = v.substr(i, 2)) {
                i += 2
                if (this.isDorahai(hai))
                    ++han
            }
        }
        let score = han * 2000
        if (this.isOya(seat))
            score *= 1.5
        return score
    }

    /**
     * 牌价值計算
     * @param {object} type HAND_KOKUSHI / HAND_CHITUI / HAND_COMMON
     * @param {string} hai mpsz格式手牌
     * @return {number} 牌价值
     */
    calcHaiValue(type, hai) {
        let hai_value = 0
        switch (type) {
            case HAND_KOKUSI:
            case HAND_CHITUI:
                {
                    if (this.isDorahai(hai))
                        hai_value += HAI_VALUES[type].DORA
                    if (hai[0] === "5")
                        hai_value += HAI_VALUES[type]["5"]
                    let left = 3 - this.countAppeared(hai)
                    hai_value += HAI_VALUES[type]["HAI"+left]
                    if (this.isDorahai(hai))
                        hai_value += HAI_VALUES[type].DORA
                    let num = this.round.tehai.reduce((cnt, curr)=>{
                        return curr === hai ? cnt + 1 : cnt
                    }, 0)
                    if (num >= 3)
                        hai_value += HAI_VALUES[type].KOTSU
                    if (type === HAND_KOKUSI) {
                        if (num === 2)
                            hai_value += HAI_VALUES[type].TUITSU
                    } else {
                        if (this.isRotohai(hai))
                            hai_value += HAI_VALUES[type].ROTO
                    }
                }
                break
            case HAND_COMMON:
            default:
                {
                    if (this.isDorahai(hai))
                        hai_value += HAI_VALUES[type].DORA
                    let left = 3 - this.countAppeared(hai)
                    if (this.isYakuhai(hai))
                        hai_value += HAI_VALUES[type]["YAKU"+left]
                    else if (this.isJihai(hai))
                        hai_value += HAI_VALUES[type]["JI"+left]
                    if (!this.isRotohai(hai))
                        hai_value = (5 - Math.abs(5-hai[0])) * 3
                }
                break
        }
        return hai_value
    }

    /**
     * 模拟和牌
     * @param {array} tehai 
     * @return {object}
     */
    simAgari(tehai) {
        const aka = []
        for (let v of this.round.tehai) {
            if (v[0] === 0)
                aka.push(v)
        }
        for (let i = 0; i < tehai.length; ++i) {
            let aka_i = aka.indexOf(tehai[i])
            if (aka_i >= 0)
                tehai[i] = aka[aka_i], aka[aka_i] = null
        }
        let agari_hai = tehai.pop()
        let str = tehai.join("") + "+" + agari_hai
        let furo = ""
        for (let v of this.round.players[this.round.seat].furo) {
            if (v === "4z")
                continue
            furo += v.split(v[v.length-1]).join("") + v[v.length-1]
        }
        if (furo) str += "+" + furo
        let dora = ""
        for (let v of this.round.dora)
            dora += v
        if (dora) str += "+d" + dora
        str += "+l" + (this.round.bakaze + 1) + (this.round.jikaze + 1)
        let mj = new MJ(str)
        if (!this.round.rules.kuitan)
            mj.disableKuitan()
        return mj.calc()
    }

    //----------------------------------------------------------------------------------------------------

    isHandKokusi() {
        return this.syanten13 !== -2 && this.syanten13 < this.syanten && this.syanten13 <= this.syanten7
    }
    isHandChitoi() {
        return this.syanten7 !== -2 && this.syanten7 < this.syanten
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * 自摸不分高低目，但是确4要见逃
     */
    adviceTsumo() {
        if (!this.round.hints.includes(OPERATION.TSUMO))
            return false
        // todo 确4见逃判断
        this.type = OPERATION.TSUMO
        return true
    }

    /**
     * 荣胡在高低目差距过大时低目见逃，确4见逃
     */
    adviceRon() {
        if (!this.round.hints.includes(OPERATION.RON))
            return false
        // todo 低目见逃判断 确4见逃判断
        this.type = OPERATION.RON
        return true
    }

    /**
     * 9种9牌宣告流局，11种9牌不宣告
     * 10种9牌根据场况决定
     */
    advice99() {
        if (!this.round.hints.includes(OPERATION.KUKU))
            return false
        // todo
        let cnt_roto = this.countRoto()
        if (cnt_roto >= 11) {
            return false
        }
        this.type = OPERATION.KUKU
        return true
    }

    /**
     * 做国士时不拔北，其他时候拔北
     */
    adviceKita() {
        if (!this.round.hints.includes(OPERATION.KITA))
            return false
        if (this.isHandKokusi())
            return false
        this.type = OPERATION.KITA
        return true
    }

    /**
     * 弃胡时根据场况和安牌数量决定暗杠和加杠(可以帮助某一家把牌做大)
     * 进攻时根据向听、待牌数、打点等决定
     */
    adviceAnkan() {
        if (!this.round.hints.includes(OPERATION.ANKAN))
            return false
        if (this.isHandKokusi() || this.isHandChitoi())
            return false
        let tmp = this.createTmpTehai().sort()
        for (let i in tmp) {
            i = parseInt(i)
            if (tmp[i]===tmp[i+1]&&tmp[i]===tmp[i+2]&&tmp[i]===tmp[i+3]) {
                let tmp2 = tmp.concat()
                tmp2.splice(i, 4)
                if (sht.syanten(this.transToHaiArr(tmp2)) <= this.syanten) {
                    this.type = OPERATION.ANKAN
                    this.hai = tmp[i]
                    return true
                }
            }
        }
        return false
    }
    adviceKakan() {
        if (!this.round.hints.includes(OPERATION.KAKAN))
            return false
        let tmp = this.createTmpTehai()
        for (let furo of this.round.players[this.round.seat].furo) {
            furo = furo.replace(/0/g, "5")
            for (let hai of tmp) {
                if (furo.includes(hai+hai)) {
                    let tmp2 = tmp.concat()
                    tmp2.splice(tmp2.indexOf(hai), 1)
                    if (sht.syanten(this.transToHaiArr(tmp2)) <= this.syanten) {
                        this.type = OPERATION.KAKAN
                        this.hai = hai
                        return true
                    }
                }
            }
        }
        return false
    }

    /**
     * 弃胡时根据场况和安牌数量决定杠碰吃(破一发，破海底等)
     * 进攻时根据向听、待牌数、打点等决定
     * 
     * 无役时不副露，要考虑后副、双役牌的场合
     * 末旬考虑兜牌
     * 考虑染手和断幺的副露
     * 副露后向听不减，但是牌面变好的场合
     * 计算副露之后的打点，和门清的期望打点
     * 考虑其他役的副露(对对、三色、全带、一通等，这个较难)
     */
    adviceMinkan() {
        if (!this.round.hints.includes(OPERATION.MINKAN))
            return false
        if (this.isHandKokusi() || this.isHandChitoi())
            return false
        if (this.isMenzen())
            return false
        let tmp2 = this.createTmpTehai()
        let hai = this.round.hai.replace(/0/g, "5")
        while (tmp2.includes(hai))
            tmp2.splice(tmp2.indexOf(hai), 1)
        if (sht.syanten(this.transToHaiArr(tmp2)) <= this.syanten) {
            this.type = OPERATION.MINKAN
            this.hai = hai
            return true
        }
        return false
    }
    advicePon() {
        if (!this.round.hints.includes(OPERATION.PON))
            return false
        if (this.isHandKokusi() || this.isHandChitoi())
            return false
        if (this.isMenzen() && !this.isYakuhai(this.round.hai))
            return false
        let tmp2 = this.createTmpTehai()
        let hai = this.round.hai.replace(/0/g, "5")
        for (let i = 0; i < 2; i++)
            tmp2.splice(tmp2.indexOf(hai), 1)
        if (sht.syanten(this.transToHaiArr(tmp2)) >= this.syanten) {
            return false
        }
        this.type = OPERATION.PON
        this.hai = hai + "|" + hai
        return true
    }
    adviceChi() {
        if (!this.round.hints.includes(OPERATION.CHI))
            return false
        if (this.isHandKokusi() || this.isHandChitoi())
            return false
        if (this.isMenzen())
            return false
        let tmp = this.createTmpTehai()
        let hai = this.round.hai.replace(/0/g, "5")
        let hai_no = parseInt(hai[0])
        let hai_left1 = hai_no-1+hai[1]
        let hai_left2 = hai_no-2+hai[1]
        let hai_right1 = hai_no+1+hai[1]
        let hai_right2 = hai_no+2+hai[1]
        const chi = (hai1, hai2)=>{
            if (!tmp.includes(hai1) || !tmp.includes(hai2))
                return false
            let tmp2 = tmp.concat()
            tmp2.splice(tmp2.indexOf(hai1), 1)
            tmp2.splice(tmp2.indexOf(hai2), 1)
            if (sht.syanten(this.transToHaiArr(tmp2)) < this.syanten) {
                this.type = OPERATION.CHI
                this.hai = hai1 + "|" + hai2
                return true
            }
            return false
        }
        return chi(hai_left1, hai_right1) || chi(hai_left1, hai_left2) || chi(hai_right1, hai_right2)
    }

    /**
     * 没有执行任何胡杠碰吃advice时自动pass
     */
    advicePass() {
        this.type = OPERATION.PASS
    }

    /**
     * 出牌策略
     * 国士策略：安牌>字牌>19>中张>宝牌>刻子杠子
     * 国士七对策略：对子>宝牌>5>其他中张>刻子杠子
     * 七对策略：宝牌>5>字牌>19>其他中张>刻子杠子(要计算场上已经出现的牌)(如果有断幺则先出字牌和19)(如果有染手则先出其他花色)
     * 七对面子策略：让七对和面子的向听数同时减少
     * 面子策略：计算牌理并打出进张最多的那枚(不计算场上已经出现的牌)，进张数相同则：刻子>对子>宝牌>中张>役牌>19>客风
     */
    adviceDiscard() {
        if (!this.round.hints.includes(OPERATION.DISCARD))
            return false
        let type, is7or13, result = {}, simple_mode = true
        if (this.isHandKokusi())
            type = HAND_KOKUSI, is7or13 = true
        else if (this.isHandChitoi())
            type = HAND_CHITUI, is7or13 = true
        else //if (this.syanten >= 2)
            type = HAND_COMMON, is7or13 = false
        // else
        //     simple_mode = false

        if (simple_mode) {
            let hairi = sht.hairi(this.round.tehai_arr, is7or13)
            delete hairi.now
            for (let k in hairi) {
                result[k] = this.calcHaiValue(type, k)
            }
    
            let final, value = 999
            for (let k in result) {
                if (result[k] < value) {
                    final = k
                    value = result[k]
                }
            }
            // console.log(this.round.tehai, result, final)
            this.hai = final
        } else {
            const recu = (tehai, o)=>{
                const hairi = sht.hairi(this.transToHaiArr(tehai))
                if (hairi.now < 0) {
                    o.done = true
                    let agari = this.simAgari(tehai)
                    if (agari.ten >= o.agari)
                        o.agari = agari.ten
                } else {
                    delete hairi.now
                    o[k] = {cnt: 0, agari: 0}
                    for (let k in hairi) {
                        for (let kk in hairi[k]) {
                            if (hairi[k][kk] - this.countAppeared(kk) > 0) {
                                o[k].cnt += hairi[k][kk]
                                let tmp_tehai = [...tehai]
                                tmp_tehai.splice(tmp_tehai.indexOf(k), 1)
                                tmp_tehai.push(kk)
                                recu(tmp_tehai, o[k])
                            }
                        }
                    }
                }
            }
            let patterns = {}
            recu(this.round.tehai, patterns)
            let final, value = 0
            for (let k in patterns) {
                if (!patterns[k].hasOwnProperty("done")) {

                }
            }
        }

        if (this.hai === "4z" && this.round.hints.includes(OPERATION.KITA))
            this.type = OPERATION.KITA
        else
            this.type = this.round.hints.includes(OPERATION.RIICHI) ? OPERATION.RIICHI : OPERATION.DISCARD
        return true
    }

    //----------------------------------------------------------------------------------------------------

    /**
     * 这是唯一对外暴露的方法
     * @return {Object} 返回一个对象，包含两个字段：
     *  {number} type 一个从1-11的整数，操作的类型
     *  {string} tiles 一个牌的字符串，使用mpsz格式，例如：出牌或立直或杠是"5m", 吃是"4m|6m", 碰是"5m|0m", 自摸荣和流局拔北为空
     */
    doAdvice() {
        this.adviceTsumo() ||
        this.adviceRon() ||
        this.advice99() ||
        this.adviceKita() ||
        this.adviceAnkan() ||
        this.adviceKakan() ||
        this.adviceDiscard() ||
        this.adviceMinkan() ||
        this.advicePon() ||
        this.adviceChi() ||
        this.advicePass()

        // 5转赤
        if (this.hai && this.hai.length === 2 && !this.round.tehai.includes(this.hai))
            this.hai = "0" + this.hai[1]
        if (this.hai && this.hai.length > 2) {
            for (let hai of this.hai.split("|")) {
                if (!this.round.tehai.includes(hai))
                    this.hai = this.hai.replace(new RegExp(hai, "g"), "0"+hai[1])
            }
        }

        // console.log(this.table, this.table.players, this.type, this.hai)
        return {type: this.type, hai: this.hai}
    }
}
module.exports = (table)=>{
    table = JSON.parse(JSON.stringify(table))
    return new NaniKiru(table).doAdvice()
}
