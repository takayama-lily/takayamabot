const fs = require("fs")
const path = require("path")
const cp = require("child_process")

const bots = new Map

/**
 * @type {cp.ChildProcess}
 */
let worker
let flag = true

;(function startWorker() {
    if (!flag)
        return
    console.log(Date(), "sandbox启动")
    worker = cp.fork(path.join(__dirname, "bridge.js"))
    worker.on("error", (err) => {
        fs.appendFile("err.log", Date() + " " + err.stack + "\n", ()=>{})
    })
    worker.on("exit", () => {
        console.log(Date(), "sandbox停止")
        startWorker()
    })
    worker.on("message", async (value) => {
        const bot = bots.get(value?.uin)
        if (!bot)
            return
        let ret = await bot[value?.method]?.apply(bot, value?.params)
        if (ret instanceof Map)
            ret = Array.from(ret)
        ret.echo = value?.echo
        worker.send({
            data: ret,
            echo: value?.echo
        })
    })
})()

function listener(data) {
    data.self_id = this.uin
    worker.send(data)
}

/**
 * 当一个bot实例启用了此插件时被调用
 * @param {import("oicq").Client} bot 
 */
function activate(bot) {
    bots.set(bot.uin, bot)
    bot.on("message", listener)
    bot.on("notice", listener)
    bot.on("request", listener)
    // bot.on("system", listener)
}

/**
 * 当一个bot实例禁用了此插件时被调用
 * @param {import("oicq").Client} bot 
 */
function deactivate(bot) {
    bot.off("message", listener)
    bot.off("notice", listener)
    bot.off("request", listener)
    // bot.off("system", listener)
    bots.delete(bot.uin)
}

function destructor() {
    flag = false
    worker?.kill()
}

module.exports = {
    activate, deactivate, destructor,
}
