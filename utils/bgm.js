'use strict'
const https = require('https')
const host = 'https://api.bgm.tv'
const api = {
    search: host + '/search/subject/',
    subject: host + '/subject/',
    calendar: host + '/calendar'
}
const type = {
    book:1, anime:2, music:3, game:4, real:6
}

const getCalendar = async (day)=>{
    return new Promise(r=>{
        https.get(api.calendar, (res)=>{
            let json = ''
            res.on('data', d=>{
                json += d
            })
            res.on('end', ()=>{
                try {
                    json = JSON.parse(json)
                    let result = []
                    if (json[day-1]) {
                        day = json[day-1]
                        result.push(day.weekday.cn+'放送：')
                        for (let v of day.items) {
                            v.name_cn = v.name_cn ? v.name_cn : v.name
                            result.push(`${v.name_cn} / ${v.air_date}开始 / 评分${v.rating ? v.rating.score : '未知'}`)
                        }
                    } else {
                        for (let v of json) {
                            result.push(`${v.weekday.cn} 放送 ${v.items.length} 部`)
                        }
                    }
                    r(result.join('\n') + (day ? '' : `\n输入'-新番 1-7'查看周一～周日具体放送表`))
                } catch (e) {
                    r('bgm服务暂时不可用')
                }
            })
        }).on('error', err=>{
            r('bgm服务暂时不可用')
        })
    })
}

const getBangumi = async (t, name)=>{
    t = type[t] ? t : type.anime
    if (!name.includes(`'`))
        name = `'` + name + `'`
    const weekday = ['一','二','三','四','五','六','日']
    return new Promise(r=>{
        https.get(api.search+encodeURIComponent(name)+'?responseGroup=large&max_results=2&type='+type[t], (res)=>{
            let json = ''
            res.on('data', d=>{
                json += d
            })
            res.on('end', ()=>{
                try {
                    json = JSON.parse(json)
                    let result = []
                    if (!json.list) {
                        r('没找到')
                    } else {
                        let v = json.list[0]
                        v.name_cn = v.name_cn ? v.name_cn : v.name
                        result.push(`${v.name_cn} (${v.name})`)
                        result.push(`发行(放送)日${v.air_date}(周${weekday[v.air_weekday-1]}) / 全${!isNaN(v.eps) ? parseInt(v.eps) : '?'}话 / 评分${v.rating ? v.rating.score : '未知'}\n`)
                        result.push(v.summary)
                    }
                    r(result.join('\n'))
                } catch (e) {
                    r('bgm服务暂时不可用')
                }
            })
        }).on('error', err=>{
            r('bgm服务暂时不可用')
        })
    })
}

module.exports = {
    getCalendar: getCalendar,
    getBangumi: getBangumi
}

// getCalendar(7).then((data)=>{
//     console.log(data)
// })

// getBangumi('anime','名侦探柯南').then((data)=>{
//     console.log(data)
// })
