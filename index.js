const fs = require("fs")
const WebSocket = require("ws")
const http = require("http")
const zlib = require("zlib")
const vm = require("vm")

mjsoul = null
mjsoulJP = null
context = {}
saveContext = ()=>{
    for (let k in context) {
        if (typeof context[k] !== 'string') {
            try {
                if (JSON.stringify(context[k]).length > 524288)
                    delete context[k]
            } catch (e) {
                delete context[k]
            }
        }
    }
    fs.writeFileSync("./context", JSON.stringify(context))
}

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
delete console;
let data;`, context)
vm.runInContext(`const 帮助=\`固定指令(前面加-):
-雀魂(qh) nickname ※查询雀魂战绩
-雀魂日服(qhjp) nickname ※查询雀魂日服战绩
-牌谱(pp) paipu_id ※查询牌谱
-国服排名(rank) ※查询雀魂排名(三麻:-rank 3)
-日服排名(rankjp) ※查询雀魂日服排名(三麻:-rankjp 3)
-新番(bgm) ※查询新番时间表
-anime name ※查询动漫，同类指令:book,music,game,real
-疫情(yq) ※查询疫情信息
-牌理(pl) ※和牌点数計算
帮助(help) ※查看帮助
高级(advance) ※查看高级指令\``, context)
vm.runInContext(`const help=帮助;
const 高级=\`高级指令:
1.执行js代码: 
  ①输入代码直接执行，如var a=1;无报错信息。
  ②代码放在斜杠后，如/var a=1;有报错信息。
  ※进程有时会重启，常量和function类型变量在重启后无法还原
2.查看开机时间:
  -uptime
3.查看最新changlog:
  changlog\``, context)
vm.runInContext(`const advance=高级;
const changelog=\`changelog(2020/3/18):
1.增加了changelog常量。帮助和help现在也是常量。
2.所有固定指令现在都有英文简写。
3.内置js对象现在不能删除和修改。
4.沙盒中的代码最大执行时间从50ms改为10ms。
  ※js沙盒无法做到100%安全，大家要爱护公共环境\``, context)

setInterval(saveContext, 300000)

process.on('exit', (code)=>{
    saveContext()
})
process.on("uncaughtException", (e)=>{
    fs.appendFile("err.log", Date() + " " + e.stack + "\n", ()=>{})
    process.exit(1)
})

const api = require("./api.js")
const mid = require("./mid.js")
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
        mid(conn, data)
    })   
})
server.listen(3000)
