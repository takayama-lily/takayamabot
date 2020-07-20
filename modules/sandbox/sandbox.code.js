/*
 * 该文件中的所有代码必须在sandbox中执行
 */

//函数定义中若包含CQ码，可用此原型方法查看
this.Function.prototype.view = function() {
    return this.toString().replace(/[&\[\]]/g, (s)=>{
        if (s === "&") return "&amp;"
        if (s === "[") return "&#91;"
        if (s === "]") return "&#93;"
    })
}

delete globalThis
delete Promise
delete console
delete eval

//环境变量(由于用户可以随意给let定义的变量赋值，直接使用data变量是不安全的，应该使用env()函数取得this.data)
let data = {}
Object.defineProperty(this, "data", {
	configurable: false,
	enumerable: false,
	writable: true,
	value: {}
})

const env = this.env = ()=>this.data
const qq = this.qq = ()=>this.data.user_id
const qun = this.qun = ()=>this.data.group_id
const user = this.user = (card=1)=>{
	if(!card)
		return this.data.sender.nickname
	if(this.data.sender.card!=undefined&&this.data.sender.card.length)
		return this.data.sender.card
	else
		return this.data.sender.nickname
}
const parseQQ=(str)=>{
	if (!isNaN(str))
		return parseInt(str)
	return parseInt(str.replace(/[^(0-9)]/g,""))
}
const protectQQ=(q)=>{
	q=parseQQ(q).toString()
	return q.substr(0, 2) + "***" + q.substr(q.length-2, 2)
}
const at=(q=qq())=>`[CQ:at,qq=${parseQQ(q)}]`
const seed=(q=qq())=>Math.abs(0xffffffffffffffff%parseQQ(q)^0xffffffffffffffff%((Date.now()+28800000)/864/10**5|0))
const img=(url,cache=1)=>{
	cache=cache?1:0
	return `[CQ:image,cache=${cache},file=${encodeURI(url)}]`
}
const random=(a,b)=>Math.floor(Math.random()*(b-a)+a)
const qqhead=(q=qq(),cache=true)=>{
	if (q===false||q ===0)
		cache=false,q=qq()
    return img("http://q1.qlogo.cn/g?b=qq&s=640&nk="+parseQQ(q),cache)
}
const grouphead=(gid=qun(),cache=true)=>{
	if (gid===false||gid===0)
		cache=false,gid=qun()
	return img("http://p.qlogo.cn/gh/"+gid+"/"+gid+"/640",cache)
}
const time2str=(timestamp)=>{
	let now = Date.now()
	if (timestamp < 0xffffffff)
		timestamp *= 1000
	let time = Math.floor(Math.abs(now - timestamp)/1000)
    if (time >= 86400)
        time = Math.floor(time / 86400) + "天"
    else if (time >= 3600)
        time = Math.floor(time / 3600) + "小时"
    else if (time >= 60)
        time = Math.floor(time / 60) + "分钟"
    else
        time = Math.floor(time) + "秒"
    return time + (timestamp <= now ? "前" : "后")
}

const alert = (msg, escape = false)=>{
	if (isOff())
		return
	if (qun())
		$.sendGroupMsg(qun(), msg, escape)
	else
		$.sendPrivateMsg(qq(), msg, escape)
}

if (!this.master)
	this.master = "372914165"

const master = undefined
const isMaster = this.isMaster = ()=>{
	return !qq() || this.master.includes(qq())
}
const checkBlack = ()=>{
	if (typeof this.blacklist === "string" && this.blacklist.includes(qq()))
		throw new Error("你已被限制使用此功能，申请恢复请联系管理员。")
	if (typeof this.blacklist2 === "string" && this.blacklist2.includes(qun()))
		throw new Error("该群已被限制使用此功能，申请恢复请联系管理员。")
}
const checkFrequency = ()=>{
	if (qun()) {
		try {
			let last = self().history[qq()].time
			if (!last || Date.now() - last > 1000)
				return
		} catch (e) {
			return
		}
		throw new Error("发言频率过快。")
	}
}

//是否群主和群管理
const isOwner = this.isOwner = ()=>{
	if (!qun())
		return true
	try {
		return $.getGroupInfo().members[qq()].role === "owner"
	} catch (e) {
		return false
	}
}
const isAdmin = this.isAdmin = ()=>{
	if (!qun())
		return true
	try {
		return ["owner","admin"].includes($.getGroupInfo().members[qq()].role)
	} catch (e) {
		return false
	}
}

const error403 = new Error("403 forbidden")

const self = ()=>this.database[qun()]
const group_proxy_handler = {
	get: (o, k)=>{
		if (isMaster())
			return o[k]
		if (parseInt(k) !== qun())
			throw error403
		if (!o.hasOwnProperty(k))
			o[k] = {}
		return o[k]
	},
	set: (o, k, v, r)=>{
		throw error403
	},
	has: (o, k)=>{
		throw error403
	},
	deleteProperty: (o, k)=>{
		throw error403
	},
	defineProperty: (o, k, d)=>{
		throw error403
	},
	ownKeys: (o)=>{
		if (isMaster())
			return Reflect.ownKeys(o)
		throw error403
	},
	preventExtensions: (o)=>{
		throw error403
	},
	setPrototypeOf: (o, prototype)=>{
		throw error403
	}
}
Object.freeze(group_proxy_handler)

this.database = this.database && typeof this.database === "object" ? this.database : {}
this.database = new Proxy(this.database, group_proxy_handler)
Object.defineProperty(this, "database", {
	configurable: false,
	enumerable: true,
	writable: false,
	value: this.database
})

const on = ()=>{
	if (!isAdmin())
		return "管理员才能使用。"
	if (self()) {
		self().js_function_on = true
		return "JS功能已开启"
	}
}
const off = ()=>{
	if (!isAdmin())
		return "管理员才能使用。"
	if (self()) {
		self().js_function_on = false
		return "JS功能已关闭"
	}
}
const isOff = ()=>{
	if (qun() && self()) {
		return self().js_function_on === false
	}
	return false
}

this.set_history = this.set_history && typeof this.set_history === "object" ? this.set_history : {}
this.set_history = new Proxy(this.set_history, {
	set: (o, k, v)=>{
		if (!this.set_history_allowed)
			throw error403
		return Reflect.set(o, k, v)
	},
	has: (o, k)=>{
		throw error403
	},
	deleteProperty: (o, k)=>{
		throw error403
	},
	defineProperty: (o, k, d)=>{
		throw error403
	},
	ownKeys: (o)=>{
		if (isMaster())
			return Reflect.ownKeys(o)
		throw error403
	},
	preventExtensions: (o)=>{
		throw error403
	},
	setPrototypeOf: (o, prototype)=>{
		throw error403
	}
})
Object.defineProperty(this, "set_history", {
	configurable: false,
	enumerable: true,
	writable: false,
	value: this.set_history
})
Object.defineProperty(this, "recordSetHistory", {
	configurable: false,
	enumerable: false,
	writable: false,
	value: (k)=>{
		if (k !== "data" && qq()) {
			this.set_history[k] = {
				qq: qq(),
				name: user(0),
				group: qun(),
				gname: $.getGroupInfo() ? $.getGroupInfo().group_name : undefined,
				card: qun() ? user(1) : undefined,
				time: Date.now()
			}
		}
	}
})

this.protected_properties = this.protected_properties && typeof this.protected_properties === "object" ? this.protected_properties : []
this.protected_properties = new Proxy(this.protected_properties, {
	set: (o, k, v)=>{
		if (isMaster())
			return Reflect.set(o, k, v)
		throw error403
	},
	deleteProperty: (o, k)=>{
		if (isMaster())
			return Reflect.deleteProperty(o, k)
		throw error403
	},
	defineProperty: (o, k, d)=>{
		throw error403
	},
	preventExtensions: (o)=>{
		throw error403
	},
	setPrototypeOf: (o, prototype)=>{
		throw error403
	}
})
Object.defineProperty(this, "protected_properties", {
	configurable: false,
	enumerable: true,
	writable: false,
	value: this.protected_properties
})
const isProtected = this.isProtected = (k)=>{
	return this.protected_properties.includes(k)
}
