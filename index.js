'use strict';

/*
docker build -t botkit-starter-facebook .


docker run --add-host=graph.facebook.com:10.0.75.1 -p 3000:3000 -it botkit-starter-facebook


*/

var express = require('express');
var request = require('request');
var https = require('https');
var http = require('http');
var url = require('url');
var fs = require('fs');
var bodyParser = require('body-parser');
var app = express();


app.use(bodyParser.json());

require('./lib/facebookmock')(app);

var options = {
  key: fs.readFileSync('127.0.0.1.key'),
  cert: fs.readFileSync('127.0.0.1.cert')
};

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);

console.log('Running ...');

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.on('exit', (code) => {
  console.log('About to exit with code: ' + code);
});

process.stdin.on('data', function (chunk) {
	chunk = chunk.trim();
	
	if (!chunk) return;
	
	if (chunk === 'exit') {
		
		return;
	}

	var ts = (new Date()).getTime();
	
	var options = {
		uri: 'http://127.0.0.1:3000/facebook/receive',
		method: 'POST',
		json: 
			{
				"object":"page",
				"entry":[
					{
						"id":"PAGE_ID",
						"time": ts,
						"messaging":[		
							{
								"sender":{
									"id": userProfileId
								},
								"recipient":{
									"id":"PAGE_ID"
								},
								"timestamp": ts,
								"message":{
									"mid":"mid." + ts,
									"seq": outputSeq++,
									"text": chunk
								}
							}
						]
					}
				]
			}
	};
	request(options, function (error, response, body) {
		if (error)
			console.log(error);
		else if (body)
			console.log(body);
		else
			console.log(response);
	});
});











