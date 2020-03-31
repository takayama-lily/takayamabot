'use strict'
const parseData = (data)=>{
    return JSON.parse(data)
}
const qqs = []
const connection = null

const send = (data)=>{
    connection.send(JSON.stringify(data))
}

const actions = {
    set_friend_add_request: (flag)=>{
        send({
            "action": "set_friend_add_request",
            "params": {
                "flag": flag
            }
        })
    },
    set_group_add_request: (flag)=>{
        send({
            "action": "set_group_add_request",
            "params": {
                "flag": flag,
                "sub_type": "invite"
            }
        })
    },
}

const main = (conn, data)=>{
    connection = conn
    data = parseData(data)
    if (data.post_type === "message") {
        
    }
    if (data.post_type === "request") {
        if (data.request_type === "friend") {
            ws.send(JSON.stringify({
                "action": "set_friend_add_request",
                "params": {
                    "flag": data.flag
                }
            }))
        }
        if (data.request_type === "group" && data.sub_type === "invite") {
            ws.send(JSON.stringify({
                "action": "set_group_add_request",
                "params": {
                    "flag": data.flag,
                    "sub_type": "invite"
                }
            }))
        }
    }
}

module.exports = main
module.exports.api = actions
