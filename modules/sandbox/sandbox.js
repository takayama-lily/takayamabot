const fs = require("fs")
const path = require("path")
const vm = require("vm")
const dataPath = path.join(__dirname, "data")
const contextFile = path.join(dataPath, "context")
const fnFile = path.join(dataPath, "context.fn")
const initCodeFile = path.join(__dirname, "sandbox.code.js")
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, {recursive: true, mode: 0o700})
}

//初始化context数据
let context = Object.create(null)
if (fs.existsSync(contextFile)) {
    context = JSON.parse(fs.readFileSync(contextFile))
    Object.setPrototypeOf(context, null)
}

//把context包装成proxy对象，来捕捉一些操作
let set_env_allowed = false
let init_finished = false
context = new Proxy(context, {
    set(o, k, v) {
        if (k === "set_history_allowed")
            return false
        if (k === "data" && !set_env_allowed)
            return false
        if (typeof o.recordSetHistory === "function") {
            o.set_history_allowed = true
            o.recordSetHistory(k)
            o.set_history_allowed = false
        }
        return Reflect.set(o, k, v)
    },
    has: (o, k)=>{
        return false
    },
    // ownKeys: (o)=>{
    //     if (!qq())
    //         return Reflect.ownKeys(o)
    //     return false
    // },
    defineProperty: (o, k, d)=>{
        if (init_finished)
            return false
        else
            return Object.defineProperty(o, k, d)
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

//还原context中的函数
if (fs.existsSync(fnFile)) {
    let fn = JSON.parse(fs.readFileSync(fnFile))
    for (let k in fn) {
        try {
            vm.runInContext(k + "=" + fn[k], context)
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
    let debug = ["\\","＼"].includes(code.substr(0, 1))
    if (!isAdmin && code.match(/([^\w]|^)+(this|async|const){1}([^\w]|$)+/))
        return debug ? "代码不要包含this、async、const关键字。" : undefined
    if (debug)
        code = code.substr(1)
    code = code.replace(/(（|）|，|″|“|”|＝|&amp;|&#91;|&#93;)/g, (s)=>{
        if (["″","“","”"].includes(s)) return "\""
        if (s === "，") return ","
        if (s === "＝") return "="
        if (s === "&amp;") return "&"
        if (s === "&#91;") return "["
        if (s === "&#93;") return "]"
        return String.fromCharCode(s.charCodeAt(0) - 65248)
    })
    try {
        return vm.runInContext(code, context, {timeout: timeout})
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
    vm.runInContext(`this.data=data=${JSON.stringify(env)};Object.freeze(this.data);Object.freeze(this.data.sender);Object.freeze(this.data.anonymous);`, context)
    set_env_allowed = false
}
module.exports.setEnv = setEnv

//传递一个外部对象到context
module.exports.require = (name, object)=>{
    context[name] = object
    vm.runInContext(`const ${name} = this.${name}
delete this.${name}
Object.freeze(${name})
Object.freeze(${name}.prototype)`, context)
}

//返回context
module.exports.getContext = ()=>context
