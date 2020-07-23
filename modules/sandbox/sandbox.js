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
        if (o.isProtected(k) && !o.isMaster())
            return false
        if (typeof o.recordSetHistory === "function") {
            o.set_history_allowed = true
            o.recordSetHistory(k)
            o.set_history_allowed = false
        }
        return Reflect.set(o, k, v)
    },
    defineProperty: (o, k, d)=>{
        if (!init_finished || o.isMaster())
            return Reflect.defineProperty(o, k, d)
        else 
            return false
    },
    deleteProperty: (o, k)=>{
        if (!init_finished || o.isMaster() || !o.isProtected(k))
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
    const restoreFunctions = (o, name)=>{
        for (let k in o) {
            let key = name + `["${k}"]`
            if (typeof o[k] === "string") {
                try {
                    vm.runInContext(`${key}=` + o[k], context)
                } catch(e) {}
            } else if (typeof o[k] === "object") {
                restoreFunctions(o[k], key)
            }
        }
    }
    restoreFunctions(fn, "this")
}

//执行init代码
vm.runInContext(fs.readFileSync(initCodeFile), context)

//冻结内置对象(不包括Promise,console,eval,globalThis)
const internal_properties = [
  'Object',             'Function',       'Array',
  'Number',             'parseFloat',     'parseInt',
  'Boolean',            'String',         'Symbol',
  'Date',               'RegExp',         'eval',
  'Error',              'EvalError',      'RangeError',
  'ReferenceError',     'SyntaxError',    'TypeError',
  'URIError',           'JSON',           'Promise',
  'Math',               'Intl',
  'ArrayBuffer',        'Uint8Array',     'Int8Array',
  'Uint16Array',        'Int16Array',     'Uint32Array',
  'Int32Array',         'Float32Array',   'Float64Array',
  'Uint8ClampedArray',  'BigUint64Array', 'BigInt64Array',
  'DataView',           'Map',            'BigInt',
  'Set',                'WeakMap',        'WeakSet',
  'Proxy',              'Reflect',        'decodeURI',
  'decodeURIComponent', 'encodeURI',      'encodeURIComponent',
  'escape',             'unescape',
  'isFinite',           'isNaN',          'SharedArrayBuffer',
  'Atomics',            'WebAssembly'
]
for (let v of internal_properties) {
    vm.runInContext(`this.Object.freeze(this.${v})
this.Object.freeze(this.${v}.prototype)
const ${v} = this.${v}`, context)
}
init_finished = true
// vm.runInContext("this.afterInit()", context)

//定时持久化context(60分钟)
let fn
const saveFunctions = (o, mp)=>{
    for (let k in o) {
        if (typeof o[k] === "function") {
            mp[k] = o[k].toString()
        } else if (typeof o[k] === "object" && o[k] !== null) {
            if (o === context) {
                try {
                    if (JSON.stringify(o[k]).length > 10485760)
                        o[k] = undefined
                } catch (e) {
                    o[k] = undefined
                }
            }
            if (o[k] === undefined)
                continue
            mp[k] = {}
            saveFunctions(o[k], mp[k])
        }
    }
}
const beforeSaveContext = ()=>{
    setEnv()
    fn = {}
    saveFunctions(context, fn)
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
}, 3600000)

//沙盒执行超时时间
let timeout = 300
module.exports.setTimeout = (t)=>timeout=t

//执行代码
module.exports.run = (code)=>{
    code = code.trim()
    let debug = ["\\","＼"].includes(code.substr(0, 1))
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
        let code2 = vm.runInContext(`this.beforeExec(${JSON.stringify(code)})`, context, {timeout: timeout})
        if (typeof code2 === "string")
            code = code2
        let res = vm.runInContext(code, context, {timeout: timeout})
        if (res instanceof vm.runInContext("Promise", context))
            res = undefined
        let res2 = vm.runInContext(`this.afterExec(${JSON.stringify(res)})`, context, {timeout: timeout})
        if (typeof code2 !== "undefined")
            res = res2
        return res
    } catch(e) {
        if (debug) {
            let line = e.stack.split("\n")[0].split(":").pop()
            return e.name + ": " + e.message + " (line: " + parseInt(line) + ")"
        }
    }
}
module.exports.exec = (code)=>vm.runInContext(code, context)

//设置环境变量
const setEnv = (env = {})=>{
    set_env_allowed = true
    vm.runInContext(`this.data=` + JSON.stringify(env), context)
    vm.runInContext(`if (typeof $ === "object" && $.getGroupInfo()) this.data.group_name=$.getGroupInfo().group_name`, context)
    vm.runInContext(`Object.freeze(this.data);Object.freeze(this.data.sender);Object.freeze(this.data.anonymous);`, context)
    set_env_allowed = false
}
module.exports.setEnv = setEnv

//传递一个外部对象到context
const include = (name, object)=>{
    context[name] = object
    vm.runInContext(`const ${name} = this.${name}
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
    vm.runInContext(`throw new ${type}("${msg}")`, context)
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
