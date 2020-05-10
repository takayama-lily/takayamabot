"use strict"
const MJ = require("riichi")
const sht = require("syanten")
const MPSZ = ['m', 'p', 's', 'z']
class NaniKiru {
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
    constructor(table) {

        //table变量必须为如下格式
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
                mode: 1, //0東風 1東南
            }
        }
        this.table = table
        this.table.tehaiArr = this._transToHaiArray(this.table.tehai)
        this.syanten = sht.syanten(this.table.tehaiArr)
        this.syanten7 = sht.syanten7(this.table.tehaiArr)
        this.syanten13 = sht.syanten13(this.table.tehaiArr)
        this.type = 0
        this.tiles = ""
    }

    _isMenzen() {
        for (let v of this.table.players[this.table.seat].furo) {
            if (v.length > 4)
                return false
        }
        return true
    }
    _isYakuhai(hai) {
        return ["5z","6z","7z",(this.table.bakaze+1)+"z",(this.table.jikaze+1)+"z"].includes(hai)
    }
    _count19() {
        let tmp19 = [this.table.tehaiArr[0][0],this.table.tehaiArr[0][8],this.table.tehaiArr[1][0],this.table.tehaiArr[1][8],this.table.tehaiArr[2][0],this.table.tehaiArr[2][8]].concat(this.table.tehaiArr[3])
        let cnt = 0
        for (let v of tmp19) {
            cnt += v > 0
        }
        return cnt
    }
    _createTmpTehai() {
        return this.table.tehai.map((v)=>{
            return v.replace("0", "5")
        })
    }
    _transToHaiArray(tehai) {
        let haiArray = [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0]
        ]
        for (let v of tehai) {
            let n = parseInt(v)
            n = n === 0 ? 5 : n
            let i = MPSZ.indexOf(v[1])
            haiArray[i][n-1]++
        }
        return haiArray
    }
    _isDora(hai) {
        return hai[0] === "0" || this.table.dora.includes(hai)
    }
    _is19(hai) {
        return hai[1] === "z" || hai[0] === "1" || hai[0] === 9
    }
    _isGenbutsu(hai) {
        return 0
    }
    _countAppeared(hai) {
        let cnt = 0
        for (let player of this.table.players) {
            for (let v of player.kawa) {
                v = v.replace(/0/g, "5")
                if (hai === v)
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
        return cnt
    }
    _isAllast() {
        return this.table.isAL
    }
    _isTop() {
        let myScore = this.table.score[this.table.seat]
        let score = this.table.score.concat().sort()
        if (myScore !== score[score.length-1])
            return false
        return myScore - score[score.length-2]
    }
    _isLast() {
        let myScore = this.table.score[this.table.seat]
        let score = this.table.score.concat().sort()
        if (myScore !== score[0])
            return false
        return score[1] - myScore
    }

    //-------------------------------------------------------------------------------------

    _is13() {
        return this.syanten13 < this.syanten
    }
    _is7() {
        return this.syanten7 < this.syanten
    }

    _isSomete() {}
    _isTanyao() {}

    _isDefending() {}

    //-------------------------------------------------------------------------------------

    _execTsumo() {
        if (!this.table.hints.includes(NaniKiru.TSUMO))
            return false
        this.type = NaniKiru.TSUMO
        return true
    }
    _execRon() {
        if (!this.table.hints.includes(NaniKiru.RON))
            return false
        this.type = NaniKiru.RON
        return true
    }
    _exec99() {
        if (!this.table.hints.includes(NaniKiru.KUKU))
            return false
        let cnt19 = this._count19()
        if (cnt19 >= 11) {
            return false
        }
        this.type = NaniKiru.KUKU
        return true
    }
    _execKita() {
        if (!this.table.hints.includes(NaniKiru.KITA))
            return false
        if (this._is13())
            return false
        this.type = NaniKiru.KITA
        return true
    }

    _execAnkan() {
        if (!this.table.hints.includes(NaniKiru.ANKAN))
            return false
        if (this._is13() || this._is7())
            return false
        let tmp = this._createTmpTehai().sort()
        for (let i in tmp) {
            i = parseInt(i)
            if (tmp[i]===tmp[i+1]&&tmp[i]===tmp[i+2]&&tmp[i]===tmp[i+3]) {
                let tmp2 = tmp.concat()
                tmp2.splice(i, 4)
                if (sht.syanten(this._transToHaiArray(tmp2)) <= this.syanten) {
                    this.type = NaniKiru.ANKAN
                    this.tiles = tmp[i]
                    return true
                }
            }
        }

        return false
    }
    _execKakan() {
        if (!this.table.hints.includes(NaniKiru.KAKAN))
            return false
        let tmp = this._createTmpTehai()
        for (let furo of this.table.players[this.table.seat].furo) {
            furo = furo.replace(/0/g, "5")
            for (let hai of tmp) {
                if (furo.includes(hai+hai)) {
                    let tmp2 = tmp.concat()
                    tmp2.splice(tmp2.indexOf(hai), 1)
                    if (sht.syanten(this._transToHaiArray(tmp2)) <= this.syanten) {
                        this.type = NaniKiru.KAKAN
                        this.tiles = hai
                        return true
                    }
                }
            }
        }
        return false
    }

    _execMinkan() {
        if (!this.table.hints.includes(NaniKiru.MINKAN))
            return false
        if (this._is13() || this._is7())
            return false
        if (this._isMenzen())
            return false
        let tmp2 = this._createTmpTehai()
        let hai = this.table.hai.replace(/0/g, "5")
        while (tmp2.includes(hai))
            tmp2.splice(tmp2.indexOf(hai), 1)
        if (sht.syanten(this._transToHaiArray(tmp2)) <= this.syanten) {
            this.type = NaniKiru.MINKAN
            this.tiles = hai
            return true
        }
        return false
    }
    _execPon() {
        if (!this.table.hints.includes(NaniKiru.PON))
            return false
        if (this._is13() || this._is7())
            return false
        let tmp2 = this._createTmpTehai()
        let hai = this.table.hai.replace(/0/g, "5")
        for (let i = 0; i < 2; i++)
            tmp2.splice(tmp2.indexOf(hai), 1)
        if (sht.syanten(this._transToHaiArray(tmp2)) >= this.syanten) {
            return false
        }
        if (this._isMenzen() && !this._isYakuhai(hai)) {
            return false
        }
        this.type = NaniKiru.PON
        this.tiles = hai + "|" + hai
        return true
    }
    _execChi() {
        if (!this.table.hints.includes(NaniKiru.CHI))
            return false
        if (this._is13() || this._is7())
            return false
        if (this._isMenzen())
            return false
        return false
    }
    _execPass() {
        this.type = NaniKiru.PASS
    }

    _execDiscard() {
        if (!this.table.hints.includes(NaniKiru.DISCARD))
            return false
        let hairi = sht.hairi(this.table.tehaiArr, this._is13()||this._is7())
        delete hairi.now
        let result = {}
        for (let k in hairi) {
            let cnt = 0
            for (let kk in hairi[k]) {
                cnt += hairi[k][kk] - this._countAppeared(kk)
            }
            result[k] = {
                cnt: cnt,
                weight: 0
            }
            if (this._is13()) {
                if (!this._is19(k)) {
                    result[k].weight--
                }
                if (this._isDora(k)) {
                    result[k].weight--
                }
                result[k].weight += this._isGenbutsu(k)
            } else if (this._is7()) {
                if (this._is19(k)) {
                    result[k].weight++
                }
                if (this._isDora(k)) {
                    result[k].weight++
                }
            } else {
                if (this.table.rules.type === 3 && ["1m","9m"].includes(k))
                    result[k].weight -= 5
                if (!k.includes("z")) {
                    result[k].weight += 5 - Math.abs(5-k[0])
                    if (this._isDora(k)) {
                        result[k].weight += 3.5
                    }
                }
            }
        }
        let kiru, cnt = 0, weight = 100
        for (let k in result) {
            if (result[k].cnt > cnt) {
                kiru = k
                cnt = result[k].cnt
                weight = result[k].weight
            } else if (result[k].cnt === cnt && result[k].weight < weight) {
                kiru = k
                cnt = result[k].cnt
                weight = result[k].weight
            }
        }
        this.tiles = kiru
        if (this.tiles === "4z" && this.table.hints.includes(NaniKiru.KITA))
            this.type = NaniKiru.KITA
        else
            this.type = this.table.hints.includes(NaniKiru.RIICHI) ? NaniKiru.RIICHI : NaniKiru.DISCARD
        return true
    }

    //-------------------------------------------------------------------------------------

    /**
     * 这是唯一对外暴露的方法
     * @return {Object} 返回一个对象，包含两个字段：
     *  {number} type 一个从1-11的整数，操作的类型
     *  {string} tiles 一个牌的字符串，使用mpsz格式，例如：出牌或立直或杠是"5m", 吃是"4m|6m", 碰是"5m|0m", 自摸荣和流局拔北为空
     */
    calc() {
        this._execTsumo() ||
        this._execRon() ||
        this._exec99() ||
        this._execKita() ||
        this._execAnkan() ||
        this._execKakan() ||
        this._execDiscard() ||
        this._execMinkan() ||
        this._execPon() ||
        this._execChi() ||
        this._execPass()

        // 5转赤
        if (this.tiles && this.tiles.length === 2 && !this.table.tehai.includes(this.tiles))
            this.tiles = "0" + this.tiles[1]
        if (this.tiles && this.tiles.length > 2) {
            for (let hai of this.tiles.split("|")) {
                if (!this.table.tehai.includes(hai))
                    this.tiles = this.tiles.replace(new RegExp(hai, "g"), "0"+hai[1])
            }
        }

        // console.log(this.table, this.table.players, this.type, this.tiles)
        return {type: this.type, tiles: this.tiles}
    }
}
module.exports = (table)=>{
    table = JSON.parse(JSON.stringify(table))
    return new NaniKiru(table).calc()
}
