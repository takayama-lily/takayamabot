"use strict"
const http = require("http")
const url = require("url")
const querystring = require("querystring")
const zlib = require("zlib")
const spawn = require("child_process")
const cheerio = require("cheerio")
const mjsoul = require("./modules/majsoul/majsoul")
const sandbox = require("./modules/sandbox/sandbox")

const fn = async(req)=>{
    let r = url.parse(req.url)
    let query = querystring.parse(r.query)

    // bot管理
    if (r.pathname === "/bot/sandbox/fn") {
        const result = {}
        const context = sandbox.getContext()
        for (let k in context) {
            if (typeof context[k] === "function" && !k.includes("_") && (k.toLowerCase() === k || k.toUpperCase() === k)) {
                let v = context[k].toString().split("\n")
                result[k] = v.shift()
                for (let vv of v) {
                    if (vv.trim() === "{")
                        continue
                    if (!vv.trim().startsWith("//"))
                        break
                    result[k] += "\n" + vv.trim()
                }
            }
        }
        return result
    }

    //牌谱请求
    else if (r.pathname === "/record") {
        return await mjsoul.getParsedRecord(query.id)
    }
    
    //国服雀魂api
    else if (r.pathname === "/api" && query.m && !["login", "logout"].includes(query.m)) {
        // console.log(Date(), query)
        return await mjsoul.cn.sendAsync(query.m, query)
    }
    
    //日服雀魂api
    else if (r.pathname === "/jp/api" && query.m && !["login", "logout"].includes(query.m)) {
        return await mjsoul.jp.sendAsync(query.m, query)
    }

    else if (r.pathname === "/tenhou" && query.id) {
        const tmp = async(id, type)=>{
            const header_url = "http://otokomyouri.com/SearchByName/SBNHeader.aspx"
            const body_url = "http://otokomyouri.com/SearchByName/SBNBody.aspx"
            const post_data = {
                __VIEWSTATE: "/wEPDwUJODY5Njk0NDUyZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAgUKY2hrTW9udGhseQUJY2hrQ2hva2luAKeflpBy9eLXkc9/wCHEnXAT88bsE7pMeFGuhkOBB9o=",
                __VIEWSTATEGENERATOR: "35472AE9",
                __EVENTVALIDATION: "/wEdAA05g6xyCM5pIdHQS3r6qpx5nQD2+KyNjZqXGtohkeEbpWDMKSmpxcegtZH59zzEfdhj7rCv+3dAL1csO0hgF9VBDrKGGU7SXzlxUwb3vaKFbKHFaru9f9t/Ao4wZpQIbk0rS5GXjaXuV85G/QBrNqlgXC3y7fdVPmBDYiSVwMjNn1WYJpDioHyrkdNyuxYl9y9nM5s4/eUl09HAe782CVNnAjjx93hDXkPy/5Tc+5/dB9qmN0ZChGbKYeh4UUkOdl7mq4mgPNUbaGxbkU0ej673LudtZO9FnDQTO8WAihus77dwtmzT23Egh05Fked4bQw=",
                txtPlayerID: id,
                btnExecute: "実行",
                cmb34: type,
                cmbTonNan: "両方",
                cmbRank: "鳳凰",
                txtChokin: "100",
            }
            let Cookie = type === "四" ? "ASP.NET_SessionId=ftj4zylrjvah020w3qi0wht2" : "ASP.NET_SessionId=slgaeak3tahusweo1akujtkj"
            return new Promise((resolve)=>{
                const options = {
                    method: 'POST',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded', Cookie}
                }
                const req = http.request(header_url, options, (res)=>{
                    http.get(body_url, {headers: {Cookie}}, (res)=>{
                        let data = ""
                        res.on("data", chunk=>data+=chunk)
                        res.on("end", ()=>{
                            let jq = cheerio.load(data)
                            resolve(jq("#lblRateDan font").text())
                        })
                    }).on("error", ()=>resolve({}))
                }).on("error", ()=>resolve(""))
                req.write(querystring.stringify(post_data))
                req.end()
            })
        }
        const [result1, result2] = await Promise.all([
            tmp(query.id, "四"),
            tmp(query.id, "三")
        ])
        return {4: result1, 3: result2}
    }

    //whois请求
    else if (r.pathname === "/whois" && query.domain) {
        return new Promise((resolve, reject)=>{
            spawn.exec("whois " + query.domain, (error, stdout, stderr) => {
                let output = {
                    "stdout": stdout,
                    "stderr": stderr,
                    "error": error
                }
                resolve(output)
            })
        })
    }
    
    //github webhock
    else if (r.pathname === "/youShouldPull") {
        return new Promise((resolve, reject)=>{
            spawn.exec("./up", (error, stdout, stderr) => {
                let output = {
                    "stdout": stdout,
                    "stderr": stderr,
                    "error": error
                }
                resolve(output)
            })
        })
    }
}
module.exports = async(req, res)=>{
	let result
    try {
        result = await fn(req)
        if (!result) {
            res.writeHead(302, {"Location": "/index.html"})
            res.end()
            return
        }
    } catch(e) {
        result = e
    }
    if (!(result instanceof Buffer) && typeof result !== "string")
        result = JSON.stringify(result)
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.setHeader("Access-Control-Allow-Origin", "*")

    //开启gzip
    let acceptEncoding = req.headers["accept-encoding"]
    if (result.length > 1024 && acceptEncoding && acceptEncoding.includes("gzip")) {
        res.writeHead(200, { "Content-Encoding": "gzip" })
        zlib.gzip(result, (err, buffer)=>{
            if (err)
                buffer = JSON.stringify({error: err})
            res.end(buffer)
        })
    } else {
        res.end(result)
    }
}
