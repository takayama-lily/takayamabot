const fs = require("fs")
const vm = require("vm")
const contextSavePath = './data/'
const contextFile = contextSavePath + 'context'
const fnFile = contextSavePath + 'context.fn'
if (!fs.existsSync(contextSavePath)) {
    fs.mkdirSync(contextSavePath, {recursive: true, mode: 0o700})
}

let context = {}
if (fs.existsSync(contextFile)) {
    context = JSON.parse(fs.readFileSync(contextFile))
}
vm.createContext(context, {
    codeGeneration: {
        strings: false,
        wasm: false
    }
})
if (fs.existsSync(fnFile)) {
    let fn = JSON.parse(fs.readFileSync(fnFile))
    for (let k in fn) {
        vm.runInContext(k + '=' + fn[k], context)
    }
}

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
let data;`, context)
vm.runInContext(`const 帮助=\`-----指令列表:
-雀魂 ★查询雀魂日服战绩(-qh)
-排名 ★雀魂日服排名(-rank 3)
-疫情 ★查询疫情信息(-qy)
-牌理 ★牌理点数計算(-pl)
-新番 ★新番时间表(-bgm)
-动漫 ★查询动漫(-anime)
-龙王 , -发言
小游戏 ★查看小游戏列表
高级 ★查看高级指令\`;
const help=帮助;`, context)
vm.runInContext(`const 高级=\`-----高级指令:
执行js代码: 
  ①直接输入，例: 你好="你也好"
  ②调试模式，前面添加反斜杠，例: \\\\a=b ★调试模式下会反馈错误信息
data ★环境变量\`;
const advance=高级;`, context)
vm.runInContext(`const 小游戏=\`-----js小游戏列表:
● jrrp() , jrqs() , sjqs() , jrz()
● 象棋()
● 提问("明天会下雨吗")
● cjly("这是一段精灵语")
● 猜拳() , 写信()
经常会添加一些奇怪的东西\`;`, context)
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
context["向听"] = require('syanten')
context["向听"].constructor = undefined

let fn = {}
const beforeSaveContext = ()=>{
    for (let k in context) {
        if (typeof context[k] === 'function') {
            fn[k] = context[k].toString()
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
process.on('exit', (code)=>{
    beforeSaveContext()
    fs.writeFileSync(fnFile, JSON.stringify(fn))
    fs.writeFileSync(contextFile, JSON.stringify(context))
})
setInterval(()=>{
    beforeSaveContext()
    fs.writeFile(fnFile, JSON.stringify(fn), (err)=>{})
    fs.writeFile(contextFile, JSON.stringify(context), (err)=>{})
}, 1800000)

const run = (code, timeout = 0, debug = false)=>{
    try {
        return vm.runInContext(code, context, {timeout: timeout})
    } catch(e) {
        if (debug) {
            let line = e.stack.split('\n')[0].split(':').pop()
            return e.name + ': ' + e.message + ' (line: ' + parseInt(line) + ')'
        }
    }
}

module.exports.run = run
