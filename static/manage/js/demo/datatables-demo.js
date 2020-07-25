// Call the dataTables jQuery plugin
$(document).ready(function() {
  fetch('http://usus.lietxia.bid/bot/sandbox/fn') 
    .then(function(res) { 
        res.json().then(function(data) {
          for (let k in data) {
            if (k.includes("before") || k.includes("after") || k.includes("tmp") || k.includes("on_") || k.includes("current_called_api"))
              continue
            let params = data[k].slice(data[k].indexOf("(")+1, data[k].indexOf(")")).replace(/\s/g,"").split(",")
            let params2 = data[k].slice(data[k].indexOf("(")+1, data[k].indexOf(")")).replace(/\s/g,"").split(",")
            for (let i in params) {
              if (params[i].includes("="))
                params[i] = params[i].slice(0,params[i].indexOf("="))
            }
            let html = `<tr><td>${k}</td><td>.${k}&nbsp;&nbsp;${params.join("&nbsp;&nbsp;")}</td><td>${k}(${params2.join(", ")})</td><td>施工中</td></tr>`
            $("#dataTable tbody").append(html)
          }
          $('#dataTable').DataTable()
        })
    })
});
