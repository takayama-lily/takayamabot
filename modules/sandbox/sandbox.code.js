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
const Proxy = this.Proxy
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
Object.freeze(Proxy)
Object.freeze(Reflect)
Object.freeze(DataView)
Object.freeze(DataView.prototype)
Object.freeze(Atomics)
delete Promise
delete globalThis
delete console
const constructor = undefined
let data

const 帮助=`-----指令列表-----
● -雀魂 ※查询雀魂战绩(-qh)
● -牌理 ※牌理計算(-pl)
● -新番 ※新番时间表(-bgm)
● -动漫 ※查询动漫(-anime)
● -疫情 国名过滤 ※疫情(-yq)
● -vip QQ号或@对方
● -龙王 ● -发言
-------------------------
● 小游戏 ※查看小游戏列表
● 高级 ※查看高级指令
● dhs ※雀魂比赛管理`
const help=帮助

const 小游戏=`-----js小游戏列表-----
● jrrp() / jrqs() / jrz()
● 象棋() / 残局()
● 提问("明天会下雨吗")
● cjly("这是一段精灵语")
● 猜拳() / 写信()
经常会添加一些奇怪的东西`

const 高级=`-----这是一个js控制台-----
● 普通模式，输入例: 你好="你也好"
● 调试模式，输入例: \\delete 你好
　※最前添加反斜杠，可反馈报错信息
● 禁止定义敏感内容
● 支持CQ码，使用JavaScript语言
● data ※环境变量
(暂时不能发图片了，恢复时间未知)`
const advance=高级

const doc=`-----js控制台doc-----
● 面向希望开发自定义功能的高级玩家
● data ※环境变量(发言人的一切)
● 常用函数
 • qq(),user() ※发言人的qq号和昵称
 • qun() ※当前群号
 • at() ※艾特一个人,默认自己
 • seed() ※一个变数,每人每天固定
 • qhead() ※qq头像,默认自己
 • ghead() ※群头像,默认当前群
　※头像有缓存，多传个参数0可清
● 禁止的关键字: this, async, const
● 圆括号、双引号、逗号等自动转半角
● 支持ECMAScript6语法(非strict)`

const qq=()=>data.user_id
const qun=()=>data.group_id
const user=(card=1)=>{
	if(!card)
		return data.sender.nickname
	if(data.sender.card!=undefined&&data.sender.card.length)
		return data.sender.card
	else
		return data.sender.nickname
}
const parseQQ=(str)=>{
	if (!isNaN(str))
		return parseInt(str)
	return parseInt(str.replace(/[^(0-9)]/g,""))
}
const at=(q=qq())=>`[CQ:at,qq=${parseQQ(q)}]`
const seed=(q=qq())=>Math.abs(0xffffffffffffffff%parseQQ(q)^0xffffffffffffffff%((Date.now()+28800000)/864/10**5|0))
const img=(url,cache=1)=>{
	cache=cache?1:0
	return `[CQ:image,cache=${cache},file=${encodeURI(url)}]`
}
const qqhead=(q=qq(),cache=true)=>{
	if (q===false||q ===0)
		cache=false,q=qq()
    return img("http://q1.qlogo.cn/g?b=qq&s=640&nk="+parseQQ(q),cache)
}
const grouphead=(group=qun(),cache=true)=>{
	if (group===false||group===0)
		cache=false,group=qun()
	return img("http://p.qlogo.cn/gh/"+group+"/"+group+"/640",cache)
}

const self = ()=>this.database[qun()]
const group_proxy_handler = {
	get: (o, k)=>{
		if (!qq())
			return o[k]
		if (parseInt(k) !== qun())
			throw new Error("403 forbidden")
		if (!o.hasOwnProperty(k))
			o[k] = {}
		return o[k]
	},
	set: (o, k, v)=>{
		throw new Error("403 forbidden")
	},
	has: (o, k)=>{
		throw new Error("403 forbidden")
	},
	deleteProperty: (o, k)=>{
		throw new Error("403 forbidden")
	},
	defineProperty: (o, k, d)=>{
		throw new Error("403 forbidden")
	},
	ownKeys: (o)=>{
		if (!qq())
			return Reflect.ownKeys(o)
		throw new Error("403 forbidden")
	},
	preventExtensions: (o)=>{
		throw new Error("403 forbidden")
	},
	setPrototypeOf: (o, prototype)=>{
		throw new Error("403 forbidden")
	}
}
Object.freeze(group_proxy_handler);

(()=>{
	let tmp = {}
	if (this.database)
		tmp = this.database
	delete this.database
	tmp = new Proxy(tmp, group_proxy_handler)
	Object.defineProperty(this, "database", {
		configurable: false,
		enumerable: true,
		writable: false,
		value: tmp
	})
})()
