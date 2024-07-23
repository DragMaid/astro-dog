const express = require('express');
const http = require('http');
const path = require('path');
const reload = require('reload');
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');
const recordDir = path.join(__dirname, 'storage', 'records.json');
const liverecordDir = path.join(__dirname, 'storage', 'live-records.json');
const statDir = path.join(__dirname, 'storage', 'stats.json');

const app = new express();
app.set('port', process.env.PORT || 3000);
app.use('/', express.static(publicDir));
app.get('/records', function(req, res) {
    res.sendFile(recordDir);
});
app.get('/stats', function(req, res) {
    res.sendFile(statDir);
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
            var obj = JSON.parse(data);
            var old_score = obj[name];

            fs.readFile(liverecordDir, 'utf8' , (e, inf) => {
                var container = JSON.parse(inf);
                var new_score = container[name];
                if (new_score == undefined) new_score = 0;
                if (score == new_score) {
                    if (old_score == undefined || old_score <= new_score) {
                        obj[name] = new_score;
                        console.log(name, obj);
                    }
                }
                delete container[name];
                fs.writeFile(liverecordDir, JSON.stringify(container), 'utf8', () => {});
                fs.writeFile(recordDir, JSON.stringify(obj), 'utf8', () => {})
            });

            respond(res, 200);
            sent = true;
        }
    })
    setTimeout(function(){ if (!sent) respond(res, 500) }, 3000);
})

app.post("/live", function(req, res) {
    var sent = false;
    const name = req.body.name;
    const score = req.body.score;
    fs.readFile(liverecordDir, 'utf8', (err, data) => {
        if (err) console.log(err);
        else {
            obj = JSON.parse(data);
            var old_score = obj[name];
            if (old_score == undefined) obj[name] = 1;
            else obj[name]++;
            var json = JSON.stringify(obj);
            fs.writeFile(liverecordDir, json, 'utf8', () => {});
            respond(res, 200);
            sent = true;
        }
    });
    setTimeout(function(){ if (!sent) respond(res, 500) }, 3000);
})

function respond(res, code) {
	res.writeHead(code, {
		"Content-Type": "text/plain",
		"Access-Control-Allow-Origin": "*" 
	}); res.end(); 
}

var server = http.createServer(app)
reload(app).then(function(reloadReturned) {
    server.listen(app.get('port'), function() {
        console.log('INFO', 'Web server listening on port ' + app.get('port'))
    })
}).catch(function(err) {
    console.log.log('ERROR', 'Reload could not start, could not start server/sample app\n' + err)
})
