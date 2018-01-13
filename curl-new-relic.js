#!/usr/local/bin/node

var request = require('request');

// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
}

// Configure the request
var options = {
        url: 'https://api.newrelic.com/v2/applications/40142782/applications.json',
//    url: 'https://api.newrelic.com',
    method: 'POST',
    headers:{ //headers,
        'content-type': 'application/json',
	'User-Agent': 'node.js',
	'X-Api-Key': '<api key>'
    },
  "deployment": {
    "revision": "REVISION",
    "changelog": "Testing posting deployments to New Relic",
    "description": "Test Deployment",
    "user": "lkdevops@leankit.com"
  }
}
    


// Start the request
request(options, function (error, response, body) {
    if (!error && response.statusCode != 200) {
        // Print out the response body
        console.log(body)
    }
})
