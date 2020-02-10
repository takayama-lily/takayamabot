const fs = require("fs")
const url = require("url")
const querystring = require('querystring')
const zlib = require("zlib")
const MJSoul = require("mjsoul")
mjsoul = new MJSoul({
    "url": "wss://mj-srv-6.majsoul.com:4501"
})
const deny = ["login", "logout"]
let closeFlag = true
let loginFlag = false
const login = ()=>{
    closeFlag = false
    loginFlag = false
    mjsoul.send("login", (data)=>{
        if (!data.error)
            loginFlag = true
    }, mjsoul.jsonForLogin("372914165@qq.com", "552233"))
}
mjsoul.on("NotifyAccountLogout", login)
mjsoul.on("NotifyAnotherLogin", login)
mjsoul.on("close", ()=>{
    closeFlag = true
    loginFlag = false
})
mjsoul.open(login)

mjsoulJP = new MJSoul({
    "url": "wss://mjjpgs.mahjongsoul.com:4501/"
})
const loginJP = ()=>{
	let req = {
		type: 10,
		access_token: 'eff72bfc-b1a9-4006-ae54-db36cbd65ccb',
		reconnect: false,
		device: { device_type: 'pc', browser: 'chrome' },
		random_key: '49c6fee7-52e2-429b-e2a9-5e4165d7b1b8',
		client_version: '0.6.184.w',
		currency_platforms: [2]
	}
    mjsoulJP.send("oauth2Login", (data)=>{
        console.log(data)
    }, req)
}
mjsoulJP.open(loginJP)
mjsoulJP.on("error", ()=>{mjsoulJP.open(loginJP)})

let api = {}
api.resolve = async(req, res)=>{
	return new Promise((resolve, reject)=>{
		let r = url.parse(req.url)
	    let query = querystring.parse(r.query)
	    let cb = (data)=>{
	        resolve(JSON.stringify(data))
	    }
	    if (r.pathname === "/record") {
	    	if (!query.id)
	    		resolve(JSON.stringify({"error": "id required"}))
	        const id = query.id.split("_").shift()
	        const filePath = "data/record/" + id
	        if (fs.existsSync(filePath)) {
	            const buf = fs.readFileSync(filePath)
	            resolve(zlib.brotliDecompressSync(buf))
	            return
	        }
	        const cacheAndOutput = data=>{
	        	let output = JSON.stringify(data)
	        	resolve(output)
	        	if (!data.error) {
		            let cache = zlib.brotliCompressSync(Buffer.from(output), {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 9}})
		            fs.writeFile(filePath, cache, ()=>{})
	        	}
	        }
	        new Promise(resolve=>{
	            mjsoul.send("fetchGameRecord", data=>resolve(data), {game_uuid: id})
	        }).then(data=>{
	            let record = {...data}
	            if (record.data_url) {
	                MJSoul.record.parseById(id, (data)=>{
	                    record.data = data, record.data_url = ""
	                    cacheAndOutput(record)
	                })
	            } else {
	                record.data = MJSoul.record.parse(data.data)
	                cacheAndOutput(record)
	            }
	        })
	    } else if (r.pathname === "/api" && query.m && deny.indexOf(query.m) === -1) {
	        if (closeFlag) {
	        	mjsoul.open(login)
	            resolve(JSON.stringify({"error": "可能在维护"}))
	        }
	        if (loginFlag) {
	            mjsoul.send(query.m, cb, query)
	        } else {
	            login()
	            resolve(JSON.stringify({"error": "可能在维护"}))
	        }
	    } else {
	        res.writeHead(302, {'Location': '/index.html'});
	        res.end()
	        reject()
	    }
	})
}

module.exports = api
