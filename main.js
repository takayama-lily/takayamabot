const fs = require("fs")
const http = require("http")
const WebSocket = require("ws")
process.on("uncaughtException", (e)=>{
    fs.appendFileSync("err.log", Date() + " " + e.stack + "\n")
})
process.on("unhandledRejection", (reason, promise)=>{
    fs.appendFileSync("err.log", Date() + " Unhandled Rejection at:" + JSON.stringify(promise) + "reason:" + JSON.stringify(reason) + "\n")
})

//开启http服务器处理一些请求
const server = http.createServer(require("./web_hooks"))

const QQPlugin = require("./modules/qqplugin/cqhttp")
const bot = new QQPlugin()
require("./bridge")(bot)

//开启ws服务器处理bot请求
const ws = new WebSocket.Server({server})
ws.on("connection", (conn)=>{
    bot.conn = conn
    conn.on("message", (data)=>{
        bot.onEvent(data)
    })
    bot.emit("connection")
})
server.listen(3000)
