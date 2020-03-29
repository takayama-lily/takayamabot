const fs = require("fs")
const WebSocket = require("ws")
const http = require("http")
const zlib = require("zlib")
const vm = require("vm")

mjsoul = null
mjsoulJP = null
context = {}
let functions = {}
const saveContext = ()=>{
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
vm.runInContext(`this.Function.prototype.view = function() {
    return this.toString().replace(/[&\\[\\]]/g, (s)=>{
        if (s === "&") return "&amp;";
        if (s === "[") return "&#91;";
        if (s === "]") return "&#93;";
    });
};
const Function = this.Function;
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
Object.freeze(Symbol);
Object.freeze(Symbol.prototype);
Object.freeze(Proxy);
Object.freeze(Reflect);
Object.freeze(DataView);
Object.freeze(DataView.prototype);
Object.freeze(Atomics);
delete Promise;
delete globalThis;
delete console;
const constructor = undefined;
const 草 = undefined;
const 艹 = undefined;
let data;`, context)
vm.runInContext(`const 帮助=\`-----固定指令:
-雀魂 昵称 ★查询雀魂战绩，缩写"-qh"
-雀魂日服 昵称 ★查询雀魂日服战绩，缩写"-qhjp"
-国服排名 ★查询雀魂排名，缩写"-rank" (三麻: -rank 3)
-日服排名 ★查询雀魂日服排名，缩写"-rankjp" (三麻: -rankjp 3)
-牌谱 牌谱链接或ID ★查询牌谱，缩写"-pp"
-疫情 ★查询疫情信息，缩写"-yq"
-牌理 ★牌理点数計算，缩写"-pl"
-新番 ★查询新番时间表，缩写"-bgm"
-anime 动漫名 ★查询动漫，同类指令:book,music,game,real
dhs ★雀魂大会室后台管理功能
小游戏 ★查看小游戏列表
高级 ★查看高级指令，缩写advance\`;
const help=帮助;`, context)
vm.runInContext(`const 高级=\`-----高级指令:
1.执行js代码(可以用来教我说话): 
  ①直接输入，例: 你好="你也好"
  ②调试模式，前面添加反斜杠，例: \\\\a=b ★调试模式下输入有错我会反馈错误信息
  data ★环境变量(里面存放了发言人的qq号昵称群号等信息)
2.其他:
  milestone ★里程碑，有重要更新时会记录一下
  about ★关于我\`;
const advance=高级;`, context)
vm.runInContext(`const 小游戏=\`-----小游戏列表:
1. jrrp() , jrqs() , sjqs() , jrz()
2. 猜拳游戏，在群里输入: 猜拳()
3. 给别人写信，输入: 写信()
★不断制作添加中\`;`, context)
vm.runInContext(`const 关于=\`-----关于我:
以下操作可能会让我不再理睬你
  ● 任何攻击我的行为: 写大量死循环、内存泄露式攻击等
  ● 教我说涉及暴恐、反动、迷信等政治不正确的话
  ● 利用我传播谣言，或对他人进行侮辱诽谤、人身攻击
有bug或者建议可以联系我的主人\`;
const about=关于;`, context)
vm.runInContext(`const milestone=\`2020/3/28:
添加了雀魂大会室管理功能
2020/3/23:
1.现在函数可以持久化保存了，重启不会丢失。非全局变量(const和let定义的)不适用。
2.增加了milestone，删除了changelog。
3.-pl增加了向听和何切的计算。
2020/3/18:
1.增加了changelog常量。帮助和help现在也是常量。
2.所有固定指令现在都有英文简写。
3.内置js对象现在不能删除和修改。
4.沙盒中的代码最大执行时间从50ms改为20ms。(又改回50ms了)
※js沙盒无法做到100%安全，大家要爱护公共环境\``, context)
if (fs.existsSync("./context.fn")) {
    let fns = JSON.parse(fs.readFileSync("./context.fn"))
    for (let k in fns) {
        try {
            vm.runInContext(k + '=' + fns[k], context)
        } catch (e) {}
    }
}
context["向听"] = require('syanten')

setInterval(()=>{
    saveContext()
    fs.writeFile("./context.fn", JSON.stringify(functions), (err)=>{
        if (!err) fs.copyFile("./context.fn", "./bk/context.fn", ()=>{})
    })
    fs.writeFile("./context", JSON.stringify(context), (err)=>{
        if (!err) fs.copyFile("./context", "./bk/context", ()=>{})
    })
}, 1800000)

process.on('exit', (code)=>{
    saveContext()
    fs.writeFileSync("./context.fn", JSON.stringify(functions))
    fs.writeFileSync("./context", JSON.stringify(context))
})
process.on("uncaughtException", (e)=>{
    fs.appendFileSync("err.log", Date() + " " + e.stack + "\n")
    process.exit(1)
})
process.on('unhandledRejection', (reason, promise)=>{
    fs.appendFileSync('err.log', Date() + ' Unhandled Rejection at:' + promise + 'reason:' + reason + '\n')
});

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
