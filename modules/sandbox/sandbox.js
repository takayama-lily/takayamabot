 const fs = require("fs")
const path = require("path")
const vm = require("vm")
const crypto = require("crypto")
const querystring = require("querystring")
const dataPath = path.join(__dirname, "data")
const contextFile = path.join(dataPath, "context")
const fnFile = path.join(dataPath, "context.fn")
const initCodeFile = path.join(__dirname, "sandbox.code.js")
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, {recursive: true, mode: 0o700})
}

//初始化context
let context = Object.create(null)

const protected_properties = [
  'Object',             'Function',       'Array',
  'Number',             'parseFloat',     'parseInt',
  'Infinity',           'NaN',            'undefined',
  'Boolean',            'String',         'Symbol',
  'Date',               'Promise',        'RegExp',
  'Error',              'EvalError',      'RangeError',
  'ReferenceError',     'SyntaxError',    'TypeError',
  'URIError',           'globalThis',     'JSON',
  'Math',               'console',        'Intl',
  'ArrayBuffer',        'Uint8Array',     'Int8Array',
  'Uint16Array',        'Int16Array',     'Uint32Array',
  'Int32Array',         'Float32Array',   'Float64Array',
  'Uint8ClampedArray',  'BigUint64Array', 'BigInt64Array',
  'DataView',           'Map',            'BigInt',
  'Set',                'WeakMap',        'WeakSet',
  'Proxy',              'Reflect',        'decodeURI',
  'decodeURIComponent', 'encodeURI',      'encodeURIComponent',
  'escape',             'unescape',       'eval',
  'isFinite',           'isNaN',          'SharedArrayBuffer',
  'Atomics',            'WebAssembly',
  'onEvents','master','isMaster','blacklist','blacklist2','帮助','help','高级','advance','小游戏'
]

//把context包装成proxy对象，来捕捉一些操作
let set_env_allowed = false
let init_finished = false
context = new Proxy(context, {
    set(o, k, v) {
        if (!init_finished)
            return Reflect.set(o, k, v)
        if (k === "set_history_allowed")
            return false
        if (k === "data" && !set_env_allowed)
            return false
        if (protected_properties.includes(k) && !o.isMaster())
            return false
        if (typeof o.recordSetHistory === "function") {
            o.set_history_allowed = true
            o.recordSetHistory(k)
            o.set_history_allowed = false
        }
        return Reflect.set(o, k, v)
    },
    defineProperty: (o, k, d)=>{
        if (!init_finished)
            return Reflect.defineProperty(o, k, d)
        else 
            return false
    },
    deleteProperty: (o, k)=>{
        if (!init_finished || !protected_properties.includes(k))
            return Reflect.deleteProperty(o, k)
        else
            return false
    },
    preventExtensions: (o)=>{
        return false
    },
    setPrototypeOf: (o, prototype)=>{
        return false
    }
})

//创建context
vm.createContext(context, {
    codeGeneration: {
        strings: false,
        wasm: false
    }
})

//还原context中的数据
if (fs.existsSync(contextFile)) {
    let tmp = JSON.parse(fs.readFileSync(contextFile))
    for (let k in tmp) {
        try {
            vm.runInContext(`this["${k}"]=` + JSON.stringify(tmp[k]), context)
        } catch(e) {}
    }
}

//还原context中的函数
if (fs.existsSync(fnFile)) {
    let fn = JSON.parse(fs.readFileSync(fnFile))
    for (let k in fn) {
        try {
            vm.runInContext(`this["${k}"]=` + fn[k], context)
        } catch(e) {}
    }
}

//执行init代码
vm.runInContext(fs.readFileSync(initCodeFile), context)
init_finished = true

//定时持久化context(30分钟)
let fn = {}
const beforeSaveContext = ()=>{
    setEnv()
    fn = {}
    for (let k in context) {
        if (typeof context[k] === "function") {
            fn[k] = context[k].toString()
        }
        if (typeof context[k] === "object") {
            try {
                if (JSON.stringify(context[k]).length > 10485760)
                    delete context[k]
            } catch (e) {
                delete context[k]
            }
        }
    }
}
process.on("exit", (code)=>{
    beforeSaveContext()
    fs.writeFileSync(fnFile, JSON.stringify(fn))
    fs.writeFileSync(contextFile, JSON.stringify(context))
})
setInterval(()=>{
    beforeSaveContext()
    fs.writeFile(fnFile, JSON.stringify(fn), (err)=>{})
    fs.writeFile(contextFile, JSON.stringify(context), (err)=>{})
}, 1800000)

//沙盒执行超时时间
let timeout = 50
module.exports.setTimeout = (t)=>timeout=t

//执行代码
module.exports.run = (code, isAdmin = false)=>{
    code = code.trim()
    let debug = ["\\","＼"].includes(code.substr(0, 1))
    if (!isAdmin && code.match(/([^\w]|^)+(this|async|const){1}([^\w]|$)+/))
        return debug ? "代码不要包含this、async、const关键字。" : undefined
    if (debug)
        code = code.substr(1)
    code = code.replace(/(（|）|，|″|“|”|＝)/g, (s)=>{
        if (["″","“","”"].includes(s)) return "\""
        if (s === "，") return ","
        if (s === "＝") return "="
        // if (s === "&amp;") return "&"
        // if (s === "&#91;") return "["
        // if (s === "&#93;") return "]"
        return String.fromCharCode(s.charCodeAt(0) - 65248)
    })
    try {
        vm.runInContext(`checkBlack()`, context)
        let res = vm.runInContext(code, context, {timeout: timeout})
        if (!debug && vm.runInContext("isOff()", context) === true)
            return
        vm.runInContext(`checkFrequency()`, context)
        return res
    } catch(e) {
        if (debug) {
            let line = e.stack.split("\n")[0].split(":").pop()
            return e.name + ": " + e.message + " (line: " + parseInt(line) + ")"
        }
    }
}

//设置环境变量
const setEnv = (env = {})=>{
    set_env_allowed = true
    vm.runInContext(`this.data=data=` + JSON.stringify(env), context)
    vm.runInContext(`if ($.getGroupInfo()) this.data.group_name=$.getGroupInfo().group_name`, context)
    vm.runInContext(`Object.freeze(this.data);Object.freeze(this.data.sender);Object.freeze(this.data.anonymous);`, context)
    set_env_allowed = false
}
module.exports.setEnv = setEnv

//传递一个外部对象到context
const include = (name, object)=>{
    context[name] = object
    vm.runInContext(`const ${name} = this.${name}
delete this.${name}
if (!(${name} instanceof Object) && !(${name} instanceof Function))
    Object.setPrototypeOf(${name}, typeof ${name} === "function" ? Function : {})
for (let k in ${name}) {
    if (typeof ${name}[k] === "function" && !(${name}[k] instanceof Function))
        Object.setPrototypeOf(${name}[k], Function)
    else if (typeof ${name}[k] === "object" && ${name}[k] && !(${name}[k] instanceof Object))
        Object.setPrototypeOf(${name}[k], {})
}
Object.freeze(${name})
Object.freeze(${name}.prototype)`, context)
}
module.exports.include = include

//返回context
module.exports.getContext = ()=>context

module.exports.throw = (type = "Error", msg = "")=>{
    vm.runInContext(`throw new ${type}("${msg}")`)
}

//导入一些工具函数(hash,hmac,querystring)
include("hash", (algo, data)=>{
    return crypto.createHash(algo).update(data.toString()).digest("hex")
})
include("hmac", (algo, key, data)=>{
    return crypto.createHmac(algo, key.toString()).update(data.toString()).digest("hex")
})
include("querystring", querystring)
include("base64Encode", (s)=>{
    return Buffer.from(s.toString(), "utf-8").toString('base64')
})
include("base64Decode", (s)=>{
    return Buffer.from(s.toString(), "base64").toString('utf-8')
})
