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
    context = JSON.parse(fs.readFileSync("./context"))
}
vm.createContext(context)
vm.runInContext(`const Object = this.Object;
const Boolean = this.Boolean;
const Number = this.Number;
const BigInt = this.BigInt;
const Math = this.Math;
const Date = this.Date;
const String = this.String;
const RegExp = this.RegExp;
const Array = this.Array;
const Map = this.Map;
const Set = this.Set;
const ArrayBuffer = this.ArrayBuffer;
const JSON = this.JSON;
const Error = this.Error;
const isFinite = this.isFinite;
const isNaN = this.isNaN;
const parseFloat = this.parseFloat;
const parseInt = this.parseInt;
const decodeURI = this.decodeURI;
const decodeURIComponent = this.decodeURIComponent;
const encodeURI = this.encodeURI;
const encodeURIComponent = this.encodeURIComponent;
const escape = this.escape;
const unescape = this.unescape;
Object.freeze(Object);
Object.freeze(Object.prototype);
Object.freeze(Boolean);
Object.freeze(Boolean.prototype);
Object.freeze(Number);
Object.freeze(Number.prototype);
Object.freeze(BigInt);
Object.freeze(BigInt.prototype);
Object.freeze(Math);
Object.freeze(Date);
Object.freeze(Date.prototype);
Object.freeze(String);
Object.freeze(String.prototype);
Object.freeze(RegExp);
Object.freeze(RegExp.prototype);
Object.freeze(Array);
Object.freeze(Array.prototype);
Object.freeze(Map);
Object.freeze(Map.prototype);
Object.freeze(Set);
Object.freeze(Set.prototype);
Object.freeze(ArrayBuffer);
Object.freeze(ArrayBuffer.prototype);
Object.freeze(JSON);
Object.freeze(Error);
Object.freeze(Error.prototype);
delete globalThis;
delete eval;
delete Function;
let data;`, context)

setInterval(()=>{
    for (let k in context) {
        if (typeof context[k] !== 'string') {
            try {
                JSON.stringify(context[k])
            } catch (e) {
                context[k] = []
            }
        }
    }
    fs.writeFileSync("./context", JSON.stringify(context))
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
const mid = require("./mid.js")
ws.on('connection', (conn)=>{
    conn.on('message', (data)=>{
        mid(conn, data)
    })   
})

server.listen(3000)
