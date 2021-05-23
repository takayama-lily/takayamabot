"use strict"
const path = require("path")
const { Worker } = require("worker_threads")

const bots = new Map
let worker
let flag = true

;(function startWorker() {
    if (!flag)
        return
    console.log(Date(), "sandbox启动")
    worker = new Worker(path.join(__dirname, "main.js"), {
        resourceLimits: {
            maxYoungGenerationSizeMb: 128,
            maxOldGenerationSizeMb: 1024,
        }
    })
    worker.on("error", (err) => {
        console.error(err)
    })
    worker.on("exit", () => {
        console.log(Date(), "sandbox停止")
        startWorker()
    })
    worker.on("message", async (value) => {
        const bot = bots.get(value?.uin)
        if (!bot)
            return
        let ret = bot[value?.method]?.apply(bot, value?.params)
        if (ret instanceof Promise)
            ret = await ret
        ret.echo = value?.echo
        worker.postMessage(ret)
    })
})()

function listener(data) {
    worker?.postMessage(JSON.stringify(data))
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
    worker?.terminate()
}

module.exports = {
    activate, deactivate, destructor,
}
