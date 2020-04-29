const fs = require("fs")
const vm = require("vm")
const dataPath = module.path + "/../data/"
const contextFile = dataPath + "context"
const fnFile = dataPath + "context.fn"
const initCodeFile = module.path + "/sandbox.code.js"
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, {recursive: true, mode: 0o700})
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
        try {
            vm.runInContext(k + "=" + fn[k], context)
        } catch(e) {}
    }
}

vm.runInContext(fs.readFileSync(initCodeFile), context)

let fn = {}
const beforeSaveContext = ()=>{
    for (let k in context) {
        if (typeof context[k] === "function") {
            fn[k] = context[k].toString()
        }
        if (typeof context[k] === "object") {
            try {
                if (JSON.stringify(context[k]).length > 524288)
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

const run = (data, timeout = undefined, isAdmin = false)=>{
    let code = data.message
    let debug = ["\\","＼"].includes(code.substr(0, 1))
    if (code.match(/([^\w]|^)+(this|async|const){1}([^\w]|$)+/) && !isAdmin)
        return debug ? "代码不要包含this、async、const关键字。" : undefined
    if (debug)
        code = code.substr(1)
    code = code.replace(/(（|）|，|″|“|”|＝)/g, (s)=>{
        if (["″","“","”"].includes(s)) return "\""
        if (s === "，") return ","
        if (s === "＝") return "="
        return String.fromCharCode(s.charCodeAt(0) - 65248)
    })
    vm.runInContext("data="+JSON.stringify(data), context)
    vm.runInContext("Object.freeze(data);Object.freeze(data.sender);Object.freeze(data.anonymous);", context)
    try {
        return vm.runInContext(code, context, {timeout: timeout})
    } catch(e) {
        if (debug) {
            let line = e.stack.split("\n")[0].split(":").pop()
            return e.name + ": " + e.message + " (line: " + parseInt(line) + ")"
        }
    }
}

module.exports.require = (name, object)=>{
    if (object.constructor)
        object.constructor = undefined
    context[name] = object
}
module.exports.run = run
module.exports.getContext = ()=>context
