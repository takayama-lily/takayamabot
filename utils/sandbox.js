const fs = require("fs")
const vm = require("vm")
const contextSavePath = './data/'
const contextFile = contextSavePath + 'context'
const fnFile = contextSavePath + 'context.fn'
const initCode = './utils/sandbox.code.js'
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

context["向听"] = require('syanten')
context["向听"].constructor = undefined
vm.runInContext(fs.readFileSync(initCode), context)

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
