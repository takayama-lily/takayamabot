this.Function.prototype.view = function() {
    return this.toString().replace(/[&\[\]]/g, (s)=>{
        if (s === "&") return "&amp;"
        if (s === "[") return "&#91;"
        if (s === "]") return "&#93;"
    })
}
const Function = this.Function
const Object = this.Object
const Boolean = this.Boolean
const Number = this.Number
const BigInt = this.BigInt
const Math = this.Math
const Date = this.Date
const String = this.String
const RegExp = this.RegExp
const Array = this.Array
const Map = this.Map
const Set = this.Set
const ArrayBuffer = this.ArrayBuffer
const SharedArrayBuffer = this.SharedArrayBuffer
const JSON = this.JSON
const Error = this.Error
const WeakSet = this.WeakSet
const WeakMap = this.WeakMap
const Symbol = this.Symbol
// const Proxy = this.Proxy
const Reflect = this.Reflect
const DataView = this.DataView
const Atomics = this.Atomics

const isFinite = this.isFinite
const isNaN = this.isNaN
const parseFloat = this.parseFloat
const parseInt = this.parseInt
const decodeURI = this.decodeURI
const decodeURIComponent = this.decodeURIComponent
const encodeURI = this.encodeURI
const encodeURIComponent = this.encodeURIComponent
const escape = this.escape
const unescape = this.unescape
const eval = this.eval

Object.freeze(Function)
Object.freeze(Function.prototype)
Object.freeze(Object)
Object.freeze(Object.prototype)
Object.freeze(Boolean)
Object.freeze(Boolean.prototype)
Object.freeze(Number)
Object.freeze(Number.prototype)
Object.freeze(BigInt)
Object.freeze(BigInt.prototype)
Object.freeze(Math)
Object.freeze(Date)
Object.freeze(Date.prototype)
Object.freeze(String)
Object.freeze(String.prototype)
Object.freeze(RegExp)
Object.freeze(RegExp.prototype)
Object.freeze(Array)
Object.freeze(Array.prototype)
Object.freeze(Map)
Object.freeze(Map.prototype)
Object.freeze(Set)
Object.freeze(Set.prototype)
Object.freeze(ArrayBuffer)
Object.freeze(ArrayBuffer.prototype)
Object.freeze(SharedArrayBuffer)
Object.freeze(SharedArrayBuffer.prototype)
Object.freeze(JSON)
Object.freeze(Error)
Object.freeze(Error.prototype)
Object.freeze(WeakSet)
Object.freeze(WeakSet.prototype)
Object.freeze(WeakMap)
Object.freeze(WeakMap.prototype)
Object.freeze(Symbol)
Object.freeze(Symbol.prototype)
// Object.freeze(Proxy)
Object.freeze(Reflect)
Object.freeze(DataView)
Object.freeze(DataView.prototype)
Object.freeze(Atomics)
delete Promise
delete globalThis
delete console
let data = {}
Object.defineProperty(this, "data", {
	configurable: false,
	enumerable: false,
	writable: true,
	value: {}
})

const env = ()=>this.data
const qq = ()=>this.data.user_id
const qun = ()=>this.data.group_id
const user = (card=1)=>{
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
	let time = Math.floor((now - timestamp)/1000)
    if (time >= 86400)
        time = Math.floor(time / 86400) + "天"
    else if (time >= 3600)
        time = Math.floor(time / 3600) + "小时"
    else if (time >= 60)
        time = Math.floor(time / 60) + "分钟"
    else
        time = Math.floor(time) + "秒"
    return Math.abs(time) + (timestamp <= now ? "前" : "后")
}

const alert = (msg, escape = false)=>{
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
const isBlack = ()=>{
	return typeof this.blacklist === "string" && this.blacklist.includes(qq())
}

const error_blacklist = new Error("你被拉黑了，无法使用沙盒，申诉请联系管理员。")
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
	if (self()) {
		self().js_function_on = true
		return "JS功能已开启"
	}
}
const off = ()=>{
	if (self()) {
		self().js_function_on = false
		return "JS功能已关闭"
	}
}
const isOff = ()=>{
	if (self()) {
		return self().js_function_on === false
	}
	return false
}

this.set_history = this.set_history && typeof this.set_history === "object" ? this.set_history : {}
this.set_history = new Proxy(this.set_history, {
	set: (o, k, v, r)=>{
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

delete Proxy
