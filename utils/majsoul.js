'use strict'
const fs = require('fs')
const http = require('http')
const url = require('url')
const querystring = require('querystring')
const zlib = require('zlib')
const MJSoul = require('mjsoul')
const config = require('./majsoul.config')
const mjsoul = new MJSoul({
    'url': 'wss://mj-srv-6.majsoul.com:4501'
})
const login = ()=>{
    mjsoul.send('login', {account: config['cn.account'], password: mjsoul.hash(config['cn.password'])})
}
mjsoul.on('NotifyAccountLogout', login)
mjsoul.on('NotifyAnotherLogin', login)
mjsoul.on('error', ()=>{})
mjsoul.open(login)

const mjsoulJP = new MJSoul({
    'url': 'wss://mjjpgs.mahjongsoul.com:4501/'
})
const loginJP = ()=>{
	let req = {
		type: 10,
		access_token: config['jp.token']
	}
    mjsoulJP.send('oauth2Login', req)
}
mjsoulJP.on('NotifyAccountLogout', loginJP)
mjsoulJP.on('NotifyAnotherLogin', loginJP)
mjsoulJP.on('error', ()=>{})
mjsoulJP.open(loginJP)

const seat = ['東','南','西','北']
const rank = ['初心','雀士','雀杰','雀豪','雀圣','魂天']
const getRank = id=>{
    id = id.toString()
    let res = rank[id[2]-1] + id[4]
    return res ===  '魂天1' ? '魂天' : res
}
const shuibiao = async(words, jp = false)=>{
    let deepAdd = (o1, o2)=>{
        if (o1===undefined) return o2
        if (o2===undefined) return o1
        for (let k in o1) {
            if (['rank','type'].includes(k) || !o2.hasOwnProperty(k))
                continue
            if (k === 'highest_lianzhuang') {
                o1[k] = Math.max(o1[k], o2[k])
                continue
            }
            if (k === 'round_end') {
                o1[k].sort((a,b)=>a.type-b.type)
                o2[k].sort((a,b)=>a.type-b.type)
            }
            if (typeof o1[k] === 'number')
                o1[k] += o2[k]
            if (typeof o1[k] === 'object')
                o1[k] = deepAdd(o1[k], o2[k])
        }
        return o1
    }
    try {
        let client = jp ? mjsoulJP : mjsoul
        let result = await client.sendAsync('searchAccountByPattern', {pattern: words})
        if (result.match_accounts.length === 0) 
            return `玩家 ${words} 不存在`
        let account_id = result.match_accounts.shift()
        let [account, statistic, state] = await Promise.all([
            client.sendAsync('fetchAccountInfo', {account_id: account_id}),
            client.sendAsync('fetchAccountStatisticInfo', {account_id: account_id}),
            client.sendAsync('fetchAccountState', {account_id_list: [account_id]})
        ])
        account = account.account
        state = state.states[0].is_online ? '在线' : '离线'

        let name = account.nickname
        let sign = account.signature ? `(${account.signature})` : ''
        let rank4 = getRank(account.level.id)
        let rank3 = getRank(account.level3.id)
        let pt4 = account.level.score
        let pt3 = account.level3.score
        statistic = statistic.detail_data.rank_statistic.total_statistic.all_level_statistic.game_mode
        let mode1 = Object.keys(statistic).find((k)=>statistic[k].mode===1)
        let mode2 = Object.keys(statistic).find((k)=>statistic[k].mode===2)
        let mode11 = Object.keys(statistic).find((k)=>statistic[k].mode===11)
        let mode12 = Object.keys(statistic).find((k)=>statistic[k].mode===12)
        let mode3 = deepAdd(statistic[mode1], statistic[mode2])
        let mode23 = deepAdd(statistic[mode11], statistic[mode12])
        let format = `${name} -${state}- ${sign}`
        //type 0 1 2摸 3荣 4铳 5
        console.log(mode3)
        if (mode3) {
            let mode = mode3
            let top = Math.round(mode.game_final_position[0]/mode.game_count_sum*100)
            let last = Math.round(mode.game_final_position[3]/mode.game_count_sum*100)
            let fly = Math.round(mode.fly_count/mode.game_count_sum*100)
            let o = mode.round_end[Object.keys(mode.round_end).find((k)=>mode.round_end[k].type===2)]
            let tsumo = o ? Math.round((o.sum) / mode.round_count_sum * 100) : 0
            o = mode.round_end[Object.keys(mode.round_end).find((k)=>mode.round_end[k].type===3)]
            let ron = o ? Math.round((o.sum) / mode.round_count_sum * 100) : 0
            o = mode.round_end[Object.keys(mode.round_end).find((k)=>mode.round_end[k].type===4)]
            let furikomi = o ? Math.round((o.sum) / mode.round_count_sum * 100) : 0
            let riichi = Math.round(mode.liqi_count_sum/mode.round_count_sum*100)
            let furo = Math.round(mode.ming_count_sum/mode.round_count_sum*100)
            format += `\n四麻${mode.game_count_sum}戦${rank4} 一${top}% 末${last}% 飛${fly}%
　摸${tsumo}% 栄${ron}% 銃${furikomi}% 立${riichi}% 鳴${furo}%`
        }
        if (mode23) {
            let mode = mode23
            let top = Math.round(mode.game_final_position[0]/mode.game_count_sum*100)
            let last = Math.round(mode.game_final_position[2]/mode.game_count_sum*100)
            let fly = Math.round(mode.fly_count/mode.game_count_sum*100)
            let o = mode.round_end[Object.keys(mode.round_end).find((k)=>mode.round_end[k].type===2)]
            let tsumo = o ? Math.round((o.sum) / mode.round_count_sum * 100) : 0
            o = mode.round_end[Object.keys(mode.round_end).find((k)=>mode.round_end[k].type===3)]
            let ron = o ? Math.round((o.sum) / mode.round_count_sum * 100) : 0
            o = mode.round_end[Object.keys(mode.round_end).find((k)=>mode.round_end[k].type===4)]
            let furikomi = o ? Math.round((o.sum) / mode.round_count_sum * 100) : 0
            let riichi = Math.round(mode.liqi_count_sum/mode.round_count_sum*100)
            let furo = Math.round(mode.ming_count_sum/mode.round_count_sum*100)
            format += `\n三麻${mode.game_count_sum}戦${rank3} 一${top}% 末${last}% 飛${fly}%
　摸${tsumo}% 栄${ron}% 銃${furikomi}% 立${riichi}% 鳴${furo}%`
        }
//         let p = {1:[],2:[],11:[],12:[],sum1:0,sum2:0,sum11:0,sum12:0}
//         if (statistic)
//             for (let v of statistic) {
//                 if (![1,2,11,12].includes(v.mode)) continue;
//                 p['sum'+v.mode] = v.game_count_sum
//                 for (let v2 of v.game_final_position) {
//                     p[v.mode].push(Math.round(v2/v.game_count_sum*100)+'%')
//                 }
//             }
//         let format = `${name} -${state}- ${sign}
// 四麻: ${rank4} ${pt4}pt (南${p.sum2}戦:${p[2].join(' ')}|東${p.sum1}戦:${p[1].join(' ')})
// 三麻: ${rank3} ${pt3}pt (南${p.sum12}戦:${p[12].slice(0,3).join(' ')}|東${p.sum11}戦:${p[11].slice(0,3).join(' ')})`
        return format
    } catch (e) {
        console.log(e)
        return '暂时无法查询，可能在维护或别的原因。'
    }
}

const ranking = async(type = 0, jp = false)=>{
    try {
        let client = jp ? mjsoulJP : mjsoul
        let result = await client.sendAsync('fetchLevelLeaderboard', {type: type == 3 ? 2 : 1})
        result = result.items.slice(0, 15)
        let accounts = []
        for (let v of result) {
            accounts.push(v.account_id)
        }
        let players = (await client.sendAsync('fetchMultiAccountBrief', {account_id_list: accounts})).players
        for (let k in players) {
            result[k].nickname = players[k].nickname
        }
        let format = `雀魂${jp?'日':'国'}服${type?'三':'四'}麻排名:`
        for (let k in result) {
            let v = result[k]
            format += `\n${k*1+1}. ${v.nickname} ${getRank(v.level.id)} ${v.level.score}pt`
        }
        return format
    } catch (e) {
        return '暂时无法查询，可能在维护或别的原因。'
    }
}

const paipu = async(id)=>{
    return '该指令不再提供'
    let paipu = querystring.parse(url.parse(id).query).paipu
    if (!paipu)
        paipu = paipu
    let data = await getParsedRecord(paipu)

    if (data.error)
        return '牌譜id不正確: ' + paipu
    let result = data.head.accounts
    for (let i in result) {
        for (let v of data.head.result.players) {
            if (v.seat === result[i].seat)
                Object.assign(result[i], v)
        }
        let rankField = result.length === 3 ? 'level3' : 'level'
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
            case 'RecordNewRound':
                for (let i in v.data.scores)
                    result[i].ptChange.push(v.data.scores[i])
                break;
            case 'RecordHule':
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
    let format = '雀魂牌譜' + id
    for (let i in result) {
        result[i].ptChange.push(result[i].part_point_1)
        let v = result[i]
        format += `\n${v.wind}起:${v.nickname}(${v.rank}) / 自摸${v.tsumo}次:+${v.tsumoPt} / 栄和${v.ron}次:+${v.ronPt} / 放銃${v.furikomi}次:${v.furikomiPt}
${result[i].ptChange.join('->')}`
    }
    return format
}

const recordCachePath = './data/record/'
if (!fs.existsSync(recordCachePath)) {
    fs.mkdirSync(recordCachePath, {recursive: true, mode: 0o700})
}
const getParsedRecord = async(id)=>{
    if (!id)
        return {"error": "id required"}
    id = id.split("_").shift()
    const filePath = recordCachePath + id
    if (fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath)
        return zlib.brotliDecompressSync(buf)
    }
    let data = await mjsoul.sendAsync("fetchGameRecord", {game_uuid: id})
    let record = {...data}
    if (record.data_url) {
        record = await new Promise((resolve, reject)=>{
            MJSoul.record.parseById(id, (data)=>{
                record.data = data, record.data_url = ""
                resolve(record)
            })
        })
    } else {
        record.data = MJSoul.record.parse(data.data)
    }
    if (!record.error) {
        record = JSON.stringify(record)
        let cache = zlib.brotliCompressSync(Buffer.from(record), {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 9}})
        fs.writeFile(filePath, cache, ()=>{})
    }
    return record
}

module.exports = {
    cn: mjsoul,
    jp: mjsoulJP,
    getParsedRecord: getParsedRecord,
    shuibiao: shuibiao,
    paipu: paipu,
    ranking: ranking
}


// paipu('191120-4fc0d53c-1d5b-4186-9f16-7011f7f366f5').then(data=>console.log(data))

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
// const MJSoul = require('mjsoul')
// const mjsoul = new MJSoul({
//     'url': 'wss://mj-srv-6.majsoul.com:4501',
//     // 'proxy': 'http://B051925:lw58613669CP@10.39.74.38:50080/'
// })

// setTimeout(async()=>{

//     console.log(await shuibiao("神原かずき",true))

// }, 3000)

// mjutil.mjsoul = mjsoul
// new Promise(resolve=>{
//     mjsoul.open(()=>{
//         mjsoul.send('login', (data)=>{
//             // console.log(data)
//             resolve()
//         }, {account: 'takayama@foxmail.com', password: mjsoul.hash('552233')})
//     })
// })
// .then(()=>{
//     return shuibiao('高山')
//     // return ranking(3)
//     // return mjsoul.send('fetchAccountState', data=>{
//     //     resolve(data)
//     //     // console.log(data.states[0].is_online)
//     //     // mjsoul.close()
//     // }, {account_id_list: [367278]})
// })
// .then((data)=>{
//     console.log(data)
//     mjsoul.close()
// })
