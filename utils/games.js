jrrp=(q=qq())=>{return at(q) + " 今天的人品是: " + seed(q)%101}
// jrz=()=>{return at()+' 你今天的字是"'+JSON.parse(`["\\u${(seed()%(0x9fa5-0x4e00)+0x4e00).toString(16)}"]`)[0]+'"\n快去找算命先生算一卦吧！'}
jrz=(q=qq())=>{return at(q) + ' 今天的字是"' + String.fromCodePoint(seed(q) % (0x9fa5 - 0x4e00) + 0x4e00) + '"\n快去找算命先生算一卦吧！'}
function img(url, cache = true) { return "[CQ:image," + (cache ? "" : "cache=0,") + "file=" + url + "]"; }

function jrlp(qq = data.user_id) {
	return img("https://www.thiswaifudoesnotexist.net/example-" + (seed(qq) % 99999) + ".jpg")
}

current_chesses = {}
create_chess = (gid)=>{
	current_chesses[gid].chess = [
		['１','２','３','４','５','６','７','８','９'],
		['車','馬','象','士','將','士','象','馬','車'],
		['　','　','　','　','　','　','　','　','　'],
		['　','炮','　','　','　','　','　','炮','　'],
		['卒','　','卒','　','卒','　','卒','　','卒'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['兵','　','兵','　','兵','　','兵','　','兵'],
		['　','砲','　','　','　','　','　','砲','　'],
		['　','　','　','　','　','　','　','　','　'],
		['俥','傌','相','仕','帥','仕','相','傌','俥'],
		["九","八","七","六","五","四","三","二","一"],
	]
	current_chesses[gid].step = 1
}

象棋 = (input)=>{
	let gid = qun()
	if (!gid) return "此命令只能在群里使用"
	if (!current_chesses[gid])
		current_chesses[gid] = {chess:[],step:0}
	let chess = current_chesses[gid].chess
	let step = current_chesses[gid].step
	let str = ''
	if (input === 1 || !chess.length) {
		str += '※新的棋局开始了！红(帥)方先\n下棋方法是输入: 象棋("炮2平5")\n'
		create_chess(gid)
	} else if (!input && chess.length > 0) {
		let who = step % 2 ? '红(帥)' : '黑(將)'
		str += `※当前轮到${who}方走，重开输入: 象棋(1)\n下棋方法是输入: 象棋("炮2平5")\n`
	} else if (typeof input === 'string' && chess.length) {
		if (input === '仙人指路') input = '兵3进1'
		input = input.trim().replace(/(進)/g, '进').replace(/(後)/g, '后')
		.replace(/(一)/g, '1').replace(/(二)/g, '2').replace(/(三)/g, '3')
		.replace(/(四)/g, '4').replace(/(五)/g, '5').replace(/(六)/g, '6')
		.replace(/(七)/g, '7').replace(/(八)/g, '8').replace(/(九)/g, '9')
		if (step % 2) {
			input = input.replace(/(車|车)/g, '俥').replace(/(馬|马)/g, '傌').replace(/(炮)/g, '砲')
			.replace(/(將|将|帅)/g, '帥').replace(/(士)/g, '仕').replace(/(象)/g, '相').replace(/(卒)/g, '兵')
		} else {
			input = input.replace(/(俥|车)/g, '車').replace(/(傌|马)/g, '馬').replace(/(砲)/g, '炮')
			.replace(/(将|帥|帅)/g, '將').replace(/(仕)/g, '士').replace(/(相)/g, '象').replace(/(兵)/g, '卒')
		}
		return chessss(input)
	}
	for (let v of current_chesses[gid].chess)
		str += v.join('') + '\n'
	return str
}

chessss = (input = '')=>{
	let gid = qun()
	let chess = current_chesses[gid].chess
	let step = current_chesses[gid].step
	let str=''
	let red=['俥','傌','相','仕','帥','仕','相','傌','俥','砲','兵']
	let black=['車','馬','象','士','將','士','象','馬','車','炮','卒']
	let a=input[0]
	let b=input[1]
	let c=input[2]
	let d=parseInt(input[3])
	let m=-1,n=-1,koma,dm,dn
	let e=new Error(' 你不能这么走')
	try{
		if(['前','后'].includes(a)){
			for(let i=1;i<=10;i++) {
				if(chess[i].includes(b)) {
					m=chess[i].indexOf(b),n=i
					if(a==='后'&&step%2===0)
						break
					if(a==='前'&&step%2===1)
						break
				}
			}
			koma=b
		} else{
			for(let i=1;1<=10;i++) {
				let j=step%2?9-b:b-1
				if(chess[i][j]===a){
					m=j,n=i
					break
				}
			}
			koma=a
		}
		if(m<0||n<0)throw e
		if(['將','帥','兵','卒'].includes(koma)&&d!== 1&&c!=='平')throw e//这些最多走一步
		if(c==='平'){
			if(['傌','馬','象','士','相','仕'].includes(koma))throw e//这些不能平
			if(['兵','卒'].includes(koma)) {//兵过河前不能平
				if(step%2&&n>=6)throw e
				if(!(step%2)&&n<6)throw e
			}
			dm=step%2?9-d:d-1,dn=n
			if(['將','帥','兵','卒'].includes(koma)&&Math.abs(dm-m)!==1)throw e
		} else if(c==='进'){
			if (['象','相'].includes(koma)) {
				dm = step%2 ? 9-d : d-1
				dn = step%2 ? n-2 : n+2
				let minus = Math.abs(dm-m)
				if (minus !== 2) throw e
			}
			if (['士','仕'].includes(koma)) {
				dm = step%2 ? 9-d : d-1
				dn = step%2 ? n-1 : n+1
				let minus = Math.abs(dm-m)
				if (minus !== 1) throw e
			}
			if (['傌','馬'].includes(koma)) {
				dm = step%2 ? 9-d : d-1
				let minus = Math.abs(dm-m)
				if (!minus || minus > 2) throw e
				if (minus === 1) {
					dn = step%2 ? n-2 : n+2
				} else {
					dn = step%2 ? n-1 : n+1
				}
			}
			if (['車','俥','炮','砲','將','帥','兵','卒'].includes(koma)) {
				dm = m
				dn = step%2 ? n-d : n+d
			}
		} else if (c === '退') {
			if (['兵','卒'].includes(koma)) throw e//兵不能退
			if (['象','相'].includes(koma)) {
				dm = (step%2) ? 9-d : d-1
				dn = !(step%2) ? n-2 : n+2
				let minus = Math.abs(dm-m)
				if (minus !== 2) throw e
			}
			if (['士','仕'].includes(koma)) {
				dm = (step%2) ? 9-d : d-1
				dn = !(step%2) ? n-1 : n+1
				let minus = Math.abs(dm-m)
				if (minus !== 1) throw e
			}
			if (['傌','馬'].includes(koma)) {
				dm = (step%2) ? 9-d : d-1
				let minus = Math.abs(dm-m)
				if (!minus || minus > 2) throw e
				if (minus === 1) {
					dn = !(step%2) ? n-2 : n+2
				} else {
					dn = !(step%2) ? n-1 : n+1
				}
			}
			if (['車','俥','炮','砲','將','帥','兵','卒'].includes(koma)) {
				dm = m
				dn = !(step%2) ? n-d : n+d
			}
		}else throw e
		if(dm<0||dm>=9)throw e//不能走到棋盘外
		if(dn<1||dn>=11)throw e
		if(chess[dn][dm]!=='　') {//不能吃自己子
			if(step%2&&red.includes(chess[dn][dm]))throw e
			if(!(step%2)&&black.includes(chess[dn][dm]))throw e
		}
		if(['將','帥','士','仕'].includes(koma)){//将士不出九宫
			if (dm < 3 || dm > 5 || (dn > 4 && dn < 8))throw e
		}
		if(['象','相'].includes(koma)) {//象不能过河
			if(step%2&&dn<6)throw e
			if(!(step%2)&&dn>=6)throw e
			let midm=(dm+m)/2,midn=(dn+n)/2//象眼
			if(chess[midn][midm]!=='　')throw e
		}
		if(['傌','馬'].includes(koma)) {//马脚
			let midm,midn
			if(Math.abs(dm-m)===1){
				midn=(dn+n)/2
				midm=m
			}else{
				midm=(dm+m)/2
				midn=n
			}
			if(chess[midn][midm]!=='　')throw e
		}
		if(['車','俥'].includes(koma)){
			if(dn===n) {//平
				let i=Math.min(m,dm)+1
				while (i<Math.max(m,dm)){
					if(chess[dn][i]!=='　')throw e
					i++
				}
			}else{//进退
				let i=Math.min(n,dn)+1
				while(i<Math.max(n,dn)){
					if(chess[i][dm]!=='　')throw e
					i++
				}
			}
		}
		if(['炮','砲'].includes(koma)){
			if(dn === n){//平
				let j=0,i=Math.min(m,dm)+1
				while (i<Math.max(m,dm)){
					if(chess[dn][i]!=='　') j++
					i++
				}
				if(j>=2||(j&&chess[dn][dm]==='　')||(!j&&chess[dn][dm]!=='　'))throw e
			}else{//进退
				let j=0,i=Math.min(n,dn)+1
				while(i<Math.max(n,dn)){
					if(chess[i][dm]!=='　') j++
					i++
				}
				if(j>=2||(j&&chess[dn][dm]==='　')||(!j&&chess[dn][dm]!=='　'))throw e
			}
		}
		if(chess[dn][dm]==='帥')
			return '游戏结束，黑(將)方胜'
		if(chess[dn][dm]==='將')
			return '游戏结束，红(帥)方胜'
		chess[n][m]='　'
		chess[dn][dm]=koma
	}catch(err){
		return at()+e.message
	}
	let current=step%2?'红(帥)方':'黑(將)方'
	step++,current_chesses[gid].step++
	let next=step%2?'红(帥)方':'黑(將)方'
	str+=current+input+', '+next+'走。查看棋局输入: 象棋()'
	return str
}

提问=(question)=>{
	if (typeof question !== 'string')
		return
	let sd = 0
	for (let v of question)
		sd += v.charCodeAt(0)
	if (question.includes('我')) {
		sd = (0xffffffffffffffff%(sd*seed())).toString()
	} else {
		let t = Math.floor(Date.now() / 86400000)
		sd = (0xffffffffffffffff%(sd*t)).toString()
	}
	let res = sd[sd.length-1] //>= 5 ? '' : '不'
	if (res == 0 || res == 9)
		return '不确定'
	if (res < 5)
		return '是'
	else
		return '否'
	// if (question.includes('可以'))
	//     return res + '可以'
	// if (question.includes('可能'))
	//     return res + '可能'
	// if (question.includes('有'))
	//     return res ? '没有' : '有'
	// if (question.includes('是'))
	//     return res + '是'
	// if (question.includes('会'))
	//     return res + '会'
	// if (question.includes('能'))
	//     return res + '能'
	// return res ? '否' : '是的'
}

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
			returnStr += "" + str2unicode[hai.replace("0", "5")] + "";
		} else {
			returnStr += (typeof str2unicode[hai] == 'undefined') ? '' : str2unicode[hai];
		}
	}
	return returnStr;
}

起手=(seed = Math.random(), i = 14, aka = true) => {
	//seed=种子,i=要生成的张数(默认14张)
	seed = parseFloat(seed);
	seed = (seed == NaN) ? Math.random() : seed;
	i = (i > 0) ? parseInt(i) : 14;
	var mountain = Array(136).fill(0);
	while (i--) {
		seed = ('0.' + Math.sin(seed).toString().substr(6));
		let index = Math.floor(seed * 136);
		if (mountain[index] === 0) {
			mountain[index] = 1;
		} else {
			i++;
		}
	}
  
	var i, s = "";
	for (i = 0; i < 136; ++i)
		if (mountain[i]) {
			var hai136 = i;
			var a = (hai136 >> 2);
			s += (!aka)
				? ((a % 9) + 1) + "mpsz".substr(a / 9, 1)
				: (a < 27 && (hai136 % 36) == 16
					? "0"
					: ((a % 9) + 1)) + "mpsz".substr(a / 9, 1);
		}
	let res = []
	for (let i in s) {
		if (isNaN(s[i]) && s[i] === s[parseInt(i)+2])
			continue
		else
			res.push(s[i])
	}
	return res.join("");
}

起手2=(sd)=>{
	if (!sd)
		sd = Math.floor(Math.random()*10**16)
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


(function(a){function b(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c}function c(a,b){return a<<b|a>>>32-b}function d(a,d,e,f,g,h){return b(c(b(b(d,a),b(f,h)),g),e)}function e(a,b,c,e,f,g,h){return d(b&c|~b&e,a,b,f,g,h)}function f(a,b,c,e,f,g,h){return d(b&e|c&~e,a,b,f,g,h)}function g(a,b,c,e,f,g,h){return d(b^c^e,a,b,f,g,h)}function h(a,b,c,e,f,g,h){return d(c^(b|~e),a,b,f,g,h)}function i(a,c){a[c>>5]|=128<<c%32,a[(c+64>>>9<<4)+14]=c;var d,i,j,k,l,m=1732584193,n=-271733879,o=-1732584194,p=271733878;for(d=0;d<a.length;d+=16)i=m,j=n,k=o,l=p,m=e(m,n,o,p,a[d],7,-680876936),p=e(p,m,n,o,a[d+1],12,-389564586),o=e(o,p,m,n,a[d+2],17,606105819),n=e(n,o,p,m,a[d+3],22,-1044525330),m=e(m,n,o,p,a[d+4],7,-176418897),p=e(p,m,n,o,a[d+5],12,1200080426),o=e(o,p,m,n,a[d+6],17,-1473231341),n=e(n,o,p,m,a[d+7],22,-45705983),m=e(m,n,o,p,a[d+8],7,1770035416),p=e(p,m,n,o,a[d+9],12,-1958414417),o=e(o,p,m,n,a[d+10],17,-42063),n=e(n,o,p,m,a[d+11],22,-1990404162),m=e(m,n,o,p,a[d+12],7,1804603682),p=e(p,m,n,o,a[d+13],12,-40341101),o=e(o,p,m,n,a[d+14],17,-1502002290),n=e(n,o,p,m,a[d+15],22,1236535329),m=f(m,n,o,p,a[d+1],5,-165796510),p=f(p,m,n,o,a[d+6],9,-1069501632),o=f(o,p,m,n,a[d+11],14,643717713),n=f(n,o,p,m,a[d],20,-373897302),m=f(m,n,o,p,a[d+5],5,-701558691),p=f(p,m,n,o,a[d+10],9,38016083),o=f(o,p,m,n,a[d+15],14,-660478335),n=f(n,o,p,m,a[d+4],20,-405537848),m=f(m,n,o,p,a[d+9],5,568446438),p=f(p,m,n,o,a[d+14],9,-1019803690),o=f(o,p,m,n,a[d+3],14,-187363961),n=f(n,o,p,m,a[d+8],20,1163531501),m=f(m,n,o,p,a[d+13],5,-1444681467),p=f(p,m,n,o,a[d+2],9,-51403784),o=f(o,p,m,n,a[d+7],14,1735328473),n=f(n,o,p,m,a[d+12],20,-1926607734),m=g(m,n,o,p,a[d+5],4,-378558),p=g(p,m,n,o,a[d+8],11,-2022574463),o=g(o,p,m,n,a[d+11],16,1839030562),n=g(n,o,p,m,a[d+14],23,-35309556),m=g(m,n,o,p,a[d+1],4,-1530992060),p=g(p,m,n,o,a[d+4],11,1272893353),o=g(o,p,m,n,a[d+7],16,-155497632),n=g(n,o,p,m,a[d+10],23,-1094730640),m=g(m,n,o,p,a[d+13],4,681279174),p=g(p,m,n,o,a[d],11,-358537222),o=g(o,p,m,n,a[d+3],16,-722521979),n=g(n,o,p,m,a[d+6],23,76029189),m=g(m,n,o,p,a[d+9],4,-640364487),p=g(p,m,n,o,a[d+12],11,-421815835),o=g(o,p,m,n,a[d+15],16,530742520),n=g(n,o,p,m,a[d+2],23,-995338651),m=h(m,n,o,p,a[d],6,-198630844),p=h(p,m,n,o,a[d+7],10,1126891415),o=h(o,p,m,n,a[d+14],15,-1416354905),n=h(n,o,p,m,a[d+5],21,-57434055),m=h(m,n,o,p,a[d+12],6,1700485571),p=h(p,m,n,o,a[d+3],10,-1894986606),o=h(o,p,m,n,a[d+10],15,-1051523),n=h(n,o,p,m,a[d+1],21,-2054922799),m=h(m,n,o,p,a[d+8],6,1873313359),p=h(p,m,n,o,a[d+15],10,-30611744),o=h(o,p,m,n,a[d+6],15,-1560198380),n=h(n,o,p,m,a[d+13],21,1309151649),m=h(m,n,o,p,a[d+4],6,-145523070),p=h(p,m,n,o,a[d+11],10,-1120210379),o=h(o,p,m,n,a[d+2],15,718787259),n=h(n,o,p,m,a[d+9],21,-343485551),m=b(m,i),n=b(n,j),o=b(o,k),p=b(p,l);return[m,n,o,p]}function j(a){var b,c="";for(b=0;b<32*a.length;b+=8)c+=String.fromCharCode(a[b>>5]>>>b%32&255);return c}function k(a){var b,c=[];for(c[(a.length>>2)-1]=void 0,b=0;b<c.length;b+=1)c[b]=0;for(b=0;b<8*a.length;b+=8)c[b>>5]|=(255&a.charCodeAt(b/8))<<b%32;return c}function l(a){return j(i(k(a),8*a.length))}function m(a,b){var c,d,e=k(a),f=[],g=[];for(f[15]=g[15]=void 0,e.length>16&&(e=i(e,8*a.length)),c=0;16>c;c+=1)f[c]=909522486^e[c],g[c]=1549556828^e[c];return d=i(f.concat(k(b)),512+8*b.length),j(i(g.concat(d),640))}function n(a){var b,c,d="0123456789abcdef",e="";for(c=0;c<a.length;c+=1)b=a.charCodeAt(c),e+=d.charAt(b>>>4&15)+d.charAt(15&b);return e}function o(a){return unescape(encodeURIComponent(a))}function p(a){return l(o(a))}function q(a){return n(p(a))}function r(a,b){return m(o(a),o(b))}function s(a,b){return n(r(a,b))}function t(a,b,c){return b?c?r(b,a):s(b,a):c?p(a):q(a)}"function"==typeof define&&define.amd?define(function(){return t}):a.md5=t})(this)
(function(t,y){var v="0123456789abcdef".split(""),w={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,a:10,b:11,c:12,d:13,e:14,f:15,A:10,B:11,C:12,D:13,E:14,F:15},x=function(e){var a;a:{for(a=e.length;a--;)if(255<e.charCodeAt(a)){a=!0;break a}a=!1}if(a){var c=encodeURIComponent(e);e=[];var d=0;a=0;for(var f=c.length;d<f;++d){var r=c.charCodeAt(d);e[a>>2]=37==r?e[a>>2]|(w[c.charAt(++d)]<<4|w[c.charAt(++d)])<<(3-a%4<<3):e[a>>2]|r<<(3-a%4<<3);++a}c=(a+8>>6)+1<<4;d=a>>2;e[d]|=128<<(3-a%4<<3);for(d+=1;d<c;++d)e[d]=0;e[c-1]=a<<3}else{a=e.length;d=(a+8>>6)+1<<4;c=[];for(f=0;f<d;++f)c[f]=0;for(f=0;f<a;++f)c[f>>2]|=e.charCodeAt(f)<<(3-f%4<<3);c[f>>2]|=128<<(3-f%4<<3);c[d-1]=a<<3;e=c}a=1732584193;for(var d=4023233417,c=2562383102,f=271733878,r=3285377520,u=0,t=e.length;u<t;u+=16){for(var n=[],b=0;16>b;++b)n[b]=e[u+b];for(b=16;80>b;++b)n[b]=p(n[b-3]^n[b-8]^n[b-14]^n[b-16],1);for(var m=a,h=d,k=c,l=f,q=r,g,b=0;20>b;++b)g=h&k|~h&l,g=p(m,5)+g+q+1518500249+n[b],q=l,l=k,k=p(h,30),h=m,m=g;for(;40>b;++b)g=h^k^l,g=p(m,5)+g+q+1859775393+n[b],q=l,l=k,k=p(h,30),h=m,m=g;for(;60>b;++b)g=h&k|h&l|k&l,g=p(m,5)+g+q+2400959708+n[b],q=l,l=k,k=p(h,30),h=m,m=g;for(;80>b;++b)g=h^k^l,g=p(m,5)+g+q+3395469782+n[b],q=l,l=k,k=p(h,30),h=m,m=g;a+=m;d+=h;c+=k;f+=l;r+=q}return s(a)+s(d)+s(c)+s(f)+s(r)},p=function(e,a){return e<<a|e>>>32-a},s=function(e){for(var a="",c=0;4>c;c++)var d=3-c<<3,a=a+(v[e>>d+4&15]+v[e>>d&15]);return a};"undefined"!=typeof module?module.exports=x:t&&(t.sha1=x)})(this);
function sha256(s){var chrsz=8;var hexcase=0;function safe_add(x,y){var lsw=(x&65535)+(y&65535);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&65535)}function S(X,n){return(X>>>n)|(X<<(32-n))}function R(X,n){return(X>>>n)}function Ch(x,y,z){return((x&y)^((~x)&z))}function Maj(x,y,z){return((x&y)^(x&z)^(y&z))}function Sigma0256(x){return(S(x,2)^S(x,13)^S(x,22))}function Sigma1256(x){return(S(x,6)^S(x,11)^S(x,25))}function Gamma0256(x){return(S(x,7)^S(x,18)^R(x,3))}function Gamma1256(x){return(S(x,17)^S(x,19)^R(x,10))}function core_sha256(m,l){var K=new Array(1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298);var HASH=new Array(1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225);var W=new Array(64);var a,b,c,d,e,f,g,h,i,j;var T1,T2;m[l>>5]|=128<<(24-l%32);m[((l+64>>9)<<4)+15]=l;for(var i=0;i<m.length;i+=16){a=HASH[0];b=HASH[1];c=HASH[2];d=HASH[3];e=HASH[4];f=HASH[5];g=HASH[6];h=HASH[7];for(var j=0;j<64;j++){if(j<16){W[j]=m[j+i]}else{W[j]=safe_add(safe_add(safe_add(Gamma1256(W[j-2]),W[j-7]),Gamma0256(W[j-15])),W[j-16])}T1=safe_add(safe_add(safe_add(safe_add(h,Sigma1256(e)),Ch(e,f,g)),K[j]),W[j]);T2=safe_add(Sigma0256(a),Maj(a,b,c));h=g;g=f;f=e;e=safe_add(d,T1);d=c;c=b;b=a;a=safe_add(T1,T2)}HASH[0]=safe_add(a,HASH[0]);HASH[1]=safe_add(b,HASH[1]);HASH[2]=safe_add(c,HASH[2]);HASH[3]=safe_add(d,HASH[3]);HASH[4]=safe_add(e,HASH[4]);HASH[5]=safe_add(f,HASH[5]);HASH[6]=safe_add(g,HASH[6]);HASH[7]=safe_add(h,HASH[7])}return HASH}function str2binb(str){var bin=Array();var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz){bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(24-i%32)}return bin}function Utf8Encode(string){string=string.replace(/\r\n/g,"\n");var utftext="";for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);if(c<128){utftext+=String.fromCharCode(c)}else{if((c>127)&&(c<2048)){utftext+=String.fromCharCode((c>>6)|192);utftext+=String.fromCharCode((c&63)|128)}else{utftext+=String.fromCharCode((c>>12)|224);utftext+=String.fromCharCode(((c>>6)&63)|128);utftext+=String.fromCharCode((c&63)|128)}}}return utftext}function binb2hex(binarray){var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8+4))&15)+hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8))&15)}return str}s=Utf8Encode(s);return binb2hex(core_sha256(str2binb(s),s.length*chrsz))}
