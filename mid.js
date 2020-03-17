'use strict'
delete require.cache[require.resolve('./cqbot.js')]
const cqbot = require("./cqbot.js")
module.exports = (conn, data)=>{
    cqbot(conn, data)
}
