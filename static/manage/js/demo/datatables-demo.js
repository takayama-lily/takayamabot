// Call the dataTables jQuery plugin
$(document).ready(function() {
  fetch('/manage/bot') 
    .then(function(res) { 
        res.json().then(function(data) {
          let html = `<tr><th>key</th><th>value</th></tr>`
            for (let k in data) {
              if (typeof data[k] === 'string') {
                data[k] = data[k].replace(/(https?:\/\/){1}.+[^\]]/g, function(a){
                  return `<a target="_blank"href="${a}">图片</a>`
                })
                let html = `<tr><td>${k}</td><td>${data[k]}</td></tr>`
                $("#dataTable tbody").append(html)
              }
            }
            $('#dataTable').DataTable()
        })
    })
});
