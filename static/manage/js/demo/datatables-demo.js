// Call the dataTables jQuery plugin
$(document).ready(function() {
  fetch('/manage/bot') 
    .then(function(res) { 
        res.json().then(function(data) {
          let html = `<tr><th>key</th><th>value</th></tr>`
            for (let k in data) {
              if (typeof data[k] === 'string') {
                let html = `<tr><td>${k}</td><td>${data[k]}</td></tr>`
                $("#dataTable tbody").append(html)
              }
            }
            $('#dataTable').DataTable()
        })
    })
});
