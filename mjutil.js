"use strict"
const mjutil = {}
const http = require("http")
const url = require("url")
const querystring = require("querystring")
const seat = ["東","南","西","北"]
const rank = ["初心","雀士","雀杰","雀豪","雀圣","魂天"]
const getRank = id=>{
    id = id.toString()
    let res = rank[id[2]-1] + id[4]
    return res ===  "魂天1" ? "魂天" : res
}
const shuibiao = async (words, jp = false)=>{
    let result
    let client = jp ? mjsoulJP : mjsoul
    await new Promise(resolve=>{
        client.send("searchAccountByPattern", (data)=>{
            result = data, resolve()
        }, {pattern: words})
    })
    if (data.error !== undefined)
        return "暂时无法查询，可能在维护或别的原因。"
    if (result.match_accounts.length === 0) 
        return `玩家 ${words} 不存在`
    let account_id = result.match_accounts.shift()

    let account, statistic, state

    await Promise.all([
        new Promise(resolve=>{
            client.send("fetchAccountInfo", (data)=>{
                account = data.account, resolve()
            }, {account_id: account_id})
        }),
        new Promise(resolve=>{
            client.send("fetchAccountStatisticInfo", (data)=>{
                statistic = data, resolve()
            }, {account_id: account_id})
        }),
        new Promise(resolve=>{
            client.send("fetchAccountState", (data)=>{
                state = data.states[0].is_online ? "在线" : "离线", resolve()
            }, {account_id_list: [account_id]})
        })
    ])

    let id = account.account_id
    let name = account.nickname
    let sign = account.signature ? ` (${account.signature})` : ""
    let rank4 = getRank(account.level.id)
    let rank3 = getRank(account.level3.id)
    let pt4 = account.level.score
    let pt3 = account.level3.score
    statistic = statistic.detail_data.rank_statistic.total_statistic.all_level_statistic.game_mode
    let p = {1:[],2:[],11:[],12:[],sum1:0,sum2:0,sum11:0,sum12:0}
    if (statistic)
        for (let v of statistic) {
            if (![1,2,11,12].includes(v.mode)) continue;
            p["sum"+v.mode] = v.game_count_sum
            for (let v2 of v.game_final_position) {
                p[v.mode].push(Math.round(v2/v.game_count_sum*100)+"%")
            }
        }
    let format = `${name}${sign} -${state}-
四麻: ${rank4} ${pt4}pt (南${p.sum2}戦:${p[2].join(" ")}|東${p.sum1}戦:${p[1].join(" ")})
三麻: ${rank3} ${pt3}pt (南${p.sum12}戦:${p[12].slice(0,3).join(" ")}|東${p.sum11}戦:${p[11].slice(0,3).join(" ")})`
    return format
}

const ranking = async(type = 0, jp = false)=>{
    let result
    let client = jp ? mjsoulJP : mjsoul
    await new Promise(resolve=>{
        client.send("fetchLevelLeaderboard", (data)=>{
            result = data, resolve()
        }, {type: type ? 2 : 1})
    })
    if (data.error !== undefined)
        return "暂时无法查询，可能在维护或别的原因。"
    result = result.items.slice(0,20)
    let accounts = []
    for (let v of result) {
        accounts.push(v.account_id)
    }
    await new Promise(resolve=>{
        client.send("fetchMultiAccountBrief", (data)=>{
            for (let k in data.players) {
                result[k].nickname = data.players[k].nickname
            }
            resolve()
        }, {account_id_list: accounts})
    })

    let format = `雀魂${jp?"日":"国"}服${type?"三":"四"}麻排名:`
    for (let k in result) {
        let v = result[k]
        format += `\n${k*1+1}. ${v.nickname} ${getRank(v.level.id)} ${v.level.score}pt`
    }
    return format
}

const paipu = async(id)=>{
    let paipu = querystring.parse(url.parse(id).query).paipu
    if (!paipu)
        paipu = id
    let data = ""
    await new Promise(resolve=>{
        http.get("http://localhost/record?id="+id.replace("https://www.majsoul.com/1/?paipu=", ""), (res)=>{
            res.on('data', d=>{
                data += d
            })
            res.on('end', ()=>{
                data = JSON.parse(data)
                resolve()
            })
        }).on("error", err=>{
            data = {"error":""}
            resolve()
        })
    })

    if (data.error)
        return "牌譜id不正確: " + paipu
    let result = data.head.accounts
    for (let i in result) {
        for (let v of data.head.result.players) {
            if (v.seat === result[i].seat)
                Object.assign(result[i], v)
        }
        let rankField = result.length === 3 ? "level3" : "level"
        result[i].wind = seat[result[i].seat]
        result[i].rank = getRank(result[i][rankField].id)
        result[i].tsumo = 0
        result[i].tsumoPt = 0
        result[i].ron = 0
        result[i].ronPt = 0
        result[i].furikomi = 0
        result[i].furikomiPt = 0
        result[i].reach = 0
        result[i].reachAgari = 0
        result[i].reachFurikomi = 0
        result[i].ptChange = []
        result[i].syanten = {}
    }
    data = data.data
    for (let v of data) {
        switch (v.name) {
            case "RecordNewRound":
                for (let i in v.data.scores)
                    result[i].ptChange.push(v.data.scores[i])
                break;
            case "RecordHule":
                for (let agari of v.data.hules) {
                    if (agari.zimo) {
                        result[agari.seat].tsumo++
                        result[agari.seat].tsumoPt += agari.qinjia ? agari.point_zimo_xian*(result.length-1) : agari.point_zimo_qin+agari.point_zimo_xian*(result.length-2)
                    } else {
                        result[agari.seat].ron++
                        result[agari.seat].ronPt += agari.point_rong
                    }
                }

                let tsumo = v.data.delta_scores.indexOf(0) === -1
                for (let i in v.data.delta_scores) {
                    let score = v.data.delta_scores[i]
                    if (!tsumo && score < 0) {
                        result[i].furikomi++
                        result[i].furikomiPt += score
                    }
                }
                break;
            default:
                break;
        }
    }
    let format = "雀魂牌譜" + id
    for (let i in result) {
        result[i].ptChange.push(result[i].part_point_1)
        let v = result[i]
        format += `\n${v.wind}起:${v.nickname}(${v.rank}) / 自摸${v.tsumo}次:+${v.tsumoPt} / 栄和${v.ron}次:+${v.ronPt} / 放銃${v.furikomi}次:${v.furikomiPt}
${result[i].ptChange.join("->")}`
    }
    return format
}

mjutil.shuibiao = shuibiao
mjutil.paipu = paipu
mjutil.ranking = ranking
module.exports = mjutil

// console.log(querystring.parse(url.parse("雀魂牌譜: https://game.mahjongsoul.com/?paipu=200103-167092ea-1767-498a-ab78-05a89d558c1c_a454378763").query))

// paipu("191120-4fc0d53c-1d5b-4186-9f16-7011f7f366f5").then(data=>console.log(data))

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
// const MJSoul = require("mjsoul")
// const mjsoul = new MJSoul({
//     "url": "wss://mj-srv-6.majsoul.com:4501",
//     // "proxy": "http://B051925:lw58613669CP@10.39.74.38:50080/"
// })
// mjutil.mjsoul = mjsoul
// new Promise(resolve=>{
//     mjsoul.open(()=>{
//         mjsoul.send("login", (data)=>{
//             // console.log(data)
//             resolve()
//         }, mjsoul.jsonForLogin("takayama@foxmail.com", "552233"))
//     })
// })
// .then(()=>{
//     return ranking(3)
//     // return mjsoul.send("fetchAccountState", data=>{
//     //     console.log(data.states[0].is_online)
//     //     mjsoul.close()
//     // }, {account_id_list: [367278]})
// })
// .then((data)=>{
//     console.log(data)
//     mjsoul.close()
// })
