'use strict'
const fs = require('fs')
const url = require("url")
const http = require('http')
const WebSocket = require('ws')
const zlib = require('zlib')
process.on('uncaughtException', (e)=>{
    fs.appendFileSync('err.log', Date() + ' ' + e.stack + '\n')
    process.exit(1)
})
process.on('unhandledRejection', (reason, promise)=>{
    fs.appendFileSync('err.log', Date() + ' Unhandled Rejection at:' + promise + 'reason:' + reason + '\n')
})

const mjsoul = require('./utils/majsoul')
const deny = ["login", "logout"] 

const fn = async(req)=>{
    let r = url.parse(req.url)
    let query = querystring.parse(r.query)

    //处理牌谱解析请求
    if (r.pathname === "/record") {
        if (!query.id)
            return {"error": "id required"}
        const id = query.id.split("_").shift()
        const filePath = "data/record/" + id
        if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath)
            return zlib.brotliDecompressSync(buf)
        }
        let record = await mjsoul.getParsedRecord(id)
        if (!record.error) {
            let cache = zlib.brotliCompressSync(Buffer.from(JSON.stringify(record)), {params: {[zlib.constants.BROTLI_PARAM_QUALITY]: 9}})
            fs.writeFile(filePath, cache, ()=>{})
        }
        return record
    }
    
    //开启国服雀魂api
    else if (r.pathname === "/api" && query.m && !deny.includes(query.m)) {
        return await mjsoul.cn.sendAsync(query.m, query)
    }
    
    //开启日服雀魂api
    else if (r.pathname === "/jp/api" && query.m && !deny.includes(query.m)) {
        return await mjsoul.jp.sendAsync(query.m, query)
    }
    
    //处理github push请求
    else if (r.pathname === "/youShouldPull") {
        return new Promise((resolve, reject)=>{
            proc.exec('./up', (error, stdout, stderr) => {
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

//开启http服务器处理一些请求
const server = http.createServer(async(req, res)=>{
    let result
    try {
        result = await fn(req)
        if (!result) {
            res.writeHead(302, {'Location': '/index.html'})
            res.end()
            return
        }
    } catch(e) {
        result = e
    }
    result = JSON.stringify(result)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')

    //开启gzip
    let acceptEncoding = req.headers['accept-encoding']
    if (acceptEncoding && acceptEncoding.includes('gzip')) {
        res.writeHead(200, { 'Content-Encoding': 'gzip' })
        const output = zlib.createGzip()
        output.pipe(res)
        output.write(result, ()=>{
            output.flush(()=>res.end())
        });
    } else {
        res.end(result)
    }
})

//开启ws服务器处理bot请求
const cqPlugin = require('./cqHttp')
const ws = new WebSocket.Server({server})
ws.on('connection', (conn)=>{
    conn.on('message', (data)=>{
        cqPlugin(conn, data)
    })   
})
server.listen(3000)
