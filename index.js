const fs = require("fs")
const WebSocket = require("ws")
const http = require("http")
const zlib = require("zlib")
const vm = require("vm")

mjsoul = null
mjsoulJP = null
context = {}
const saveContext = ()=>{
    let functions = {}
    for (let k in context) {
        if (typeof context[k] === 'function') {
            functions[k] = context[k].toString()
        }
        if (typeof context[k] === 'object') {
            try {
                if (JSON.stringify(context[k]).length > 524288)
                    delete context[k]
            } catch (e) {
                delete context[k]
            }
        }
    }
    fs.writeFile("./context.fn", JSON.stringify(functions), {mode: 0o600}, ()=>{})
    fs.writeFile("./context", JSON.stringify(context), {mode: 0o600}, ()=>{})
}

if (fs.existsSync("./context")) {
    context = JSON.parse(fs.readFileSync("./context"))
}
vm.createContext(context, {
    codeGeneration: {
        strings: false,
        wasm: false
    }
})
vm.runInContext(`const Function = this.Function;
const Object = this.Object;
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
const SharedArrayBuffer = this.SharedArrayBuffer;
const JSON = this.JSON;
const Error = this.Error;
const WeakSet = this.WeakSet;
const WeakMap = this.WeakMap;
const Promise = this.Promise;
const Symbol = this.Symbol;
const Proxy = this.Proxy;
const Reflect = this.Reflect;
const DataView = this.DataView;
const Atomics = this.Atomics;

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
const eval = this.eval;

Object.freeze(Function);
Object.freeze(Function.prototype);
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
Object.freeze(SharedArrayBuffer);
Object.freeze(SharedArrayBuffer.prototype);
Object.freeze(JSON);
Object.freeze(Error);
Object.freeze(Error.prototype);
Object.freeze(WeakSet);
Object.freeze(WeakSet.prototype);
Object.freeze(WeakMap);
Object.freeze(WeakMap.prototype);
Object.freeze(Promise);
Object.freeze(Promise.prototype);
Object.freeze(Symbol);
Object.freeze(Symbol.prototype);
Object.freeze(Proxy);
Object.freeze(Reflect);
Object.freeze(DataView);
Object.freeze(DataView.prototype);
Object.freeze(Atomics);
delete globalThis;
delete console;
const 草 = undefined;
const 艹 = undefined;
let data;`, context)
vm.runInContext(`const 帮助=\`-----固定指令(前面加"-"):
-雀魂 昵称 ★查询雀魂战绩，缩写-qh
-雀魂日服 昵称 ★查询雀魂日服战绩，缩写-qhjp
-国服排名 ★查询雀魂排名，缩写-rank(三麻: -rank 3)
-日服排名 ★查询雀魂日服排名，缩写-rankjp(三麻: -rankjp 3)
-牌谱 牌谱链接或ID ★查询牌谱，缩写-pp
-疫情 ★查询疫情信息，缩写-yq
-牌理 ★牌理点数計算，缩写-pl
-新番 ★查询新番时间表，缩写-bgm
-anime 动漫名 ★查询动漫，同类指令:book,music,game,real
高级 ★查看高级指令，缩写advance\``, context)
vm.runInContext(`const help=帮助;
const 高级=\`-----高级指令:
1.执行js代码: 
  ①输入代码直接执行，如var a=1;无报错信息。
  ②代码放在反斜杠后，如\\\\var a=1;有报错信息。
  ★进程有时会重启，常量和function类型变量在重启后无法还原
  data ★查看环境变量
2.查看开机时间:
  -uptime
3.查看最新changelog:
  changelog\``, context)
vm.runInContext(`const advance=高级;
const changelog=\`changelog(2020/3/18):
1.增加了changelog常量。帮助和help现在也是常量。
2.所有固定指令现在都有英文简写。
3.内置js对象现在不能删除和修改。
4.沙盒中的代码最大执行时间从50ms改为20ms。
※js沙盒无法做到100%安全，大家要爱护公共环境\``, context)
if (fs.existsSync("./context.fn")) {
    let functions = JSON.parse(fs.readFileSync("./context.fn"))
    for (let k in functions) {
        try {
            vm.runInContext(k + '=' + functions[k], context)
        } catch (e) {}
    }
}

setInterval(saveContext, 1800000)

process.on('exit', (code)=>{
    saveContext()
})
process.on("uncaughtException", (e)=>{
    fs.appendFile("err.log", Date() + " " + e.stack + "\n", ()=>{})
    process.exit(1)
})

const api = require("./api.js")
const cqbot = require("./cqbot.js")
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
        cqbot(conn, data)
    })   
})
server.listen(3000)
