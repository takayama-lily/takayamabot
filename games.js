qq=()=>{return data.user_id}
qun=()=>{return data.group_id}
at=function(){
    if (!arguments.length)
        return `[CQ:at, qq=${qq()}]`
    let res = ''
    for (let v of arguments) {
        if (!isNaN(v))
            res += `[CQ:at, qq=${v}]`
        else
            res += v
    }
    return res
}
seed=(q=qq())=>{return Math.abs(0xffffffffffffffff%q^0xffffffffffffffff%((Date.now()+28800000)/864/10**5|0))}
jrrp=(q=qq())=>{return at(q) + " 今天的人品是: " + seed(q)%101}
// jrz=()=>{return at()+' 你今天的字是"'+JSON.parse(`["\\u${(seed()%(0x9fa5-0x4e00)+0x4e00).toString(16)}"]`)[0]+'"\n快去找算命先生算一卦吧！'}
jrz=(q=qq())=>{return at(q) + ' 今天的字是"' + String.fromCodePoint(seed(q) % (0x9fa5 - 0x4e00) + 0x4e00) + '"\n快去找算命先生算一卦吧！'}

猜拳结束=()=>{
    let gid = qun()
    let uid = qq()
    if (!jangken) jangken = {}
    if (!jangken.users) jangken.users= {}
    if (!jangken[gid]) jangken[gid] = {}
    if (!gid) return "这个必须在群里说"
    for (let v of jangken[gid]["game"])
        jangken["users"][v] = undefined
    jangken[gid]["game"] = []
    return "猜拳结束了。发起新的猜拳输入：猜拳()"
}
我出=(aaa)=>{
    let gid = qun()
    let uid = qq()
    if (!jangken) jangken = {}
    if (!jangken.users) jangken.users= {}
    if (!jangken[gid]) jangken[gid] = {}
    if (!jangken[gid]["game"]) jangken[gid]["game"] = []
    if (gid > 0) {
        if (jangken[gid]["game"].length < 2) {
            return at() + "猜拳还未开始，发起或加入猜拳输入：猜拳()"
        }
        if (!jangken[gid]["game"].includes(uid)) {
            return at() + "你不是参加者。"
        }
        return at(uid) + "这个不可以在群里说哦。"
    }
    if (!isNaN(aaa)) aaa = ["剪刀","石头","布"][aaa-1]
    if (!["剪刀","石头","布"].includes(aaa)) {
        return '只能出 "剪刀(1)、石头(2)、布(3)" 中的一种。'
    }
    jangken["users"][uid] = encodeURIComponent(aaa)
    return "你出了"+aaa+"。去群里输入：猜拳() 查看结果"
}

猜拳=()=>{
    let gid = qun()
    let uid = qq()
    if (!jangken) jangken = {}
    if (!jangken.users) jangken.users= {}
    if (!jangken[gid]) jangken[gid] = {}
    if (!jangken[gid]["game"]) jangken[gid]["game"] = []
    if (!gid) return "玩猜拳需要在群里说才行"
    let c = jangken[gid]["game"].length
    if (c >= 2) {
        let res = ''
        let p0 = jangken[gid]["game"][0]
        let p1 = jangken[gid]["game"][1]
        if (jangken["users"][p0] !== undefined && jangken["users"][p1] !== undefined) {
            res += "猜拳结果："
            res += "\n" + at(p0) + "出了 " + decodeURIComponent(jangken["users"][p0])
            res += "\n" + at(p1) + "出了 " + decodeURIComponent(jangken["users"][p1])
            jangken["users"][p0] = undefined
            jangken["users"][p1] = undefined
            jangken[gid]["game"] = []
            res += "\n发起新的猜拳输入：猜拳()"
        } else {
            res += "猜拳正在进行中\n"
            if (jangken["users"][p0] === undefined)
                res += at(p0) + "还未出\n"
            else
                res += at(p0) + "已出\n"
            if (jangken["users"][p1] === undefined)
                res += at(p1) + "还未出\n"
            else
                res += at(p1) + "已出\n"
            res += "立刻结束输入：猜拳结束()"
        }
        return res
    } else {
        if (c === 0) {
            jangken[gid]["game"].push(uid)
            return at(uid) + "发起了猜拳。一起玩输入：猜拳()"
        } else if (c === 1) {
            if (jangken[gid]["game"].includes(uid)) {
                return at(uid) + "你是发起人，需要再等待一个小伙伴。"
            } else {
                jangken[gid]["game"].push(uid)
                for (let v of jangken[gid]["game"])
                    jangken["users"][v] = undefined
                return at(uid) + "加入了猜拳。\n请" + at(jangken[gid]["game"][0]) + at(jangken[gid]["game"][1]) + `私聊我出什么\n例：我出("剪刀")、我出(1) \n1剪刀 2石头 3布`
            }
        }
    }
}

写信=(q, msg)=>{
    if (!q || isNaN(q) || msg === undefined) {
        return `写信使用方法: 
●第一个参数是对方的qq号
●第二个参数是写信内容(放在反引号中间)
例:
写信(429245111, \`你好\`)
★收信输入: 收信() 、删信输入: 删信()`
    }
    q = parseInt(q)
    if (!letters) letters = {}
    if (!letters[q]) letters[q]=[]
    letters[q].unshift({from:qq(),time:Date.now(),msg:msg})
    return '已送信'
}
收信=()=>{
    let q = qq()
    if (!letters) letters = {}
    if (!letters[q]) letters[q]=[]
    if (!letters[q].length)
        return "你的信箱是空的"
    let res = ""
    for (let v of letters[q]) {
        let time = Math.floor((Date.now() - v.time)/1000)
        if (time >= 86400)
            time = Math.floor(time / 86400) + "天"
        else if (time >= 3600)
            time = Math.floor(time / 3600) + "小时"
        else if (time >= 60)
            time = Math.floor(time / 60) + "分钟"
        else
            time = Math.floor(time) + "秒"
        res += `发信人: ${v.from+at(v.from)} / 时间: ${time}前 / 正文:\n${v.msg}\n\n`
    }
    return res
}
删信=()=>{
    if (!letters) letters = {}
    letters[qq()]=[]
    return "信箱已清空"
}
