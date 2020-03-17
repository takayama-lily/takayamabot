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
delete data;
delete globalThis;
delete eval;
delete Function;
let data;`, context)
vm.runInContext(`const 帮助=\`固定指令:
-雀魂 nickname ※查雀魂id，缩写-qh
-雀魂日服 nickname ※查雀魂日服id
-牌谱 paipu_id ※查牌谱
-国服排名 ※查雀魂排名，查三麻排名输入-国服排名 3
-日服排名 ※查雀魂日服排名
-新番 ※新番时间表
-anime name ※查动漫(加双引号可获得精确结果)，同类指令:book,music,game,real
-疫情 ※查询即时疫情信息，缩写-yq
-牌理 ※和牌点数計算，缩写-pl
高级 ※查看高级指令\``, context)
vm.runInContext(`const help=帮助;
const 高级=\`高级指令:
1.执行js代码: 
    ①输入代码直接执行，如var a=1;无报错信息。
    ②代码放在斜杠后，如/var a=1;有报错信息。
    ※进程有时会重启，常量和function类型变量在重启后无法还原
2.查看进程启动时间:
    -uptime\``, context)

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
