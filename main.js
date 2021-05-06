const fs = require("fs")
const http = require("http")
process.on("uncaughtException", (e)=>{
    fs.appendFileSync("err.log", Date() + " " + e.stack + "\n")
})
process.on("unhandledRejection", (reason, promise)=>{
    fs.appendFileSync("err.log", Date() + " Unhandled Rejection at:" + JSON.stringify(promise) + "reason:" + JSON.stringify(reason) + "\n")
})

// 开启http服务器处理一些请求
const server = http.createServer(require("./web_hooks"))
require("./bridge")
server.listen(3000)
