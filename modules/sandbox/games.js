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
		['九','八','七','六','五','四','三','二','一'],
	]
	current_chesses[gid].step = 1
}

chess_phases = [
	[
		['１','２','３','４','５','６','７','８','９'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','士','將','　','　','　'],
		['　','　','　','　','俥','士','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','卒','卒','　','　','　','　'],
		['　','　','　','　','　','帥','　','　','　'],
		['九','八','七','六','五','四','三','二','一'],
	],
	[
		['１','２','３','４','５','６','７','８','９'],
		['　','　','象','將','　','　','　','　','　'],
		['俥','　','　','　','　','　','　','　','　'],
		['象','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','炮'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','　','　','　','　','　'],
		['　','　','　','　','帥','　','　','　','　'],
		['九','八','七','六','五','四','三','二','一'],
	],
]
	

残局 = (index)=>{
	if (index === undefined) {
		return `当前记录了${chess_phases.length}个残局, 编号0~${chess_phases.length-1}, 开始残局输入: 残局(编号)`
	}
	let gid = qun()
	if (!gid) return "此命令只能在群里使用"
	if (!chess_phases[index])
		return "该残局不存在"
	current_chesses[gid].chess = JSON.parse(JSON.stringify(chess_phases[index]))
	current_chesses[gid].step = 1
	return 象棋()
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
		str += '-' + v.join('') + '\n'
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
			if (dm < 3 || dm > 5 || (dn > 3 && dn < 8))throw e
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

eid2id=(t)=>{var e=67108863&(t-=1e7);return e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,e=(131071&e)<<9|e>>17,(-67108864&t)+e^6139246}
id2eid=(t)=>{var e=67108863&(t^=6139246);return e=(511&e)<<17|e>>9,e=(511&e)<<17|e>>9,e=(511&e)<<17|e>>9,e=(511&e)<<17|e>>9,(e=(511&e)<<17|e>>9)+(-67108864&t)+1e7}
function sha256(s){var chrsz=8;var hexcase=0;function safe_add(x,y){var lsw=(x&65535)+(y&65535);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&65535)}function S(X,n){return(X>>>n)|(X<<(32-n))}function R(X,n){return(X>>>n)}function Ch(x,y,z){return((x&y)^((~x)&z))}function Maj(x,y,z){return((x&y)^(x&z)^(y&z))}function Sigma0256(x){return(S(x,2)^S(x,13)^S(x,22))}function Sigma1256(x){return(S(x,6)^S(x,11)^S(x,25))}function Gamma0256(x){return(S(x,7)^S(x,18)^R(x,3))}function Gamma1256(x){return(S(x,17)^S(x,19)^R(x,10))}function core_sha256(m,l){var K=new Array(1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298);var HASH=new Array(1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225);var W=new Array(64);var a,b,c,d,e,f,g,h,i,j;var T1,T2;m[l>>5]|=128<<(24-l%32);m[((l+64>>9)<<4)+15]=l;for(var i=0;i<m.length;i+=16){a=HASH[0];b=HASH[1];c=HASH[2];d=HASH[3];e=HASH[4];f=HASH[5];g=HASH[6];h=HASH[7];for(var j=0;j<64;j++){if(j<16){W[j]=m[j+i]}else{W[j]=safe_add(safe_add(safe_add(Gamma1256(W[j-2]),W[j-7]),Gamma0256(W[j-15])),W[j-16])}T1=safe_add(safe_add(safe_add(safe_add(h,Sigma1256(e)),Ch(e,f,g)),K[j]),W[j]);T2=safe_add(Sigma0256(a),Maj(a,b,c));h=g;g=f;f=e;e=safe_add(d,T1);d=c;c=b;b=a;a=safe_add(T1,T2)}HASH[0]=safe_add(a,HASH[0]);HASH[1]=safe_add(b,HASH[1]);HASH[2]=safe_add(c,HASH[2]);HASH[3]=safe_add(d,HASH[3]);HASH[4]=safe_add(e,HASH[4]);HASH[5]=safe_add(f,HASH[5]);HASH[6]=safe_add(g,HASH[6]);HASH[7]=safe_add(h,HASH[7])}return HASH}function str2binb(str){var bin=Array();var mask=(1<<chrsz)-1;for(var i=0;i<str.length*chrsz;i+=chrsz){bin[i>>5]|=(str.charCodeAt(i/chrsz)&mask)<<(24-i%32)}return bin}function Utf8Encode(string){string=string.replace(/\r\n/g,"\n");var utftext="";for(var n=0;n<string.length;n++){var c=string.charCodeAt(n);if(c<128){utftext+=String.fromCharCode(c)}else{if((c>127)&&(c<2048)){utftext+=String.fromCharCode((c>>6)|192);utftext+=String.fromCharCode((c&63)|128)}else{utftext+=String.fromCharCode((c>>12)|224);utftext+=String.fromCharCode(((c>>6)&63)|128);utftext+=String.fromCharCode((c&63)|128)}}}return utftext}function binb2hex(binarray){var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8+4))&15)+hex_tab.charAt((binarray[i>>2]>>((3-i%4)*8))&15)}return str}s=Utf8Encode(s);return binb2hex(core_sha256(str2binb(s),s.length*chrsz))}

函数调用次数={}
函数调用统计=function() {
  let name=arguments.callee.caller.name
  if (!函数调用次数[name])
    函数调用次数[name]={"users":{},"groups":{}}
  if (qun()) {
    if (!函数调用次数[name].groups[qun()])
      函数调用次数[name].groups[qun()]={name:"",cnt:0}
    ++函数调用次数[name].groups[qun()].cnt
  }
  if (!函数调用次数[name].users[qq()]) {
    函数调用次数[name].users[qq()]={names:[],cnt:0}
  }
  ++函数调用次数[name].users[qq()].cnt
  if (!函数调用次数[name].users[qq()].names.includes(username()))
    函数调用次数[name].users[qq()].names.push(username())
}

浇水成长值={}
浇水=(q)=>{
  q=parseQQ(q)
  if (q===qq())
    return at()+" 不能给自己浇水"
  if (isNaN(q) || q <10000 || q > 4000000000)
    return at()+" 目标不正确"
  if (!浇水成长值[q])
    浇水成长值[q]={value:0,fans:{}}
  if (!浇水成长值[q].fans[qq()])
    浇水成长值[q].fans[qq()]={value:0,last:0}
  if (Date.now()-浇水成长值[q].fans[qq()].last<12*60*60*1000)
    return at()+" 12小时内不能重复浇水。"
  let a = random(5,10)*random(5,10)
  let b = random(2,5)*random(2,5)
  // let double_text=""
  // let hour = (new Date(Date.now()+new Date().getTimezoneOffset()*60000).getHours()+8)%24
  // if (hour>=6&&hour<9) {
  //   a*=2,b*=2,double_text="(早起收益加倍)"
  // }
  浇水成长值[q].value+=a
  浇水成长值[q].fans[qq()].value+=b
  浇水成长值[q].fans[qq()].last=Date.now()
  return at()+`本次浇水获得${at(q)}的好感度${b}点。当前好感度${浇水成长值[q].fans[qq()].value}(${浇水称号(浇水成长值[q].fans[qq()].value,2)})。
目标获得成长值${a}点。当前成长值${浇水成长值[q].value}(${浇水称号(浇水成长值[q].value)})。`
}
好感度=(q)=>{
  q=parseQQ(q)
  if (!浇水成长值[q])
    return "什么都没有"
  let res = at(q)+` 当前的成长值：${浇水成长值[q].value}(${浇水称号(浇水成长值[q].value)})。好感度：`
  for (let k in 浇水成长值[q].fans)
    res+="\n"+at(k)+`(${k}) / ${浇水成长值[q].fans[k].value}(${浇水称号(浇水成长值[q].fans[k].value, 2)})`
  return res
}
浇水称号=(pt,type=1)=>{
	if(type===1){
		if (pt<1024)
			return "小幼苗"
		if (pt<2048)
			return "茁壮成长"
		if (pt<4096)
			return "亭亭玉立"
		if (pt<8192)
			return "含苞待放"
		if (pt<16384)
			return "花枝招展"
		if (pt<32768)
			return "绝代佳人"
		if (pt<65536)
			return "万世流芳"
		else
			return "神"
	}else{
		if (pt<64)
			return "工具人"
		if (pt<128)
			return "云备胎"
		if (pt<256)
			return "心有灵犀"
		if (pt<512)
			return "小鹿乱撞"
		if (pt<1024)
			return "ツンデレ"
		if (pt<2048)
			return "亲密无间"
		else
			return "生死不离"
	}
}

拼点禁言=(q, max_time = 100)=>{
  if (q===undefined)
  	return `和群内成员拼点, 拼输的受到禁言惩罚。
※机器人的权限>惩罚对象的时候, 才会真正执行惩罚。
※禁言秒数=双方的点差(默认上限为100)。
※被发起的一方输了, 只会受到一半时间的惩罚。
※使用方法：拼点禁言(@对方)
※设置roll点上限为1000：拼点禁言(@对方,1000)`
  if (max_time > 86400*30)
    return "上限不能超过30天(2592000)"
  if (data.anonymous)
    return "匿名用户无法参加"
  q=parseQQ(q)
  if (q===qq())
  	return '不能和自己拼点'
  if (!$.getGroupInfo()) {
  	$.updateGroupCache()
  	return '首次进群，已更新群数据缓存，请重试一次。'
  }
  let members = $.getGroupInfo().members
  if (!members[q])
    return '拼点对象不在群内'
  let my_roll = random(0,max_time)
  let his_roll = random(0,max_time)
  let res = at() + `掷出了${my_roll}, ${at(q)}掷出了${his_roll}\n`
  let time = Math.abs(my_roll-his_roll)
  if (my_roll > his_roll) {
  	time = Math.ceil(time/2)
    res += at(q) + `被禁言${time}秒`
    $.setGroupBan(q,time)
    $.sendGroupMsg(机器人情报站, `${q}(${members[q].nickname})在群${qun()}(${data.group_name})拼点失败，被禁言${time}秒`)
  } else if (my_roll < his_roll) {
    res += at() + `被禁言${time}秒`
    $.setGroupBan(qq(),time)
    $.sendGroupMsg(机器人情报站, `${qq()}(${user(0)})在群${qun()}(${data.group_name})拼点失败，被禁言${time}秒`)
  } else {
    res += `可惜是平手`
  }
  return res
}

分组=(n)=>{
	if ((n-1)%3 !== 0 || n%4!==0)
		return "必须输入一个能被4整除，并且减1后能被3整除的数"
	let res = ""
	let g1=g2=g3=[]
	for (let i = 0; i < (n-1)/3; ++i) {
		g2 = []
		for (let j = 0; j < n/4; ++j) {
			g2.push([])
		}
		g1.push(g2)
	}

	//当前第i轮
	for (let i = 0; i < g1.length; ++i) {
		
		//第k名选手
		k:
		for (let k = 0; k < n; ++k) {

			//属于第j组
			j:
			for (let j = 0; j < g1[i].length; ++j) {
				//当前组没人加入
				if (!g1[i][j].length) {
					g1[i][j].push(k)
					continue k
				}
				//当前组满下一组
				if (g1[i][j].length === 4) {
					continue
				}
				//之前轮次如果遇到过下一组
				for (let l = 0; l < i; ++l) {
					for (let m of g1[l]) {
						if (m.includes(k)) {
							for (let u = 0; u < 4; ++u) {
								if (g1[i][j].includes(m[u])) {
									continue j
								}
							}
						}
					}
				}
				g1[i][j].push(k)
				continue k
			}
		}
	}
	for (let l = 0; l < g1.length; ++l) {
		res += `第${l+1}轮：` + JSON.stringify(g1[l]) + `\n`
	}
	return res
}

分组2=(n)=>{
	if ((n-1)%3 !== 0 || n%4!==0)
		return "必须输入一个能被4整除，并且减1后能被3整除的数"
	let couples = []
	let fn = (d)=>{
		if (d > n)
			return
		else {
			for (let i = d+1; i <= n; ++i) {
				couples.push([d,i])
			}
			fn(d+1)
		}
	}
	fn(1)
	let arr = []
	let fn2 = ()=>{
		let current = []
		let values
		for (let i = 0; i < couples.length; ++i) {
			if (!couples[i])
				continue
			values = current
			if (current.length === 0) {
				current.push(couples[i])
				delete couples[i]
				continue
			}
			if (current.length === 1 && couples[i].includes(values[0][0])) {
				current.push(couples[i])
				delete couples[i]
				continue
			}
			if (current.length === 2 && couples[i].includes(values[0].filter(v => values[1].includes(v))[0])){
				current.push(couples[i])
				delete couples[i]
				continue
			}
			if (current.length === 3) {
				let diff = values[0].concat(values[1]).filter(v => !values[0].includes(v) || !values[1].includes(v))
				if (couples[i].includes(diff[0]) && couples[i].includes(diff[1])) {
					current.push(couples[i])
					delete couples[i]
					continue
				}
			}
			if (current.length === 4) {
				let diff = values[0].concat(values[2]).filter(v => !values[0].includes(v) || !values[2].includes(v))
				if (couples[i].includes(diff[0]) && couples[i].includes(diff[1])) {
					current.push(couples[i])
					delete couples[i]
					continue
				}
			}
			if (current.length === 5) {
				let diff = values[3].concat(values[4]).filter(v => !values[3].includes(v) || !values[4].includes(v))
				if (couples[i].includes(diff[0]) && couples[i].includes(diff[1])) {
					current.push(couples[i])
					delete couples[i]
					break
				}
			}
		}
		if (!current.length)
			return
		console.log(current)
		let tmp = []
		for (let v of current) {
			if (!tmp.includes(v[0]))
				tmp.push(v[0])
			if (!tmp.includes(v[1]))
				tmp.push(v[1])
		}
		arr.push(tmp)
		fn2()
	}
	fn2()
	return arr
}
