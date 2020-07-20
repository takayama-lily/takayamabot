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

//环境变量
Object.defineProperty(this, "data", {
    configurable: false,
    enumerable: false,
    writable: true,
    value: {}
})

const error403 = new Error("403 forbidden")

//群数据库
this.database = this.database && typeof this.database === "object" ? this.database : {}
this.database = new Proxy(this.database, {
    get: (o, k)=>{
        if (this.isMaster())
            return o[k]
        if (parseInt(k) !== this.data.group_id)
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
        if (this.isMaster())
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
Object.defineProperty(this, "database", {
    configurable: false,
    enumerable: true,
    writable: false,
    value: this.database
})

// set历史记录
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
        if (this.isMaster())
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
        if (k !== "data" && this.data.user_id) {
            try {
                this.set_history[k] = {
                    qq: this.data.user_id,
                    name: this.data.sender.nickname,
                    group: this.data.group_id,
                    gname: this.data.group_name !== undefined ? this.data.group_name : undefined,
                    card: this.data.group_id ? this.data.sender.card : undefined,
                    time: Date.now()
                }
            } catch (e) {}
        }
    }
})

//主人qq 必须是包含qq号的字符串
if (typeof this.master !== "string")
    this.master = ""
Object.defineProperty(this, "isMaster", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: ()=>{
        return !this.data.user_id || (typeof this.master === "string" && this.master.includes(this.data.user_id))
    }
})

// 钩子函数
if (typeof this.beforeExec !== "function")
    this.beforeExec = ()=>{}
if (typeof this.afterExec !== "function")
    this.afterExec = ()=>{}
if (typeof this.onEvents !== "function")
    this.onEvents = ()=>{}

// 受保护属性只有主人可以设置和删除
// 默认的受保护属性为 master,beforeExec,afterExec,onEvents 四个
// 受保护属性不能是引用类型(对象&数组)，只能是基础类型或函数，否则无法被保护
this.protected_properties = this.protected_properties && typeof this.protected_properties === "object" ? this.protected_properties : ["master","beforeExec","afterExec","onEvents"]
this.protected_properties = new Proxy(this.protected_properties, {
    set: (o, k, v)=>{
        if (this.isMaster())
            return Reflect.set(o, k, v)
        throw error403
    },
    deleteProperty: (o, k)=>{
        if (this.isMaster())
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
Object.defineProperty(this, "isProtected", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: ()=>{
        return this.protected_properties.includes(k)
    }
})
