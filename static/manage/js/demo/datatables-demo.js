// Call the dataTables jQuery plugin
$(document).ready(function() {
  fetch('http://usus.lietxia.bid/bot/sandbox/fn') 
    .then(function(res) { 
        res.json().then(function(data) {
          for (let k in data) {
            if (k.includes("on_"))
              continue
            let codes = data[k].split("\n")
            if (codes.length === 1)
              continue
            if (!["//"].includes(codes[1].trim().substr(0,2)))
              continue
            let params = data[k].slice(data[k].indexOf("(")+1, data[k].indexOf(")")).replace(/\s/g,"").split(",")
            let params2 = data[k].slice(data[k].indexOf("(")+1, data[k].indexOf(")")).replace(/\s/g,"").split(",")
            for (let i in params) {
              if (params[i].includes("="))
                params[i] = params[i].slice(0,params[i].indexOf("="))
            }
            codes.shift()
            let comments = []
            for (let v of codes) {
              if (v.trim().substr(0,2)!=="//")
                break
              comments.push(v.trim().substr(2).trim())
            }
            let html = `<tr><td>${k}</td><td>${comments.join("<br>")}</td><td>.${k}&nbsp;&nbsp;${params.join("&nbsp;&nbsp;")}</td><td>${k}(${params2.join(", ")})</td></tr>`
            $("#dataTable tbody").append(html)
          }
          $('#dataTable').DataTable()
        })
    })
});
