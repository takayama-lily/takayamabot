'use strict'
const fs = require('fs')
const http = require('http')
const url = require('url')
const path = require('path')
const querystring = require('querystring')
const zlib = require('zlib')
const MJSoul = require('mjsoul')
const MJBot = require('./mjbot')

const config = {}
config['cn.account'] = process.env.MAJSOUL_CN_ACCOUNT
config['cn.password'] = process.env.MAJSOUL_CN_PASSWORD
config['jp.token'] = process.env.MAJSOUL_JP_TOKEN

const mjsoul = new MJBot({
    url: 'wss://gateway-cdn.maj-soul.com/gateway'
})
mjsoul.login(config['cn.account'], config['cn.password'])

const mjsoulJP = new MJSoul({
    url: 'wss://mjjpgs.mahjongsoul.com:9663'
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
const eid2id = (t)=>{var e=67108863&(t-=1e7);return e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,(-67108864&t)+e^6139246}
const id2eid = (t)=>{var e=67108863&(t^=6139246);return e=(511&e)<<17|e>>9,e=(511&e)<<17|e>>9,e=(511&e)<<17|e>>9,e=(511&e)<<17|e>>9,(e=(511&e)<<17|e>>9)+(-67108864&t)+1e7}

const recordCachePath = path.join(__dirname, 'data/records')
if (!fs.existsSync(recordCachePath)) {
    fs.mkdirSync(recordCachePath, {recursive: true, mode: 0o700})
}
const getParsedRecord = async(id)=>{
    if (!id)
        return {"error": "id required"}
    id = id.split("_").shift()
    const filePath = path.join(recordCachePath, id)
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
}
