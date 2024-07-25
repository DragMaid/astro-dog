const express = require('express');
const http = require('http');
const path = require('path');
const reload = require('reload');
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');
const recordDir = path.join(__dirname, 'records.json');

const app = new express();
app.set('port', process.env.PORT || 3000);
app.use('/', express.static(publicDir));
app.get('/records', function(req, res) {
    res.sendFile(recordDir);
});
app.use(express.urlencoded({extended:true})); 
app.use(express.json());

app.post("/upload", function(req, res) {
	var sent = false;
    const name = req.body.name;
    const score = req.body.score;
    fs.readFile(recordDir, 'utf8', (err, data) => {
        if (err) console.log(err);
        else {
            obj = JSON.parse(data);
            var old_score = obj[name];
            if (old_score == undefined || old_score < score) obj[name] = score;
            json = JSON.stringify(obj);
            fs.writeFile(recordDir, json, 'utf8', () => {})
            respond(res, 200);
            sent = true;
        }
    })
    setTimeout(function(){ if (!sent) respond(res, 500) }, 3000);
})


function respond(res, code) {
	res.writeHead(code, {
		"Content-Type": "text/plain",
		"Access-Control-Allow-Origin": "*" 
	}); res.end(); 
}

//reload(app).then(function(reloadReturned) {
    //server.listen(app.get('port'), function() {
        //console.log('INFO', 'Web server listening on port ' + app.get('port'))
    //})
//}).catch(function(err) {
    //console.log.log('ERROR', 'Reload could not start, could not start server/sample app\n' + err)
//})

var server = http.createServer(app)
server.listen(app.get('port'), function() {
    console.log('INFO', 'Web server listening on port ' + app.get('port'))
})
