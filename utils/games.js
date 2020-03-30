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


cjly=(str)=>{
    str = str.toString()
    let res = ''
    let i = 0
    while (i<str.length) {
        res += str.charCodeAt(i).toString(36) + ' '
        i++
    }
    return "jly(\""+res.trim()+"\")"
}
jly=(str)=>{
    let res = ''
    str = str.split(' ')
    let i = 0
    while (i<str.length) {
        if (isNaN(parseInt(str[i],36))) 
            return at()+"刚才好像使用了精灵语, 但是语法不对, 不知道在说什么"
        res += String.fromCharCode(parseInt(str[i],36))
        i++
    }
    if (!res.trim().length)
        return at()+"刚才好像使用了精灵语, 但是语法不对, 不知道在说什么"
    return at()+"刚才使用了精灵语, 大意是：\n"+res
}
c精灵语=(str)=>{
    str = str.toString()
    let res = ''
    let i = 0
    while (i<str.length) {
        res += str.charCodeAt(i).toString(36) + ' '
        i++
    }
    return "精灵语(\""+res.trim()+"\")"
}
精灵语=(str)=>{
    let res = ''
    str = str.split(' ')
    let i = 0
    while (i<str.length) {
        if (isNaN(parseInt(str[i],36))) 
            return at()+"刚才好像使用了精灵语, 但是语法不对, 不知道在说什么"
        res += String.fromCharCode(parseInt(str[i],36))
        i++
    }
    if (!res.trim().length)
        return at()+"刚才好像使用了精灵语, 但是语法不对, 不知道在说什么"
    return at()+"刚才使用了精灵语, 大意是：\n"+res
}

conv = (h)=>{
    let r = [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
    let mpsz = ["m","p","s","z"]
    let k
    for (let i=h.length-1;i>=0;i--){
        if(isNaN(h[i]) && mpsz.includes(h[i])) {
            k=mpsz.indexOf(h[i])
        } else{
            let ttt = h[i]
            if(ttt==0)
                ttt=5;
            r[k][ttt-1]++
        }
    }
    return r
}

麻将格式化 = (t)=>{
    var str2unicode = {};
    str2unicode["1z"] = String.fromCodePoint(126976);
    str2unicode["2z"] = String.fromCodePoint(126977);
    str2unicode["3z"] = String.fromCodePoint(126978);
    str2unicode["4z"] = String.fromCodePoint(126979);
    str2unicode["7z"] = String.fromCodePoint(126980);
    str2unicode["6z"] = String.fromCodePoint(126981);
    str2unicode["5z"] = String.fromCodePoint(126982);
    str2unicode["8z"] = String.fromCodePoint(127019); //牌背
    str2unicode["0z"] = " ";//空格

    var mjUnicode = 126983;

    for (let j = 0, mjType = ["m", "s", "p"]; j < 3; j++) {
        for (let i = 1; i < 10; i++, mjUnicode++) {
            str2unicode[i + mjType[j]] = String.fromCodePoint(mjUnicode);
        }
    }
    t = t
        .replace(/\s/g, "0z")
        .replace(/[#＃]/g, "8z")
        .replace(/[东東]/g, "1z")
        .replace(/南/g, "2z")
        .replace(/西/g, "z")
        .replace(/北/g, "4z")
        .replace(/白/g, "5z")
        .replace(/[发發発]/g, "6z")
        .replace(/中/g, "7z")
        .replace(/(\d)(\d{0,8})(\d{0,8})(\d{0,8})(\d{0,8})(\d{0,8})(\d{0,8})(\d{8})(m|p|s|z)/g, "$1$9$2$9$3$9$4$9$5$9$6$9$7$9$8$9")
        .replace(/(\d?)(\d?)(\d?)(\d?)(\d?)(\d?)(\d)(\d)(m|p|s|z)/g, "$1$9$2$9$3$9$4$9$5$9$6$9$7$9$8$9")
        .replace(/(m|p|s|z)(m|p|s|z)+/g, "$1")
        .replace(/^[^\d]/, "");
    var returnStr = "";
    for (let i = 0; i < t.length; i += 2) {
        let hai = t.substr(i, 2);
        if (hai == "0m" || hai == "0p" || hai == "0s") {
            returnStr += "[赤" + str2unicode[hai.replace("0", "5")] + "]";
        } else {
            returnStr += (typeof str2unicode[hai] == 'undefined') ? '' : str2unicode[hai];
        }
    }
    return returnStr;
}

起手=(sd)=>{
    sd = sd.toString()
    while (sd.length < 16) {
        sd += sd
    }
    const mpsz = ['m','p','s','z']
    let t = []
    let h = []
    for (let i = 0; h.length < 14; i++) {
        let a = sd.substr(i) % 136
        if (t.includes(a))
            a = Math.floor(a/4) === Math.floor((a+1)/4) ? a+1 : a-1
        t.push(a)
        let b = Math.floor(a / 4)
        let c = Math.floor(b / 9)
        let d = b%9+1
        if ([16, 52, 88].includes(a)) d=0
        h.push(mpsz[c]+d)
    }
    h.sort()
    let res = ''
    for (let i in h) {
        i = parseInt(i)
        res += h[i][1]
        if (h[i+1] && h[i][0]===h[i+1][0]) continue
        res += h[i][0]
    }
    return res
}

sjqs=()=>{
    let sd = Math.floor(Math.random()*10**16)
    let res = 起手(sd)
    return at() + " 你随机得到了以下的手牌:\n" + res + " (" + 向听(conv(res)) + "向听)\n" + 麻将格式化(res)
}

jrqs = (q=qq())=>{
    let sd = seed(q).toString()
    let res = 起手(sd)
    return at(q) + " 今天的起手是:\n" + res + " (" + 向听(conv(res)) + "向听)\n" + 麻将格式化(res)
}

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
●第二个参数是写信内容(放在反引号或引号中间，反引号支持换行引号不支持)
例:
写信(429245111, \`我喜欢你\`)
★收信输入: 收信() 、删信输入: 删信()`
    }
    q = parseInt(q)
    if (!letters) letters = {}
    if (!letters[q]) letters[q]=[]
    letters[q].unshift({from:qq(),time:Date.now(),msg:encodeURIComponent(msg)})
    return at() + ' 已送信'
}
收信=()=>{
    let q = qq()
    if (!letters) letters = {}
    if (!letters[q]) letters[q]=[]
    if (!letters[q].length)
        return at() + " 你的信箱是空的"
    let res = at() + '\n'
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
        res += `发信人: ${v.from+at(v.from)} / 时间: ${time}前 / 正文:\n${decodeURIComponent(v.msg)}\n\n`
    }
    return res
}
删信=()=>{
    if (!letters) letters = {}
    letters[qq()]=[]
    return at() + " 信箱已清空"
}
