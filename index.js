const fs = require("fs")
process.on("uncaughtException", (e)=>{
    fs.appendFile("err.log", Date() + " " + e.stack + "\n", ()=>{})
})
const WebSocket = require("ws")
const http = require("http")
const zlib = require("zlib")
const vm = require("vm")
mjsoul = null
mjsoulJP = null
const api = require("./api.js")

context = {}
if (fs.existsSync("./context")) {
    let tmp = fs.readFileSync("./context")
    try {
        tmp = JSON.parse(tmp)
        for (let k in tmp) {
            if (tmp[k].toString().includes("()=>{};"))
                context[k] = eval(tmp[k])
            else
                context[k] = tmp[k]
        }
    } catch(e){}
}
vm.createContext(context)

setInterval(()=>{
    let tmp = {}
    for (let k in context) {
        tmp[k] = typeof context[k] === "function" ? "()=>{};"+context[k].toString() : context[k]
    }
    fs.writeFileSync("./context", JSON.stringify(tmp))
}, 300000)

const server = http.createServer((req, res)=>{
    api.resolve(req, res).then(data=>{
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        let acceptEncoding = req.headers['accept-encoding']
        if (acceptEncoding && acceptEncoding.indexOf("gzip") !== -1) {
            res.writeHead(200, { 'Content-Encoding': 'gzip' })
            const output = zlib.createGzip()
            output.pipe(res)
            output.write(data, ()=>{
                output.flush(()=>res.end())
            });
        } else {
            res.end(data)
        }
    }, data=>{})
})

const ws = new WebSocket.Server({server})
ws.on('connection', (conn)=>{
    conn.on('message', (data)=>{
        delete require.cache[require.resolve('./cqbot.js')]
        let cqbot = require("./cqbot.js")
        cqbot(conn, data)
    })   
})

server.listen(3000)
